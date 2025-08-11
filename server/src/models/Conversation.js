'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ConversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length === 2;
        },
        message: 'Conversation must have exactly 2 participants',
      },
    },
    lastMessageAt: { type: Date, default: null },
    lastMessageText: { type: String, default: '' },
    lastMessageAuthor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Map where key is userId (string), value is number of unread messages for that user in this conversation
    unreadCountByUser: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Ensure uniqueness for a sorted pair of participants
ConversationSchema.index({ participants: 1 }, { unique: true });
// For sorting conversations by last activity
ConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
