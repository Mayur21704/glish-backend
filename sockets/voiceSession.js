const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { SCENARIO_PROMPTS, ALL_TOOLS_DECLARATION } = require('../services/prompt.service');
const { callGemini } = require('../services/gemini.service');

function setupVoiceWebSocket(wss) {
  wss.on('connection', (clientWs, req) => {
    const urlParts = (req.url || '').split('?');
    const urlParams = new URLSearchParams(urlParts[1] || '');
    const chosenVoice = urlParams.get('voice') || 'Aoede';
    const chosenScenario = urlParams.get('scenario') || 'free';
    const scenarioInstruction = SCENARIO_PROMPTS[chosenScenario] || SCENARIO_PROMPTS.free;

    const token = urlParams.get('token');
    let currentUserId = 1;
    let currentUserName = 'Learner';

    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        currentUserId = decoded.id;
        currentUserName = decoded.name;
      } catch (e) {
        console.warn('[WS Auth] Token invalid, using guest credentials');
      }
    } else if (urlParams.get('userId')) {
      currentUserId = parseInt(urlParams.get('userId'), 10) || 1;
    }

    console.log(`[WS] Client connected (User: ${currentUserName}, ID: ${currentUserId}, Scenario: ${chosenScenario})`);

    let geminiWs = null;
    let isFallbackMode = false;
    let conversationHistory = [];
    let lastAiResponseText = '';
    let lastAiResponseTime = 0;

    function activateFallback(reason) {
      console.log(`[WS] Activating Fallback Engine (${config.GEMINI_FALLBACK_MODEL}). Reason: ${reason}`);
      isFallbackMode = true;
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'fallback_activated',
          engine: config.GEMINI_FALLBACK_MODEL,
          message: `Connected via ${config.GEMINI_FALLBACK_MODEL} Fallback Engine`
        }));
      }
    }

    try {
      geminiWs = new WebSocket(config.GEMINI_WS_URL);
    } catch (err) {
      activateFallback('Failed to initialize Gemini Live WS');
    }

    if (geminiWs) {
      geminiWs.on('open', () => {
        console.log('[WS] Connected to Gemini Multimodal Live API');
        const setupMessage = {
          setup: {
            model: config.GEMINI_LIVE_MODEL,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: chosenVoice } }
              }
            },
            systemInstruction: { parts: [{ text: scenarioInstruction }] },
            tools: [ALL_TOOLS_DECLARATION]
          }
        };
        geminiWs.send(JSON.stringify(setupMessage));
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'status', message: 'Connected to Gemini Live' }));
        }
      });

      geminiWs.on('message', (data) => {
        try {
          if (clientWs.readyState === WebSocket.OPEN && !isFallbackMode) {
            const msgString = data.toString();
            const parsed = JSON.parse(msgString);

            if (parsed.toolCall && parsed.toolCall.functionCalls) {
              const responses = parsed.toolCall.functionCalls.map(fc => ({
                id: fc.id,
                name: fc.name,
                response: { output: { success: true } }
              }));
              geminiWs.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
            }
            clientWs.send(msgString);
          }
        } catch (err) {
          console.error('[WS] Relay error:', err);
        }
      });

      geminiWs.on('close', (code, reason) => {
        if (!isFallbackMode) activateFallback(`Live closed code ${code}`);
      });

      geminiWs.on('error', (err) => {
        if (!isFallbackMode) activateFallback(`Live error: ${err.message}`);
      });
    }

    clientWs.on('message', async (data) => {
      try {
        const msgString = data.toString();
        const parsed = JSON.parse(msgString);

        // History restoration
        if (parsed.type === 'restore_history' && Array.isArray(parsed.history)) {
          conversationHistory = parsed.history.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }));
          console.log(`[WS] Restored ${conversationHistory.length} turns of history for "${chosenScenario}".`);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'history_restored',
              count: conversationHistory.length,
              message: `Restored ${conversationHistory.length} prior conversation turns.`
            }));
          }
          return;
        }

        if (parsed.transcript || parsed.textInput) {
          const userPrompt = (parsed.transcript || parsed.textInput).trim();
          if (!userPrompt) return;

          // 🛡️ Server-Side Echo Shield:
          // Drop any prompt matching previous AI speech from laptop speaker loopback
          if (lastAiResponseText) {
            const normPrompt = userPrompt.toLowerCase().replace(/[^\w]/g, '');
            const normAi = lastAiResponseText.toLowerCase().replace(/[^\w]/g, '');
            if (normPrompt.length > 8 && (normAi.includes(normPrompt) || normPrompt.includes(normAi))) {
              console.warn(`[Server EchoShield] 🛡️ Blocked speaker echo of AI response from entering turn: "${userPrompt}"`);
              return;
            }
          }

          console.log(`[User Prompt Received] "${userPrompt}" (Mode: ${isFallbackMode ? 'Fallback REST' : 'Gemini Live WS'})`);

          if (isFallbackMode) {
            const fallbackRes = await callGemini(userPrompt, conversationHistory, chosenScenario);

            // 1. Tool result cards
            if (fallbackRes.toolResults.length > 0) {
              clientWs.send(JSON.stringify({
                type: 'fallback_response',
                text: fallbackRes.text || null,
                toolResults: fallbackRes.toolResults
              }));
            }

            // 2. 2nd pass for conversational answer if only tools were returned
            if (fallbackRes.toolResults.length > 0 && (!fallbackRes.text || !fallbackRes.text.trim())) {
              const fnResponseParts = fallbackRes.toolResults.map(tr => ({
                functionResponse: { name: tr.name, response: { status: 'logged' } }
              }));
              const toolHistory = [
                ...conversationHistory,
                { role: 'user', parts: [{ text: userPrompt }] },
                fallbackRes.modelTurn,
                { role: 'user', parts: fnResponseParts }
              ];
              const secondRes = await callGemini("Now directly answer the user's question or continue the conversation in under 25 words.", toolHistory, chosenScenario);
              if (secondRes.text) {
                fallbackRes.text = secondRes.text;
                clientWs.send(JSON.stringify({
                  type: 'fallback_response',
                  text: secondRes.text,
                  toolResults: []
                }));
              }
            } else if (fallbackRes.text && fallbackRes.toolResults.length === 0) {
              clientWs.send(JSON.stringify({
                type: 'fallback_response',
                text: fallbackRes.text,
                toolResults: []
              }));
            }

            if (fallbackRes.text) {
              lastAiResponseText = fallbackRes.text;
              lastAiResponseTime = Date.now();
            }

            conversationHistory.push({ role: 'user', parts: [{ text: userPrompt }] });
            conversationHistory.push({ role: 'model', parts: [{ text: fallbackRes.text || "Got it!" }] });
            if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);
          } else {
            // Live WebSocket turns
            if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
              const liveClientTurn = {
                clientContent: {
                  turns: [
                    {
                      role: 'user',
                      parts: [{ text: userPrompt }]
                    }
                  ],
                  turnComplete: true
                }
              };
              geminiWs.send(JSON.stringify(liveClientTurn));
              console.log('[WS] Dispatched clientContent turn to Gemini Live WS');
            } else {
              activateFallback('Gemini Live WS was not open when prompt arrived');
              const fallbackRes = await callGemini(userPrompt, conversationHistory, chosenScenario);
              clientWs.send(JSON.stringify({
                type: 'fallback_response',
                text: fallbackRes.text || "I hear you! Let's continue.",
                toolResults: fallbackRes.toolResults || []
              }));
            }
          }
        } else if (parsed.realtimeInput) {
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(msgString);
          }
        }
      } catch (err) {
        console.error('[WS] Message handling error:', err);
      }
    });

    clientWs.on('close', () => {
      if (geminiWs && geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
    });
  });
}

module.exports = {
  setupVoiceWebSocket,
};
