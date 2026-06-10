const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET - Listar todos os contratos (com nome do residente)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT c.*, r.full_name as resident_name
      FROM contracts c
      LEFT JOIN residents r ON c.resident_id = r.id
    `;
    const params = [];
    if (status) {
      sql += ` WHERE c.contract_status = $1`;
      params.push(status);
    }
    sql += ` ORDER BY c.created_at DESC`;

    const result = await query(sql, params);
    res.json({ success: true, total: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Erro ao listar contratos:', err.message);
    res.status(500).json({ error: 'Erro ao listar contratos' });
  }
});

// POST - Criar novo contrato
router.post('/', authenticate, requireRole('admin', 'comercial'), async (req, res) => {
  try {
    const {
      resident_id, start_date, end_date, monthly_fee,
      payment_method, responsible_name, health_plan, contract_status
    } = req.body;

    if (!resident_id || !start_date || !monthly_fee) {
      return res.status(400).json({ error: 'Campos obrigatórios: resident_id, start_date, monthly_fee' });
    }

    // Gerar número de contrato sequencial: VC-ANO-XXXX
    const countResult = await query(`SELECT COUNT(*) FROM contracts`);
    const seq = String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0');
    const contractNumber = `VC-${new Date().getFullYear()}-${seq}`;

    const result = await query(
      `INSERT INTO contracts
       (resident_id, contract_number, start_date, end_date, contract_status, monthly_fee, payment_method, responsible_name, health_plan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        resident_id, contractNumber, start_date, end_date || null,
        contract_status || 'draft', monthly_fee,
        payment_method || null, responsible_name || null, health_plan || null
      ]
    );

    res.status(201).json({ success: true, message: 'Contrato criado', data: result.rows[0] });
  } catch (err) {
    console.error('Erro ao criar contrato:', err.message);
    if (err.message.includes('unique')) {
      return res.status(409).json({ error: 'Este residente já possui um contrato' });
    }
    res.status(500).json({ error: 'Erro ao criar contrato', details: err.message });
  }
});

// PATCH - Atualizar status do contrato (assinar, concluir, etc)
router.patch('/:id/status', authenticate, requireRole('admin', 'comercial'), async (req, res) => {
  try {
    const { contract_status, signed } = req.body;
    const result = await query(
      `UPDATE contracts SET contract_status = COALESCE($1, contract_status), signed = COALESCE($2, signed)
       WHERE id = $3 RETURNING *`,
      [contract_status || null, signed != null ? signed : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contrato não encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar contrato' });
  }
});

module.exports = router;
