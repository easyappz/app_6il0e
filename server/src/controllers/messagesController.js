'use strict';

const mongoose = require('mongoose');
const Conversation = require('@src/models/Conversation');
const Message = require('@src/models/Message');
const User = require('@src/models/User');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const getOtherParticipantId = (conversation, currentUserId) => {
  const curr = currentUserId.toString();
  const ids = (conversation.participants || []).map((p) => (p && p._id ? p._id.toString() : p.toString()));
  if (!ids.includes(curr)) return null;
  return ids.find((id) => id !== curr) || null;
};

const buildConversationPreview = (convDoc, currentUserId) => {
  const userIdStr = currentUserId.toString();
  const conv = convDoc.toObject ? convDoc.toObject() : convDoc;
  const otherId = getOtherParticipantId(conv, userIdStr);
  const other = (conv.participants || []).find((p) => (p._id ? p._id.toString() : p.toString()) === otherId);
  let unreadCount = 0;
  if (convDoc.unreadCountByUser instanceof Map) {
    unreadCount = convDoc.unreadCountByUser.get(userIdStr) || 0;
  } else if (convDoc.unreadCountByUser) {
    unreadCount = convDoc.unreadCountByUser[userIdStr] || 0;
  }
  return {
    _id: convDoc._id,
    otherParticipant: other
      ? { _id: other._id, username: other.username, avatarUrl: other.avatarUrl }
      : null,
    lastMessageAt: convDoc.lastMessageAt,
    lastMessageText: convDoc.lastMessageText,
    lastMessageAuthor: convDoc.lastMessageAuthor,
    unreadCount,
  };
};

