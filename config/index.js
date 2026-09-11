require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'glish_ai_super_secret_jwt_key_2026_dev',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_API_VERSION: process.env.GEMINI_API_VERSION || 'v1alpha',
  GEMINI_LIVE_MODEL: process.env.GEMINI_MODEL || 'models/gemini-2.0-flash-exp',
  GEMINI_FALLBACK_MODEL: 'models/gemini-3.1-flash-lite',
};

config.GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${config.GEMINI_API_VERSION}.GenerativeService.BidiGenerateContent?key=${config.GEMINI_API_KEY}`;

module.exports = config;
