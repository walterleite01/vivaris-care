const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const timeline = require('../controllers/timeline');

router.post('/', authenticate, timeline.createEvent);
router.get('/:resident_id', authenticate, timeline.getTimeline);
router.post('/:event_id/comments', authenticate, timeline.addComment);
router.get('/:event_id/comments', authenticate, timeline.getComments);
router.post('/:event_id/reactions', authenticate, timeline.addReaction);

module.exports = router;
