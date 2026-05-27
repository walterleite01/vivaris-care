const { query } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function createMoment(req, res) {
  console.log('==> POST /api/moments');
  console.log('==> Body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      resident_id, moment_type, title, description,
      media_url, media_type, audience
    } = req.body;

    if (!resident_id || !moment_type || !title) {
      return res.status(400).json({ 
        error: 'Campos obrigatorios: resident_id, moment_type, title' 
      });
    }

    const momentId = uuidv4();

    await query(
      `INSERT INTO timeline_moments 
       (id, resident_id, posted_by, moment_type, title, description, media_url, media_type, audience, approved, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())`,
      [
        momentId, resident_id, req.user.id, moment_type, title,
        description || null, media_url || null, media_type || null,
        audience || 'family_visible'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Momento registrado',
      moment_id: momentId
    });

  } catch (error) {
    console.error('==> ERRO createMoment:', error.message);
    res.status(500).json({ error: 'Erro ao criar momento', details: error.message });
  }
}

async function getMoments(req, res) {
  try {
    const { resident_id } = req.params;
    
    let audienceFilter = '';
    if (req.user.role === 'familiar') {
      audienceFilter = `AND tm.audience = 'family_visible'`;
    }

    const result = await query(
      `SELECT 
        tm.id, tm.moment_type, tm.title, tm.description, tm.media_url, tm.media_type,
        tm.audience, tm.approved, tm.created_at,
        u.full_name as posted_by_name
       FROM timeline_moments tm
       LEFT JOIN users u ON tm.posted_by = u.id
       WHERE tm.resident_id = $1 AND tm.approved = true ${audienceFilter}
       ORDER BY tm.created_at DESC
       LIMIT 50`,
      [resident_id]
    );

    res.json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar momentos' });
  }
}

module.exports = { createMoment, getMoments };
