/* ============================================
   ACTIVITIES ROUTES
   ============================================ */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const activitiesController = require('../controllers/activities');

// ============================================
// MIDDLEWARE
// ============================================

router.use(authenticate);

// ============================================
// ROUTES
// ============================================

// POST - Registrar nova atividade
router.post('/', activitiesController.createActivity);

// GET - Atividades de um residente (últimos X dias)
router.get('/resident/:resident_id', activitiesController.getActivitiesByResident);

// GET - Atividades de hoje
router.get('/resident/:resident_id/today', activitiesController.getTodayActivities);

// PATCH - Atualizar atividade
router.patch('/:id', activitiesController.updateActivity);

module.exports = router;
