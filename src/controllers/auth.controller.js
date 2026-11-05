const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, setAuthCookies, clearAuthCookies,
} = require('../utils/tokens');

const issueTokens = async (user, res) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  setAuthCookies(res, accessToken, refreshToken);
  return accessToken;
};

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshTokenHash');

  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is disabled');

  const accessToken = await issueTokens(user, res);
  res.json({ success: true, data: { user, accessToken } });
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token missing');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.isActive || user.refreshTokenHash !== hashToken(token)) {
    throw new ApiError(401, 'Refresh token revoked');
  }

  const accessToken = await issueTokens(user, res); // rotation
  res.json({ success: true, data: { user, accessToken } });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const { sub } = verifyRefreshToken(token);
      await User.updateOne({ _id: sub }, { $unset: { refreshTokenHash: 1 } });
    } catch { /* ignore invalid token on logout */ }
  }
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// admin only: create another admin/staff user
exports.register = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: { user } });
});

// own profile: name / email
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.email !== undefined) user.email = req.body.email;
  await user.save(); // duplicate email -> 409 via errorHandler
  res.json({ success: true, message: 'Profile updated', data: { user } });
});

// own password: needs current password; all other sessions are revoked, this one stays logged in
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +refreshTokenHash');
  if (!(await user.comparePassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  if (currentPassword === newPassword) throw new ApiError(400, 'New password must be different from the current password');

  user.password = newPassword; // hashed by the pre-save hook
  const accessToken = await issueTokens(user, res); // rotates refresh token => old sessions invalid
  res.json({ success: true, message: 'Password updated', data: { user, accessToken } });
});
