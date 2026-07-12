const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 5003;

// Enable CORS
app.use(cors());

// Multer setup
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Test endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  console.log('=== UPLOAD REQUEST ===');
  console.log('Headers:', req.headers);
  console.log('File:', req.file);
  console.log('Body:', req.body);
  console.log('=====================');
  
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

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});