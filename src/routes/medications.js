const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/resident/:resident_id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM medications WHERE resident_id = $1 ORDER BY start_date DESC', [req.params.resident_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole('admin', 'assistencial'), async (req, res) => {
  try {
    const { resident_id, medication_name, dose, dose_unit, frequency, route, start_date } = req.body;
    if (!resident_id || !medication_name || !start_date) return res.status(400).json({ error: 'Campos obrigatórios' });
    const result = await query('INSERT INTO medications (resident_id, medication_name, dose, dose_unit, frequency, route, start_date, prescribed_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [resident_id, medication_name, dose, dose_unit, frequency, route, start_date, req.user.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
