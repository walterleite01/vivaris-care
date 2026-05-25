/* ============================================
   MESSAGES ROUTES
   ============================================ */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const messagesController = require('../controllers/messages');

// ============================================
// MIDDLEWARE
// ============================================

router.use(authenticate);

// ============================================
// ROUTES
// ============================================

// POST - Enviar mensagem
router.post('/', messagesController.sendMessage);

// GET - Mensagens de um residente
router.get('/resident/:resident_id', messagesController.getResidentMessages);

// GET - Mensagens não lidas do usuário
router.get('/unread', messagesController.getUnreadMessages);

// PATCH - Marcar mensagem como lida
router.patch('/:message_id/read', messagesController.markAsRead);

// DELETE - Deletar mensagem
router.delete('/:id', messagesController.deleteMessage);

module.exports = router;