// GET /messages/conversations
async function listConversations(req, res) {
  try {
    const userId = req.userId;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = { participants: toObjectId(userId) };

    const total = await Conversation.countDocuments(filter);
    const conversations = await Conversation.find(filter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('participants', 'username avatarUrl');

    const items = conversations.map((c) => buildConversationPreview(c, userId));

    return res.json({ success: true, data: { items, page, limit, total } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /messages/conversations
async function createOrGetConversation(req, res) {
  try {
    const userId = req.userId;
    const { participantId } = req.body || {};

    if (!participantId) {
      return res.status(400).json({ success: false, error: 'participantId is required' });
    }
    if (!isValidObjectId(participantId)) {
      return res.status(400).json({ success: false, error: 'Invalid participantId' });
    }
    if (participantId.toString() === userId.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot create conversation with yourself' });
    }

    const participant = await User.findById(participantId).select('_id');
    if (!participant) {
      return res.status(404).json({ success: false, error: 'Participant not found' });
    }

    const sortedIds = [userId.toString(), participantId.toString()].sort();
    const pair = sortedIds.map((s) => toObjectId(s));

    let conversation = await Conversation.findOne({ participants: pair }).populate('participants', 'username avatarUrl');

    if (!conversation) {
      conversation = new Conversation({
        participants: pair,
        lastMessageAt: new Date(),
        lastMessageText: '',
        lastMessageAuthor: null,
        unreadCountByUser: new Map(),
      });
      const meKey = userId.toString();
      const otherKey = participantId.toString();
      conversation.unreadCountByUser.set(meKey, 0);
      conversation.unreadCountByUser.set(otherKey, 0);
      await conversation.save();
      await conversation.populate('participants', 'username avatarUrl');
    }

    const preview = buildConversationPreview(conversation, userId);

    return res.status(200).json({ success: true, data: preview });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /messages/conversations/:id
async function getConversation(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }

    const conversation = await Conversation.findById(id).populate('participants', 'username avatarUrl');
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const participantsStr = conversation.participants.map((p) => p._id.toString());
    if (!participantsStr.includes(userId.toString())) {
      return res.status(403).json({ success: false, error: 'Access denied: not a participant' });
    }

    const data = buildConversationPreview(conversation, userId);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /messages/conversations/:id/messages
async function listMessages(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const isParticipant = (conversation.participants || []).map((p) => p.toString()).includes(userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Access denied: not a participant' });
    }

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '30', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = { conversation: toObjectId(id) };

    const total = await Message.countDocuments(filter);
    const items = await Message.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .select('sender recipient text createdAt updatedAt readAt')
      .lean();

    return res.json({ success: true, data: { items, page, limit, total } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /messages/conversations/:id/messages
async function sendMessage(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { text } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    let conversation = await Conversation.findById(id).populate('participants', 'username avatarUrl');
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const participantsStr = conversation.participants.map((p) => p._id.toString());
    if (!participantsStr.includes(userId.toString())) {
      return res.status(403).json({ success: false, error: 'Access denied: not a participant' });
    }

    const otherId = getOtherParticipantId(conversation, userId);
    if (!otherId) {
      return res.status(500).json({ success: false, error: 'Failed to determine recipient' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: toObjectId(userId),
      recipient: toObjectId(otherId),
      text: text.trim(),
    });

    // Update conversation meta
    const now = message.createdAt || new Date();
    conversation.lastMessageAt = now;
    conversation.lastMessageText = message.text;
    conversation.lastMessageAuthor = toObjectId(userId);

    const recipientKey = otherId.toString();
    const currentUnread = conversation.unreadCountByUser instanceof Map
      ? (conversation.unreadCountByUser.get(recipientKey) || 0)
      : (conversation.unreadCountByUser && conversation.unreadCountByUser[recipientKey]) || 0;

    if (!(conversation.unreadCountByUser instanceof Map)) {
      // convert to Map in case it's plain object
      const m = new Map();
      Object.keys(conversation.unreadCountByUser || {}).forEach((k) => m.set(k, conversation.unreadCountByUser[k]));
      conversation.unreadCountByUser = m;
    }
    conversation.unreadCountByUser.set(recipientKey, currentUnread + 1);

    await conversation.save();

    // Rebuild preview for current user with populated other participant
    await conversation.populate('participants', 'username avatarUrl');
    const conversationPreview = buildConversationPreview(conversation, userId);

    return res.status(201).json({ success: true, data: { message, conversation: conversationPreview } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /messages/conversations/:id/read
async function markRead(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { before } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const isParticipant = (conversation.participants || []).map((p) => p.toString()).includes(userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Access denied: not a participant' });
    }

    const criteria = { conversation: conversation._id, recipient: toObjectId(userId), readAt: null };
    if (before) {
      const beforeDate = new Date(before);
      if (isNaN(beforeDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid before date' });
      }
      criteria.createdAt = { $lte: beforeDate };
    }

    await Message.updateMany(criteria, { $set: { readAt: new Date() } });

    // recompute unread count for this user
    const unreadRemaining = await Message.countDocuments({ conversation: conversation._id, recipient: toObjectId(userId), readAt: null });

    if (!(conversation.unreadCountByUser instanceof Map)) {
      const m = new Map();
      Object.keys(conversation.unreadCountByUser || {}).forEach((k) => m.set(k, conversation.unreadCountByUser[k]));
      conversation.unreadCountByUser = m;
    }
    conversation.unreadCountByUser.set(userId.toString(), unreadRemaining);
    await conversation.save();

    return res.json({ success: true, data: { conversationId: conversation._id, unreadCount: unreadRemaining } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /messages/unread-count
async function unreadCount(req, res) {
  try {
    const userId = req.userId.toString();
    const convs = await Conversation.find({ participants: toObjectId(userId) }).select('unreadCountByUser');

    let total = 0;
    for (const c of convs) {
      if (c.unreadCountByUser instanceof Map) {
        total += c.unreadCountByUser.get(userId) || 0;
      } else if (c.unreadCountByUser) {
        total += c.unreadCountByUser[userId] || 0;
      }
    }

    return res.json({ success: true, data: { unread: total } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listConversations,
  createOrGetConversation,
  getConversation,
  listMessages,
  sendMessage,
  markRead,
  unreadCount,
};
