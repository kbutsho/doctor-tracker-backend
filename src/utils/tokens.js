const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const ACCESS_MS = 15 * 60 * 1000;
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });

const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });

const verifyAccessToken = (t) => jwt.verify(t, env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (t) => jwt.verify(t, env.JWT_REFRESH_SECRET);

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

const cookieBase = () => ({
  httpOnly: true,
  secure: env.isProd || env.COOKIE_SAME_SITE === 'none',
  sameSite: env.COOKIE_SAME_SITE,
});

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, { ...cookieBase(), maxAge: ACCESS_MS });
  res.cookie('refreshToken', refreshToken, { ...cookieBase(), maxAge: REFRESH_MS, path: '/api/auth' });
  res.cookie('session', '1', { ...cookieBase(), maxAge: REFRESH_MS });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieBase());
  res.clearCookie('refreshToken', { ...cookieBase(), path: '/api/auth' });
  res.clearCookie('session', cookieBase());
};

module.exports = {
  signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken,
  hashToken, setAuthCookies, clearAuthCookies,
};
