const express = require('express');

/**
 * Example of creating a model in MongoDB (commented example)
 */
// const mongoose = require('mongoose');
// const MongoTestSchema = new mongoose.Schema({
//   value: { type: String, required: true },
// });
// const MongoModelTest = mongoose.model('Test', MongoTestSchema);
// const newTest = new MongoModelTest({ value: 'test-value' });
// newTest.save();

const router = express.Router();

// GET /api/hello
router.get('/hello', async (req, res) => {
  try {
    res.json({ message: 'Hello from API!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/status
router.get('/status', async (req, res) => {
  try {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
