const express = require('express');
const db = require('../lib/db');
const { authenticateToken, optionalAuth } = require('./auth.routes');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  if (!req.user) return res.json([]);
  res.json(db.getVocab(req.user.id));
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const item = db.saveVocab(req.body, req.user.id);
    res.json(item);
  } catch (err) {
    console.error('[Vocab Save Error]:', err);
    res.status(500).json({ error: 'Failed to save vocabulary' });
  }
});

router.patch('/:id/toggle', authenticateToken, (req, res) => {
  try {
    const updated = db.toggleVocab(req.params.id, req.user.id);
    res.json(updated);
  } catch (err) {
    console.error('[Vocab Toggle Error]:', err);
    res.status(500).json({ error: 'Failed to toggle vocabulary item' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.deleteVocab(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    console.error('[Vocab Delete Error]:', err);
    res.status(500).json({ error: 'Failed to delete vocabulary item' });
  }
});

module.exports = router;
