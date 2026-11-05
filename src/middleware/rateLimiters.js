const rateLimit = require('express-rate-limit');

const make = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { success: false, message } });

exports.apiLimiter = make(15 * 60 * 1000, 600, 'Too many requests, please try again later');
exports.loginLimiter = make(15 * 60 * 1000, 10, 'Too many login attempts, please try again in 15 minutes');
exports.passwordLimiter = make(15 * 60 * 1000, 10, 'Too many password change attempts, please try again later');
