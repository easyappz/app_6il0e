const jwt = require('jsonwebtoken');

const JWT_SECRET = 'supersecret_jwt_key';

const verifyAuth = (req, res, next) => {
  try {
    const header = req.headers['authorization'] || '';
    if (!header) {
      return res.status(401).json({ success: false, error: 'Authorization header is missing' });
    }

    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, error: 'Invalid Authorization header format. Expected: Bearer <token>' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, error: 'Invalid token payload' });
    }

    req.userId = decoded.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message });
  }
};

module.exports = { verifyAuth };
