const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatHistory = require('../models/ChatHistory');
const Diagnosis = require('../models/Diagnosis');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sendMessage = async (req, res) => {
  try {
    const { message, diagnosisId } = req.body;
    const userId = req.auth.userId;

    if (!message || !diagnosisId) {
      return res.status(400).json({ error: 'Message and diagnosisId are required' });
    }

    // Get diagnosis details
    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis || diagnosis.userId !== userId) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }

    // Get or create chat history
    let chatHistory = await ChatHistory.findOne({ userId, diagnosisId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId, diagnosisId, messages: [] });
    }

    // Create context-aware prompt
    const context = `The user has been diagnosed with ${diagnosis.prediction}. 
    Previous conversation: ${chatHistory.messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}
    
    You are a helpful AI dermatology consultant. Provide medical information and advice based on the diagnosed condition.
    Always remind users to consult with a healthcare professional for proper treatment.
    
    User question: ${message}`;

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(context);
    const response = result.response.text();

    // Save messages to chat history
    chatHistory.messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );
    
    await chatHistory.save();

    res.json({ response });

  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    const userId = req.auth.userId;

    const chatHistory = await ChatHistory.findOne({ userId, diagnosisId });
    
    res.json({ messages: chatHistory?.messages || [] });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

module.exports = { sendMessage, getChatHistory };