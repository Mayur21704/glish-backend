const https = require('https');
const config = require('../config');
const { SCENARIO_PROMPTS, ALL_TOOLS_DECLARATION } = require('./prompt.service');

/**
 * Execute Gemini REST Generation with Tool Calling
 */
function callGemini(promptText, history = [], scenarioKey = 'free') {
  return new Promise((resolve, reject) => {
    const scenarioPrompt = SCENARIO_PROMPTS[scenarioKey] || SCENARIO_PROMPTS.free;
    const trimmedHistory = history.length > 10 ? history.slice(-10) : history;

    const contents = [
      ...trimmedHistory,
      { role: 'user', parts: [{ text: promptText }] }
    ];

    const postData = JSON.stringify({
      systemInstruction: { parts: [{ text: scenarioPrompt }] },
      contents: contents,
      tools: [ALL_TOOLS_DECLARATION],
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${config.GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.error) {
            reject(new Error(data.error.message));
            return;
          }

          let resultText = '';
          let toolResults = [];
          const candidateContent = data.candidates && data.candidates[0]?.content;

          if (candidateContent && candidateContent.parts) {
            for (const part of candidateContent.parts) {
              if (part.text) resultText += part.text;
              if (part.functionCall) {
                toolResults.push({
                  name: part.functionCall.name,
                  args: part.functionCall.args
                });
              }
            }
          }

          if (resultText || toolResults.length > 0) {
            resolve({ text: resultText, toolResults, modelTurn: candidateContent });
          } else {
            reject(new Error('No response content returned from Gemini'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

module.exports = {
  callGemini,
};
