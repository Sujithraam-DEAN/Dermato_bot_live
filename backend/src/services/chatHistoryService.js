const mongoose = require('mongoose');

// Chat history schema
const chatHistorySchema = new mongoose.Schema({
  userId: String,
  diagnosisId: String,
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

class ChatHistoryService {
  async getChatHistory(userId, diagnosisId, limit = 10) {
    try {
      const history = await ChatHistory.findOne({ userId, diagnosisId });
      if (!history) return [];
      
      return history.messages
        .slice(-limit)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
    } catch (error) {
      console.error('Error getting chat history:', error);
      return '';
    }
  }

  async saveChatHistory(userId, diagnosisId, userMessage, assistantResponse) {
    try {
      let history = await ChatHistory.findOne({ userId, diagnosisId });
      
      if (!history) {
        history = new ChatHistory({ userId, diagnosisId, messages: [] });
      }
      
      history.messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantResponse }
      );
      
      // Keep only last 20 messages to prevent unlimited growth
      if (history.messages.length > 20) {
        history.messages = history.messages.slice(-20);
      }
      
      await history.save();
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }
}

module.exports = new ChatHistoryService();