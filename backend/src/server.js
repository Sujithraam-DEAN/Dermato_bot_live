const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const diagnosisRoutes = require('./routes/diagnosis');
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5002;

// CORS
app.use(cors());

// JSON parsing
app.use(express.json({ limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/chat', chatRoutes);

// Test upload endpoint
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/test-upload', upload.single('image'), (req, res) => {
  console.log('=== TEST UPLOAD ===');
  console.log('File:', req.file);
  console.log('==================');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    success: true,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
