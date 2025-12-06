const router = require('express').Router();
const jwt = require('jsonwebtoken');

// Test endpoint - NO AUTH REQUIRED
router.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// Test token validity
router.post('/test-token', (req, res) => {
  try {
    const token = req.body.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ 
      valid: true, 
      decoded,
      message: 'Token is valid!'
    });
  } catch (err) {
    res.status(401).json({ 
      valid: false, 
      error: err.message,
      hint: 'Token is invalid or expired. Please login again.'
    });
  }
});

module.exports = router;