const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/:resident_id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM geriatric_scales WHERE resident_id = $1 ORDER BY evaluated_at DESC LIMIT 1', [req.params.resident_id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole('admin', 'assistencial'), async (req, res) => {
  try {
    const { resident_id, morse_score, morse_level, braden_score, braden_level, katz_score, katz_level } = req.body;
    if (!resident_id) return res.status(400).json({ error: 'resident_id obrigatório' });
    const result = await query('INSERT INTO geriatric_scales (resident_id, morse_score, morse_level, braden_score, braden_level, katz_score, katz_level, evaluated_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [resident_id, morse_score, morse_level, braden_score, braden_level, katz_score, katz_level, req.user.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
