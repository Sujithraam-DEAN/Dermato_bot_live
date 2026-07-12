const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const dbService = require('../services/dbService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Load medical knowledge base
let medicalKnowledge = '';
try {
  const knowledgePath = path.join(__dirname, '../../Oxford-Handbook-of-Medical-Dermatology.txt');
  medicalKnowledge = fs.readFileSync(knowledgePath, 'utf8');
  console.log('✅ Medical knowledge base loaded');
} catch (error) {
  console.error('❌ Failed to load medical knowledge base:', error.message);
}

// Simple RAG function to find relevant context
function findRelevantContext(query, knowledge) {
  if (!knowledge) return '';
  const queryLower = query.toLowerCase();
  const lines = knowledge.split('\n');
  const relevantLines = [];
  
  // Find lines containing query terms
  const queryTerms = queryLower.split(' ').filter(term => term.length > 2);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (queryTerms.some(term => line.includes(term))) {
      // Include context (previous and next lines)
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length, i + 3);
      relevantLines.push(...lines.slice(start, end));
    }
  }
  
  // Remove duplicates and limit context
  const uniqueLines = [...new Set(relevantLines)];
  return uniqueLines.slice(0, 20).join('\n');
}

// Send message to AI
router.post('/message', requireAuth, async (req, res) => {
  try {
    const { message, diagnosisId } = req.body;
    const userId = req.auth.userId;
    
    if (!message || !diagnosisId) {
      return res.status(400).json({ error: 'Message and diagnosisId are required' });
    }

    // Get diagnosis details from database
    const diagnosis = await dbService.getDiagnosisById(diagnosisId, userId);
    const diagnosisName = diagnosis ? diagnosis.prediction : 'Unknown Condition';

    // Find relevant medical context
    const relevantContext = findRelevantContext(message, medicalKnowledge);
    
    // Generate response using Gemini if API key is set
    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidGeminiKey = apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim() !== '';
    let responseText = '';

    if (hasValidGeminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        // Get previous messages
        const previousMessages = await dbService.getChatHistory(userId, diagnosisId);
        
        // Construct prompt
        const prompt = `You are a helpful AI dermatology consultant.
The patient has been diagnosed with: ${diagnosisName}.

Relevant medical textbook context:
${relevantContext || 'No specific text found.'}

Previous conversation history:
${previousMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

User message: ${message}

Instructions: Discuss the user's condition (${diagnosisName}) and questions. Provide helpful information, but always remind the user to consult with a qualified healthcare professional. Keep the response friendly and professional.`;

        const result = await model.generateContent(prompt);
        responseText = result.response.text();
      } catch (err) {
        console.error('❌ Gemini API failed, falling back to local context generation:', err.message);
      }
    }

    if (!responseText) {
      // Fallback local text-matching generation
      if (relevantContext) {
        const contextLines = relevantContext.split('\n').filter(line => line.trim());
        const keyInfo = contextLines.slice(0, 5).join(' ');
        
        responseText = `Based on the dermatology handbook for ${diagnosisName}:\n\n${keyInfo}\n\nIMPORTANT: This information is for educational purposes only. Always consult a healthcare provider for proper diagnosis and treatment.`;
      } else {
        responseText = `Regarding your question about "${message}" for ${diagnosisName}, I recommend consulting with a dermatologist. I could not find specific entries in my local textbook for this question.`;
      }
    }

    // Save message and response to database
    await dbService.saveChatMessage({ userId, diagnosisId, role: 'user', content: message });
    await dbService.saveChatMessage({ userId, diagnosisId, role: 'assistant', content: responseText });
    
    res.json({ response: responseText });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get chat history for a diagnosis
router.get('/history/:diagnosisId', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const diagnosisId = req.params.diagnosisId;
    
    const history = await dbService.getChatHistory(userId, diagnosisId);
    
    res.json({ messages: history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;