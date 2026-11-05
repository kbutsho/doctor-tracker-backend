const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');

const protect = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.accessToken;
  const header = req.headers.authorization;
  if (!token && header?.startsWith('Bearer ')) token = header.split(' ')[1];
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (e) {
    throw new ApiError(401, e.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid token');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'User no longer exists or is disabled');
  req.user = user;
  next();
});

// Authorization by role
const restrictTo = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission to perform this action'));
  next();
};

module.exports = { protect, restrictTo };
