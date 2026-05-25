const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT id, full_name, birth_date, room, status, created_at FROM residents WHERE unit_id = $1', [req.user.unit_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const resident = await query('SELECT * FROM residents WHERE id = $1', [req.params.id]);
    if (!resident.rows.length) return res.status(404).json({ error: 'Não encontrado' });
    const r = resident.rows[0];
    const identification = await query('SELECT * FROM resident_identification WHERE resident_id = $1', [req.params.id]);
    const medications = await query('SELECT * FROM medications WHERE resident_id = $1 AND active = true', [req.params.id]);
    res.json({ resident: r, identification: identification.rows[0], medications: medications.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole('admin', 'comercial'), async (req, res) => {
  try {
    const { full_name, birth_date, room } = req.body;
    if (!full_name || !birth_date) return res.status(400).json({ error: 'Nome e data obrigatórios' });
    const result = await query('INSERT INTO residents (unit_id, full_name, birth_date, room, created_by_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [req.user.unit_id, full_name, birth_date, room || null, req.user.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
