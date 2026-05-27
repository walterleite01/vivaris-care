const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const moments = require('../controllers/moments');

router.post('/', authenticate, moments.createMoment);
router.get('/:resident_id', authenticate, moments.getMoments);

module.exports = router;
