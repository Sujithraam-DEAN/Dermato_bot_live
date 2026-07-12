const { GoogleGenerativeAI } = require('@google/generative-ai');
const Diagnosis = require('../models/Diagnosis');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SKIN_CONDITIONS = [
  'Cellulitis',
  'Impetigo', 
  'Athlete\'s Foot',
  'Nail Fungus',
  'Ringworm',
  'Cutaneous Larva Migrans',
  'Chickenpox',
  'Shingles'
];

const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.auth.userId;
    const imageBuffer = req.file.buffer;
    
    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Use Gemini Vision to analyze the image
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const prompt = `Analyze this skin image and determine if it shows any of these conditions: ${SKIN_CONDITIONS.join(', ')}. 
    Respond with only the most likely condition name from the list, or 'Normal skin' if no condition is detected. 
    Also provide a confidence score between 0 and 1.`;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: req.file.mimetype
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the response to extract condition and confidence
    let prediction = 'Unknown';
    let confidence = 0.5;
    
    // Simple parsing - in production, you'd want more robust parsing
    const lines = text.split('\n');
    for (const line of lines) {
      if (SKIN_CONDITIONS.some(condition => line.toLowerCase().includes(condition.toLowerCase()))) {
        prediction = SKIN_CONDITIONS.find(condition => line.toLowerCase().includes(condition.toLowerCase()));
        break;
      }
    }
    
    // Extract confidence if mentioned
    const confidenceMatch = text.match(/confidence[:\s]*(\d*\.?\d+)/i);
    if (confidenceMatch) {
      confidence = parseFloat(confidenceMatch[1]);
      if (confidence > 1) confidence = confidence / 100; // Convert percentage to decimal
    }
    
    // Save diagnosis to database
    const diagnosis = new Diagnosis({
      userId,
      prediction,
      confidence,
      imagePath: `image_${Date.now()}.${req.file.mimetype.split('/')[1]}`
    });
    
    await diagnosis.save();
    
    res.json({
      id: diagnosis._id,
      prediction,
      confidence: confidence.toFixed(4),
      timestamp: diagnosis.timestamp,
      fullResponse: text
    });
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image: ' + error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const diagnoses = await Diagnosis.find({ userId })
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json(diagnoses);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

module.exports = { analyzeImage, getHistory };