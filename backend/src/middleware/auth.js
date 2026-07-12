const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  // Simple token validation - in production, verify with Clerk
  if (!token) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Try to decode Clerk JWT token to get persistent user ID (sub)
  let userId = 'mock_user_default';
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      if (payload && payload.sub) {
        userId = payload.sub;
      }
    }
  } catch (err) {
    console.error('Failed to decode Clerk token, using default mock user:', err.message);
  }
  
  req.auth = { userId };
  next();
};

module.exports = { requireAuth };