const mongoose = require('mongoose');
const Post = require('@src/models/Post');
const User = require('@src/models/User');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const pickUserFields = 'username avatarUrl';

const mapWithLastComments = (posts, commentsLimit) => {
  return posts.map((p) => {
    const obj = p.toObject();
    if (Array.isArray(obj.comments)) {
      obj.comments = obj.comments.slice(-commentsLimit);
    } else {
      obj.comments = [];
    }
    return obj;
  });
};

const create = async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const post = await Post.create({ author: req.userId, content: String(content).trim() });
    await post.populate({ path: 'author', select: pickUserFields });

    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const feed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const commentsLimit = Math.min(parseInt(req.query.commentsLimit, 10) || 3, 50);
    const skip = (page - 1) * limit;

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'author', select: pickUserFields })
      .populate({ path: 'comments.author', select: pickUserFields });

    const data = mapWithLastComments(posts, commentsLimit);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const byId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }

    const post = await Post.findById(id)
      .populate({ path: 'author', select: pickUserFields })
      .populate({ path: 'comments.author', select: pickUserFields });

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    return res.json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const like = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }

    const updated = await Post.findByIdAndUpdate(
      id,
      { $addToSet: { likes: req.userId } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    return res.json({ success: true, data: { postId: String(updated._id), likesCount: updated.likes.length } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const unlike = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }

    const updated = await Post.findByIdAndUpdate(
      id,
      { $pull: { likes: req.userId } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    return res.json({ success: true, data: { postId: String(updated._id), likesCount: updated.likes.length } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const comment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }
    if (!text || !String(text).trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const commentDoc = { author: req.userId, text: String(text).trim(), createdAt: new Date() };

    const updated = await Post.findByIdAndUpdate(
      id,
      { $push: { comments: commentDoc } },
      { new: true }
    )
      .populate({ path: 'comments.author', select: pickUserFields })
      .populate({ path: 'author', select: pickUserFields });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const createdComment = updated.comments[updated.comments.length - 1];
    return res.status(201).json({ success: true, data: { postId: String(updated._id), comment: createdComment } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const userPosts = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const userExists = await User.exists({ _id: id });
    if (!userExists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const posts = await Post.find({ author: id })
      .sort({ createdAt: -1 })
      .populate({ path: 'author', select: pickUserFields })
      .populate({ path: 'comments.author', select: pickUserFields });

    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  create,
  feed,
  byId,
  like,
  unlike,
  comment,
  userPosts,
};
