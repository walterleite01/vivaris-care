const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const familyRequests = require('../controllers/family-requests');

router.post('/', authenticate, familyRequests.createRequest);
router.get('/', authenticate, familyRequests.getRequests);
router.put('/:id/respond', authenticate, familyRequests.respondRequest);

module.exports = router;
