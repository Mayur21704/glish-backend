# glish-backend

Backend server for glish AI English Communication & Voice Studio.

## Architecture
- Express.js HTTP API (`/api/auth`, `/api/sessions`, `/api/vocab`, `/api/stats`)
- WebSocket Proxy to Google Gemini Multimodal Live API & Fallback Engine
- SQLite (`better-sqlite3`) persistent data store with WAL mode
- JWT Token Authentication & User Isolation

## Environment Variables
Copy `.env.example` to `.env` and supply your `GEMINI_API_KEY`:
```bash
cp .env.example .env
```

## Running the Backend
```bash
npm install
npm run dev
```
