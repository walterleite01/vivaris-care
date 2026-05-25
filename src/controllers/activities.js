/* ============================================
   ACTIVITIES CONTROLLER
   ============================================ */

const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CREATE ACTIVITY
// ============================================

exports.createActivity = async (req, res) => {
  try {
    const { resident_id, activity_type, description, photo_url, video_url } = req.body;

    // Validações
    if (!resident_id || !activity_type || !description) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Apenas assistencial pode registrar atividades
    if (req.user.role !== 'assistencial' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas assistência pode registrar atividades' });
    }

    const activityId = uuidv4();

    const result = await pool.query(
      `INSERT INTO daily_activities (id, resident_id, activity_type, description, photo_url, video_url, created_by, created_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'completed')
       RETURNING *`,
      [activityId, resident_id, activity_type, description, photo_url, video_url, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Atividade registrada com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Erro ao registrar atividade' });
  }
};

// ============================================
// GET ACTIVITIES BY RESIDENT
// ============================================

exports.getActivitiesByResident = async (req, res) => {
  try {
    const { resident_id } = req.params;
    const { days = 7 } = req.query;

    const result = await pool.query(
      `SELECT * FROM daily_activities
       WHERE resident_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [resident_id]
    );

    res.json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades' });
  }
};

// ============================================
// GET TODAY'S ACTIVITIES
// ============================================

exports.getTodayActivities = async (req, res) => {
  try {
    const { resident_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM daily_activities
       WHERE resident_id = $1 AND DATE(created_at) = CURRENT_DATE
       ORDER BY created_at ASC`,
      [resident_id]
    );

    res.json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching today activities:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades de hoje' });
  }
};

// ============================================
// UPDATE ACTIVITY
// ============================================

exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, status } = req.body;

    // Apenas quem criou ou admin podem editar
    const checkResult = await pool.query(
      'SELECT created_by FROM daily_activities WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    if (req.user.role !== 'admin' && checkResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta atividade' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (description) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(description);
      paramIndex++;
    }

    if (status) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(status);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhuma atualização fornecida' });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await pool.query(
      `UPDATE daily_activities SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Atividade atualizada com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Erro ao atualizar atividade' });
  }
};
