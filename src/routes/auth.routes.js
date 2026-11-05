const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { loginLimiter, passwordLimiter } = require('../middleware/rateLimiters');
const { loginBody, registerBody, updateProfileBody, changePasswordBody } = require('../validators/auth.validator');

router.post('/login', loginLimiter, validate({ body: loginBody }), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', protect, ctrl.me);
router.put('/profile', protect, validate({ body: updateProfileBody }), ctrl.updateProfile);
router.put('/password', protect, passwordLimiter, validate({ body: changePasswordBody }), ctrl.changePassword);
router.post('/register', protect, restrictTo('admin'), validate({ body: registerBody }), ctrl.register);

module.exports = router;
