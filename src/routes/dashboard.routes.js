const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const validate = require('../middleware/validate');
const { dashboardQuery } = require('../validators/dashboard.validator');

router.get('/stats', validate({ query: dashboardQuery }), ctrl.getStats);

module.exports = router;
