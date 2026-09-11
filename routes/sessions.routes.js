const express = require('express');
const db = require('../lib/db');
const { authenticateToken, optionalAuth } = require('./auth.routes');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  if (!req.user) return res.json([]);
  res.json(db.getSessions(req.user.id));
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const session = db.saveSession(req.body, req.user.id);
    res.json(session);
  } catch (err) {
    console.error('[Session Save Error]:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

module.exports = router;
