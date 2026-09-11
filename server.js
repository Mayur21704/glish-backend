const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const config = require('./config');

// Modular Route Handlers
const { router: authRouter } = require('./routes/auth.routes');
const sessionsRouter = require('./routes/sessions.routes');
const vocabRouter = require('./routes/vocab.routes');
const statsRouter = require('./routes/stats.routes');
const booksRouter = require('./routes/books.routes');

// WebSocket Turn-Taking Orchestrator
const { setupVoiceWebSocket } = require('./sockets/voiceSession');

const app = express();
const server = http.createServer(app);

// Global Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/vocab', vocabRouter);
app.use('/api/stats', statsRouter);
app.use('/api', booksRouter);

// Health Check for AWS ALB / ECS
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// WebSocket Server
const wss = new WebSocket.Server({ server, path: '/ws' });
setupVoiceWebSocket(wss);

// Server Bootstrap
server.listen(config.PORT, () => {
  console.log(`====================================================`);
  console.log(` glish AI Enterprise Backend running on http://localhost:${config.PORT}`);
  console.log(` WebSocket Orchestrator listening on ws://localhost:${config.PORT}/ws`);
  console.log(`====================================================`);
});

module.exports = { app, server };
