const mongoose = require('mongoose');

const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const PostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true },
    likes: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    comments: { type: [CommentSchema], default: [] }
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
