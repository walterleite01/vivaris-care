const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.createResident = async (req, res) => {
  try {
    const {
      full_name, birth_date, room,
      cpf, gender, phone, email, address, city, state,
      responsible_name, responsible_phone, health_plan, monthly_cost, blood_type,
      diagnosis_name, icd10_code, diagnosis_date,
      medication_name, dose, dose_unit, frequency, route, start_date,
      vaccine_name, application_date, batch_number,
      substance, allergen_type, severity, reaction_description,
      morse_score, braden_score, katz_score
    } = req.body;

    if (!full_name || !birth_date) {
      return res.status(400).json({ error: 'Nome e data de nascimento obrigatórios' });
    }

    const residentId = uuidv4();
    const unitId = req.user.unit_id;

    // 1. RESIDENTS
    await pool.query(
      `INSERT INTO residents (id, unit_id, full_name, birth_date, room, status, created_by_id, created_at)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW())`,
      [residentId, unitId, full_name, birth_date, room, req.user.id]
    );

    // 2. RESIDENT_IDENTIFICATION
    if (cpf || phone) {
      await pool.query(
        `INSERT INTO resident_identification (id, resident_id, full_name, cpf, gender, birth_date, phone, email, address, city, state, responsible_name, responsible_phone, health_plan, monthly_cost, blood_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`,
        [uuidv4(), residentId, full_name, cpf, gender, birth_date, phone, email, address, city, state, responsible_name, responsible_phone, health_plan, monthly_cost, blood_type]
      );
    }

    // 3. CLINICAL_HISTORY
    if (diagnosis_name) {
      await pool.query(
        `INSERT INTO clinical_history (id, resident_id, diagnosis_name, icd10_code, diagnosis_date, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW())`,
        [uuidv4(), residentId, diagnosis_name, icd10_code, diagnosis_date]
      );
    }

    // 4. MEDICATIONS
    if (medication_name) {
      await pool.query(
        `INSERT INTO medications (id, resident_id, medication_name, dose, dose_unit, frequency, route, start_date, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())`,
        [uuidv4(), residentId, medication_name, dose, dose_unit, frequency, route, start_date]
      );
    }

    // 5. ALLERGIES
    if (substance) {
      await pool.query(
        `INSERT INTO allergies (id, resident_id, substance, type, severity, reaction_description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [uuidv4(), residentId, substance, allergen_type, severity, reaction_description]
      );
    }

    // 6. VACCINATION
    if (vaccine_name) {
      await pool.query(
        `INSERT INTO vaccination (id, resident_id, vaccine_name, application_date, batch_number, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uuidv4(), residentId, vaccine_name, application_date, batch_number]
      );
    }

    // 7. GERIATRIC_SCALES
    if (morse_score || braden_score || katz_score) {
      await pool.query(
        `INSERT INTO geriatric_scales (id, resident_id, morse_score, morse_level, braden_score, braden_level, katz_score, katz_level, evaluated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          uuidv4(), 
          residentId,
          parseInt(morse_score) || 0,
          getMorseLevel(morse_score),
          parseInt(braden_score) || 0,
          getBradenLevel(braden_score),
          parseInt(katz_score) || 0,
          getKatzLevel(katz_score)
        ]
      );
    }

    // 8. RESIDENT_RISKS
    await pool.query(
      `INSERT INTO resident_risks (id, resident_id, fall_risk_level, pressure_ulcer_risk_level, dehydration_risk_level, malnutrition_risk_level, infection_risk_level, last_assessment_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        uuidv4(),
        residentId,
        getMorseLevel(morse_score),
        getBradenLevel(braden_score),
        'low',
        'low',
        'low'
      ]
    );

    // 9. DAILY_ACTIVITIES (Registro de criação)
    await pool.query(
      `INSERT INTO daily_activities (id, resident_id, activity_type, activity_date, description, status, created_at)
       VALUES ($1, $2, 'registration', CURRENT_DATE, 'Residente cadastrado no sistema', 'completed', NOW())`,
      [uuidv4(), residentId]
    );

    res.status(201).json({
      success: true,
      message: '✅ RESIDENTE SALVO NO BANCO COM SUCESSO!',
      resident_id: residentId,
      data: { id: residentId, full_name, birth_date }
    });

  } catch (error) {
    console.error('Error creating resident:', error.message);
    res.status(500).json({ error: 'Erro ao criar residente', details: error.message });
  }
};

exports.getResidents = async (req, res) => {
  try {
    const unitId = req.user.unit_id;
    const result = await pool.query(
      `SELECT r.*, gs.morse_score, gs.braden_score, gs.katz_score
       FROM residents r
       LEFT JOIN geriatric_scales gs ON r.id = gs.resident_id
       WHERE r.unit_id = $1
       ORDER BY r.created_at DESC`,
      [unitId]
    );
    res.json({ success: true, total: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar residentes' });
  }
};

exports.getResidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, ri.*, ch.*, gs.morse_score, gs.braden_score, gs.katz_score
       FROM residents r
       LEFT JOIN resident_identification ri ON r.id = ri.resident_id
       LEFT JOIN clinical_history ch ON r.id = ch.resident_id
       LEFT JOIN geriatric_scales gs ON r.id = gs.resident_id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Residente não encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar residente' });
  }
};

exports.updateResident = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, room } = req.body;
    if (!full_name && !room) {
      return res.status(400).json({ error: 'Forneça dados para atualizar' });
    }
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (full_name) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(full_name);
      paramIndex++;
    }
    if (room) {
      updates.push(`room = $${paramIndex}`);
      values.push(room);
      paramIndex++;
    }
    updates.push(`updated_at = NOW()`);
    values.push(id);
    await pool.query(`UPDATE residents SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
    res.json({ success: true, message: 'Atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
};

function getMorseLevel(score) {
  score = parseInt(score) || 0;
  if (score < 25) return 'low';
  if (score < 50) return 'medium';
  return 'high';
}

function getBradenLevel(score) {
  score = parseInt(score) || 0;
  if (score >= 23) return 'minimal';
  if (score >= 19) return 'light';
  if (score >= 15) return 'moderate';
  return 'high';
}

function getKatzLevel(score) {
  score = parseInt(score) || 0;
  if (score === 6) return 'independent';
  if (score >= 4) return 'semi_dependent';
  return 'dependent';
}

module.exports = { createResident: exports.createResident, getResidents: exports.getResidents, getResidentById: exports.getResidentById, updateResident: exports.updateResident };
