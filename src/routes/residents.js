/* ============================================
   RESIDENTS ROUTES
   ============================================ */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const residentsController = require('../controllers/residents');

// ============================================
// MIDDLEWARE
// ============================================

router.use(authenticate);

// ============================================
// ROUTES
// ============================================

// POST - Criar novo residente
// Permissões: admin, comercial
router.post('/', 
  requireRole(['admin', 'comercial']),
  residentsController.createResident
);

// GET - Listar todos os residentes
// admin vê todos
// comercial vê seus
// assistencial vê todos da unidade
// familiar vê apenas seu
router.get('/', residentsController.getResidents);

// GET - Pegar residente específico por ID
router.get('/:id', residentsController.getResidentById);

// PATCH - Atualizar residente
// admin pode editar tudo
// comercial pode editar seus (mas não após criado sem motivo)
// assistencial pode atualizar medicações e atividades
router.patch('/:id',
  residentsController.updateResident
);

module.exports = router;
