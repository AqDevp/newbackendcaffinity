const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Check if no token
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};