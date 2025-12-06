const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from cookie OR Authorization header
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({ message: 'No token, access denied' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log('❌ Auth failed: Invalid token', err.message);
      return res.status(401).json({ message: 'Invalid token', error: err.message });
    }

    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('❌ Auth failed: User not found for id:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      console.log('❌ Auth failed: User inactive:', user.email);
      return res.status(401).json({ message: 'User not active' });
    }
    
    if (user.tokenVersion !== decoded.tokenVersion) {
      console.log('❌ Auth failed: Token version mismatch for:', user.email);
      return res.status(401).json({ message: 'Token revoked' });
    }

    // Set user and orgId in request
    req.user = user;
    req.orgId = user.role === 'PLATFORM_ADMIN' ? (req.query.orgId || req.body.orgId) : user.orgId;
    
    console.log('✅ Auth success:', user.email, 'Role:', user.role, 'OrgId:', req.orgId);
    next();
  } catch (err) {
    console.log('❌ Auth error:', err.message);
    res.status(401).json({ message: 'Authentication error', error: err.message });
  }
};

// Check roles
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    console.log('❌ Authorization failed:', req.user.email, 'needs', roles, 'but has', req.user.role);
    return res.status(403).json({ message: 'Not authorized for this action' });
  }
  next();
};

// Platform admin only
const platformAdmin = (req, res, next) => {
  if (req.user.role !== 'PLATFORM_ADMIN') {
    console.log('❌ Platform admin required, user has:', req.user.role);
    return res.status(403).json({ message: 'Platform Admin access required' });
  }
  next();
};

// Org admin or above
const orgAdmin = (req, res, next) => {
  if (!['PLATFORM_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    console.log('❌ Org admin required, user has:', req.user.role);
    return res.status(403).json({ message: 'Organization Admin access required' });
  }
  next();
};

// HR admin or above
const hrAdmin = (req, res, next) => {
  if (!['PLATFORM_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'].includes(req.user.role)) {
    console.log('❌ HR admin required, user has:', req.user.role);
    return res.status(403).json({ message: 'HR Admin access required' });
  }
  next();
};

// Manager or above
const manager = (req, res, next) => {
  if (req.user.role === 'EMPLOYEE') {
    console.log('❌ Manager required, user is EMPLOYEE');
    return res.status(403).json({ message: 'Manager access required' });
  }
  next();
};

module.exports = { auth, authorize, platformAdmin, orgAdmin, hrAdmin, manager };