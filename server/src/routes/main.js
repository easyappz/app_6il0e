const express = require('express');
const { register, login } = require('@src/controllers/authController');
const { getMe, getById, updateMe } = require('@src/controllers/userController');
const { verifyAuth } = require('@src/middlewares/auth');
const postsController = require('@src/controllers/postsController');
const messagesController = require('@src/controllers/messagesController');

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

// Posts routes (protected)
router.post('/posts', verifyAuth, postsController.create);
router.get('/posts/feed', verifyAuth, postsController.feed);
router.get('/posts/:id', verifyAuth, postsController.byId);
router.post('/posts/:id/like', verifyAuth, postsController.like);
router.delete('/posts/:id/like', verifyAuth, postsController.unlike);
router.post('/posts/:id/comment', verifyAuth, postsController.comment);
router.get('/users/:id/posts', verifyAuth, postsController.userPosts);

// Messages routes (protected)
router.get('/messages/conversations', verifyAuth, messagesController.listConversations);
router.post('/messages/conversations', verifyAuth, messagesController.createOrGetConversation);
router.get('/messages/conversations/:id', verifyAuth, messagesController.getConversation);
router.get('/messages/conversations/:id/messages', verifyAuth, messagesController.listMessages);
router.post('/messages/conversations/:id/messages', verifyAuth, messagesController.sendMessage);
router.post('/messages/conversations/:id/read', verifyAuth, messagesController.markRead);
router.get('/messages/unread-count', verifyAuth, messagesController.unreadCount);

module.exports = router;
