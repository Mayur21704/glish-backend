const express = require('express');
const db = require('../lib/db');
const { optionalAuth } = require('./auth.routes');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.json({ totalWords: 0, totalSessions: 0, avgAccuracy: 90, streakDays: 0, role: 'Learner' });
  }
  res.json(db.getStats(req.user.id));
});

module.exports = router;
