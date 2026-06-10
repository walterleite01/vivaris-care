const { query } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function createEvent(req, res) {
  console.log('==> POST /api/timeline');
  console.log('==> Body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      resident_id, event_type, title, content,
      audience, is_critical, tags
    } = req.body;

    if (!resident_id || !event_type || !title || !content) {
      return res.status(400).json({ 
        error: 'Campos obrigatorios: resident_id, event_type, title, content' 
      });
    }

    const eventId = uuidv4();
    const authorType = req.user.role === 'assistencial' ? 'nurse' : 
                       req.user.role === 'medico' ? 'doctor' :
                       req.user.role || 'nurse';

    await query(
      `INSERT INTO timeline_events 
       (id, resident_id, author_id, author_type, event_type, title, content, audience, is_critical, tags, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        eventId, resident_id, req.user.id, authorType, event_type,
        title, content, audience || 'internal_only',
        is_critical || false, tags || []
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Evento registrado',
      event_id: eventId,
      data: { id: eventId, resident_id, event_type, title }
    });

    // Tempo real: notifica todos na sala do residente
    const io = req.app.get('io');
    if (io) {
      io.to(`resident:${resident_id}`).emit('new_timeline_event', {
        id: eventId, resident_id, event_type, title, content,
        audience: audience || 'internal_only',
        is_critical: is_critical || false,
        author_name: req.user.full_name,
        created_at: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('==> ERRO createEvent:', error.message);
    res.status(500).json({ error: 'Erro ao criar evento', details: error.message });
  }
}

async function getTimeline(req, res) {
  try {
    const { resident_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    let audienceFilter = '';
    if (req.user.role === 'familiar') {
      audienceFilter = `AND te.audience = 'family_visible'`;
    } else if (req.user.role === 'comercial') {
      audienceFilter = `AND te.audience IN ('internal_only', 'admin_only')`;
    }

    const result = await query(
      `SELECT 
        te.id, te.event_type, te.title, te.content, te.audience, te.is_critical, te.tags,
        te.created_at, te.updated_at,
        u.full_name as author_name, u.role as author_role,
        te.author_type
       FROM timeline_events te
       LEFT JOIN users u ON te.author_id = u.id
       WHERE te.resident_id = $1 ${audienceFilter}
       ORDER BY te.created_at DESC
       LIMIT $2 OFFSET $3`,
      [resident_id, limit, offset]
    );

    res.json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('==> ERRO getTimeline:', error.message);
    res.status(500).json({ error: 'Erro ao buscar timeline', details: error.message });
  }
}

async function addComment(req, res) {
  try {
    const { event_id } = req.params;
    const { content, visibility } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Conteudo e obrigatorio' });
    }

    const commentId = uuidv4();
    const authorType = req.user.role === 'familiar' ? 'family' : 
                       req.user.role === 'assistencial' ? 'nurse' : 
                       req.user.role || 'nurse';

    await query(
      `INSERT INTO timeline_comments 
       (id, event_id, author_id, author_type, content, visibility, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [commentId, event_id, req.user.id, authorType, content, visibility || 'family_visible']
    );

    res.status(201).json({
      success: true,
      message: 'Comentario adicionado',
      comment_id: commentId
    });

  } catch (error) {
    console.error('==> ERRO addComment:', error.message);
    res.status(500).json({ error: 'Erro ao adicionar comentario', details: error.message });
  }
}

async function getComments(req, res) {
  try {
    const { event_id } = req.params;

    let visibilityFilter = '';
    if (req.user.role === 'familiar') {
      visibilityFilter = `AND tc.visibility = 'family_visible'`;
    }

    const result = await query(
      `SELECT 
        tc.id, tc.content, tc.author_type, tc.visibility, tc.created_at,
        u.full_name as author_name, u.role as author_role
       FROM timeline_comments tc
       LEFT JOIN users u ON tc.author_id = u.id
       WHERE tc.event_id = $1 ${visibilityFilter}
       ORDER BY tc.created_at ASC`,
      [event_id]
    );

    res.json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar comentarios' });
  }
}

async function addReaction(req, res) {
  try {
    const { event_id } = req.params;
    const { reaction } = req.body;

    if (!reaction) {
      return res.status(400).json({ error: 'Reacao e obrigatoria' });
    }

    const reactionId = uuidv4();

    await query(
      `INSERT INTO timeline_reactions (id, event_id, user_id, reaction, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT DO NOTHING`,
      [reactionId, event_id, req.user.id, reaction]
    );

    res.status(201).json({ success: true, message: 'Reacao adicionada' });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar reacao', details: error.message });
  }
}

module.exports = { createEvent, getTimeline, addComment, getComments, addReaction };
