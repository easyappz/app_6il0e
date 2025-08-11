const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('@src/models/User');

const JWT_SECRET = 'supersecret_jwt_key';
const TOKEN_EXPIRES_IN = '7d';

const sanitizeUser = (u) => ({
  id: u._id.toString(),
  username: u.username,
  email: u.email,
  bio: u.bio || '',
  avatarUrl: u.avatarUrl || '',
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'username, email and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedUsername = String(username).trim();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existing) {
      const field = existing.email === normalizedEmail ? 'email' : 'username';
      return res.status(409).json({ success: false, error: `User with this ${field} already exists` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

    return res.status(201).json({ success: true, data: { token, user: sanitizeUser(user) } });
  } catch (err) {
    if (err && err.code === 11000) {
      const dupField = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ success: false, error: `Duplicate ${dupField}` });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body || {};

    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, error: 'emailOrUsername and password are required' });
    }

    const query = String(emailOrUsername).includes('@')
      ? { email: String(emailOrUsername).toLowerCase().trim() }
      : { username: String(emailOrUsername).trim() };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

    return res.json({ success: true, data: { token, user: sanitizeUser(user) } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { register, login };
