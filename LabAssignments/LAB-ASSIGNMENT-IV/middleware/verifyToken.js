// middleware/verifyToken.js
// ─────────────────────────────────────────────────────────────────────────────
// Stateless JWT authentication middleware for the /api/v1 routes.
//
// Usage:  router.get('/protected', verifyToken, controller)
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  // 1. Extract the token from the Authorization header
  const authHeader = req.headers['authorization'];

  // Header must look like: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided. Use Authorization: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1]; // grab only the token part

  // 2. Verify the token using the secret stored in .env
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach decoded payload to req so controllers can use it
    req.user = decoded; // { user_id, role, iat, exp }
    next();
  } catch (err) {
    // Token is present but invalid or expired
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
}

module.exports = verifyToken;