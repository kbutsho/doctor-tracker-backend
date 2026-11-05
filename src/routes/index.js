const router = require('express').Router();
const { protect } = require('../middleware/auth');

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', uptime: process.uptime() }));

router.use('/auth', require('./auth.routes'));

// everything below requires a valid access token
router.use('/doctors', protect, require('./doctor.routes'));
router.use('/patients', protect, require('./patient.routes'));
router.use('/dashboard', protect, require('./dashboard.routes'));

module.exports = router;
