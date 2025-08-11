const express = require('express');
const { register, login } = require('@src/controllers/authController');
const { getMe, getById, updateMe } = require('@src/controllers/userController');
const { verifyAuth } = require('@src/middlewares/auth');

const router = express.Router();

// GET /api/hello
router.get('/hello', async (req, res) => {
  try {
    res.json({ success: true, data: { message: 'Hello from API!' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/status
router.get('/status', async (req, res) => {
  try {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// User routes
router.get('/users/me', verifyAuth, getMe);
router.patch('/users/me', verifyAuth, updateMe);
router.get('/users/:id', getById);

module.exports = router;
