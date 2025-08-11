const User = require('@src/models/User');

const sanitizeUser = (u) => ({
  id: u._id.toString(),
  username: u.username,
  email: u.email,
  bio: u.bio || '',
  avatarUrl: u.avatarUrl || '',
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const { bio, avatarUrl, username } = req.body || {};

    const update = {};

    if (typeof bio === 'string') update.bio = bio;
    if (typeof avatarUrl === 'string') update.avatarUrl = avatarUrl;

    if (typeof username === 'string') {
      const normalizedUsername = username.trim();
      if (normalizedUsername.length === 0) {
        return res.status(400).json({ success: false, error: 'username cannot be empty' });
      }
      const exists = await User.findOne({ username: normalizedUsername, _id: { $ne: req.userId } });
      if (exists) {
        return res.status(409).json({ success: false, error: 'Username is already taken' });
      }
      update.username = normalizedUsername;
    }

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getMe, getById, updateMe };
