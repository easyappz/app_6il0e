require('module-alias/register');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const apiRoutes = require('@src/routes/main');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  try {
    res.json({ success: true, data: { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API Routes
app.use('/api', apiRoutes);

// Mongoose connection
mongoose.set('strictQuery', true);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Final error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || String(err) });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const rootDir = path.resolve(__dirname, '..');
  console.log(`Server running on port ${PORT}. Root: ${rootDir}`);
});
