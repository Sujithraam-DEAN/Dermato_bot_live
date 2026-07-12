// routes/diagnosis.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const dbService = require('../services/dbService');
const axios = require('axios');
const FormData = require('form-data');



// Multer setup (store in memory, not disk)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Function to run Python prediction
function runPythonPrediction(imageBuffer) {
  return new Promise((resolve, reject) => {
    const repoRoot = path.join(__dirname, '../..');
    const pythonScript = path.join(repoRoot, 'predict.py');

    // Prefer the project's venv Python if available (Windows path)
    const venvPython = path.join(repoRoot, '..', 'ml-service', 'venv', 'Scripts', 'python.exe');
    const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python';

    const python = spawn(pythonExecutable, [pythonScript], {
      cwd: repoRoot
    });
    
    let result = '';
    let error = '';
    
    // Convert image buffer to base64
    const imageBase64 = imageBuffer.toString('base64');
    
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const prediction = JSON.parse(result);
          resolve(prediction);
        } catch (e) {
          reject(new Error('Failed to parse prediction result'));
        }
      } else {
        reject(new Error(`Python script failed: ${error}`));
      }
    });
    
    // Send image data to Python script
    python.stdin.write(imageBase64);
    python.stdin.end();
  });
}

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Function to get prediction from Flask server
async function getPredictionFromFlask(imageBuffer, filename) {
  const form = new FormData();
  form.append('image', imageBuffer, { filename: filename || 'image.jpg' });
  
  const response = await axios.post(`${ML_URL}/predict`, form, {
    headers: form.getHeaders(),
    timeout: 5000 // 5 seconds timeout
  });
  
  return {
    prediction: response.data.prediction,
    confidence: response.data.confidence,
    all_predictions: response.data.all_predictions
  };
}

// Unified prediction getter that prefers HTTP but falls back to spawn
async function getPrediction(imageBuffer, filename) {
  try {
    console.log(`🔄 Attempting prediction via Python Flask server (${ML_URL}/predict)...`);
    const result = await getPredictionFromFlask(imageBuffer, filename);
    console.log('✅ Flask server prediction succeeded');
    return result;
  } catch (err) {
    console.log('⚠️ Flask server failed or is not running, falling back to spawning process:', err.message);
    const result = await runPythonPrediction(imageBuffer);
    if (result && result.error) {
      return { error: result.error };
    }
    return {
      prediction: result.prediction,
      confidence: result.confidence,
      all_predictions: result.all_predictions
    };
  }
}

// POST /api/diagnosis/analyze
router.post('/analyze', requireAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('=== DIAGNOSIS REQUEST ===');
    console.log('File:', req.file);
    console.log('========================');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Run Python prediction (prefers Flask server, falls back to spawn)
    const prediction = await getPrediction(req.file.buffer, req.file.originalname);
    
    if (prediction.error) {
      throw new Error(prediction.error);
    }
    
    const userId = req.auth.userId;
    const ext = req.file.originalname.split('.').pop() || 'jpg';
    const filename = `image_${Date.now()}.${ext}`;

    // Save diagnosis to database (MongoDB or JSON)
    const diagnosis = await dbService.saveDiagnosis({
      userId,
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      imagePath: filename
    });

    const response = {
      _id: diagnosis._id,
      prediction: diagnosis.prediction,
      confidence: parseFloat(diagnosis.confidence.toFixed(4)),
      message: 'Image analyzed successfully using CNN model',
      filename: req.file.originalname,
      size: req.file.size,
      timestamp: diagnosis.timestamp || new Date().toISOString(),
      allPredictions: prediction.all_predictions
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error analyzing image:', error.message);
    res.status(500).json({ error: 'Image analysis failed: ' + error.message });
  }
});

// GET /api/diagnosis/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const history = await dbService.getDiagnosisHistory(userId);
    res.json(history);
  } catch (error) {
    console.error('❌ Error fetching history:', error.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/diagnosis/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const diag = await dbService.getDiagnosisById(req.params.id, req.auth.userId);
    if (!diag) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }
    res.json(diag);
  } catch (error) {
    console.error('❌ Error fetching diagnosis:', error.message);
    res.status(500).json({ error: 'Failed to fetch diagnosis' });
  }
});

module.exports = router;
