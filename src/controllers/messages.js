/* ============================================
   MESSAGES CONTROLLER (Chat)
   ============================================ */

const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// ============================================
// SEND MESSAGE
// ============================================

exports.sendMessage = async (req, res) => {
  try {
    const { resident_id, recipient_ids, message_text } = req.body;

    // Validações
    if (!resident_id || !message_text || !recipient_ids || recipient_ids.length === 0) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const messageId = uuidv4();

    // Criar mensagem
    const messageResult = await pool.query(
      `INSERT INTO messages (id, resident_id, sender_id, message_text, sent_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [messageId, resident_id, req.user.id, message_text]
    );

    // Criar registros de recepção para cada destinatário
    for (const recipientId of recipient_ids) {
      await pool.query(
        `INSERT INTO message_recipients (id, message_id, recipient_id, read_at)
         VALUES ($1, $2, $3, NULL)`,
        [uuidv4(), messageId, recipientId]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: messageResult.rows[0]
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};

// ============================================
// GET MESSAGES FOR RESIDENT
// ============================================

exports.getResidentMessages = async (req, res) => {
  try {
    const { resident_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT m.*, u.full_name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.resident_id = $1
       ORDER BY m.sent_at DESC
       LIMIT $2 OFFSET $3`,
      [resident_id, limit, offset]
    );

    res.json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
};

// ============================================
// GET UNREAD MESSAGES
// ============================================

exports.getUnreadMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT m.*, u.full_name as sender_name, r.full_name as resident_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       JOIN residents r ON m.resident_id = r.id
       JOIN message_recipients mr ON m.id = mr.message_id
       WHERE mr.recipient_id = $1 AND mr.read_at IS NULL
       ORDER BY m.sent_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      unread_count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching unread messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens não lidas' });
  }
};

// ============================================
// MARK MESSAGE AS READ
// ============================================

exports.markAsRead = async (req, res) => {
  try {
    const { message_id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE message_recipients 
       SET read_at = NOW()
       WHERE message_id = $1 AND recipient_id = $2
       RETURNING *`,
      [message_id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    res.json({
      success: true,
      message: 'Mensagem marcada como lida'
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagem como lida' });
  }
};

// ============================================
// DELETE MESSAGE
// ============================================

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    // Apenas quem criou ou admin podem deletar
    const checkResult = await pool.query(
      'SELECT sender_id FROM messages WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    if (req.user.role !== 'admin' && checkResult.rows[0].sender_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para deletar esta mensagem' });
    }

    // Deletar registros de recepção primeiro
    await pool.query('DELETE FROM message_recipients WHERE message_id = $1', [id]);

    // Deletar mensagem
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Mensagem deletada com sucesso'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Erro ao deletar mensagem' });
  }
};
