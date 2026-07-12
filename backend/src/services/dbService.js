const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Diagnosis = require('../models/Diagnosis');
const ChatHistory = require('../models/ChatHistory');

const DATA_DIR = path.join(__dirname, '../../data');
const DIAGNOSES_FILE = path.join(DATA_DIR, 'diagnoses.json');
const CHAT_FILE = path.join(DATA_DIR, 'chathistory.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function initFile(filePath, defaultVal = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf-8');
  }
}

initFile(DIAGNOSES_FILE);
initFile(CHAT_FILE);

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

const dbService = {
  isMongoConnected() {
    return mongoose.connection.readyState === 1;
  },

  async saveDiagnosis({ userId, prediction, confidence, imagePath }) {
    if (this.isMongoConnected()) {
      try {
        const diag = new Diagnosis({ userId, prediction, confidence, imagePath });
        await diag.save();
        return diag;
      } catch (err) {
        console.error('MongoDB save diagnosis failed, falling back to file:', err);
      }
    }

    // JSON fallback
    const diagnoses = readJSON(DIAGNOSES_FILE);
    const newDiag = {
      _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      prediction,
      confidence,
      imagePath,
      timestamp: new Date().toISOString()
    };
    diagnoses.push(newDiag);
    writeJSON(DIAGNOSES_FILE, diagnoses);
    return newDiag;
  },

  async getDiagnosisById(id, userId) {
    if (this.isMongoConnected()) {
      try {
        const diag = await Diagnosis.findOne({ _id: id, userId });
        if (diag) return diag;
      } catch (err) {
        console.error('MongoDB get diagnosis failed, falling back to file:', err);
      }
    }

    const diagnoses = readJSON(DIAGNOSES_FILE);
    return diagnoses.find(d => d._id === id && d.userId === userId) || null;
  },

  async getDiagnosisHistory(userId) {
    if (this.isMongoConnected()) {
      try {
        return await Diagnosis.find({ userId }).sort({ timestamp: -1 });
      } catch (err) {
        console.error('MongoDB get history failed, falling back to file:', err);
      }
    }

    const diagnoses = readJSON(DIAGNOSES_FILE);
    return diagnoses
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async saveChatMessage({ userId, diagnosisId, role, content }) {
    if (this.isMongoConnected()) {
      try {
        let history = await ChatHistory.findOne({ userId, diagnosisId });
        if (!history) {
          history = new ChatHistory({ userId, diagnosisId, messages: [] });
        }
        history.messages.push({ role, content });
        if (history.messages.length > 30) {
          history.messages = history.messages.slice(-30);
        }
        await history.save();
        return history.messages;
      } catch (err) {
        console.error('MongoDB save chat message failed, falling back to file:', err);
      }
    }

    // JSON fallback
    const chats = readJSON(CHAT_FILE);
    let chat = chats.find(c => c.userId === userId && c.diagnosisId === diagnosisId);
    if (!chat) {
      chat = {
        userId,
        diagnosisId,
        messages: [],
        createdAt: new Date().toISOString()
      };
      chats.push(chat);
    }
    chat.messages.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    if (chat.messages.length > 30) {
      chat.messages = chat.messages.slice(-30);
    }
    writeJSON(CHAT_FILE, chats);
    return chat.messages;
  },

  async getChatHistory(userId, diagnosisId) {
    if (this.isMongoConnected()) {
      try {
        const history = await ChatHistory.findOne({ userId, diagnosisId });
        return history ? history.messages : [];
      } catch (err) {
        console.error('MongoDB get chat history failed, falling back to file:', err);
      }
    }

    const chats = readJSON(CHAT_FILE);
    const chat = chats.find(c => c.userId === userId && c.diagnosisId === diagnosisId);
    return chat ? chat.messages : [];
  }
};

module.exports = dbService;
