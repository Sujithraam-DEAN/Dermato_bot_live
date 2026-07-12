const express = require('express');
const router = express.Router();

// Verify authentication
router.get('/verify', (req, res) => {
  res.json({ 
    authenticated: true, 
    userId: 'mock_user_123' 
  });
});

// Get user profile
router.get('/profile', (req, res) => {
  res.json({ 
    userId: 'mock_user_123',
    sessionId: 'mock_session_456' 
  });
});

module.exports = router;