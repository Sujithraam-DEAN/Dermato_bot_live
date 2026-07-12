const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  prediction: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  imagePath: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Diagnosis', diagnosisSchema);