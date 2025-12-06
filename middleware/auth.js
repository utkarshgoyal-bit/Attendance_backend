const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    console.log('🔍 Auth middleware started');
    
    // Get token from cookie or header
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({ message: 'No token, access denied' });
    }

    console.log('✅ Token found');

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified. User ID:', decoded.id);
    } catch (err) {
      console.log('❌ Auth failed: Invalid token -', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('❌ Auth failed: User not found');
      return res.status(401).json({ message: 'User not found' });
    }
    
    console.log('✅ User found:', user.email, '- Role:', user.role);

    if (!user.isActive) {
      console.log('❌ Auth failed: User inactive');
      return res.status(401).json({ message: 'User inactive' });
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      console.log('❌ Auth failed: Token revoked');
      return res.status(401).json({ message: 'Token revoked' });
    }

    req.user = user;
    
    // Set orgId context
    if (user.role === 'PLATFORM_ADMIN') {
      req.orgId = req.query.orgId || req.body.orgId || null;
      console.log('✅ Platform Admin - orgId from query/body:', req.orgId || 'none');
    } else {
      req.orgId = user.orgId;
      console.log('✅ Org User - orgId:', req.orgId);
    }

    console.log('✅ Auth success for:', user.email);
    next();
  } catch (err) {
    console.log('❌ Auth error:', err.message);
    res.status(401).json({ message: 'Authentication error', error: err.message });
  }
};

// Check roles
const authorize = (...roles) => (req, res, next) => {
  console.log('🔐 Role check:', req.user?.role, '- Required:', roles);
  if (!roles.includes(req.user.role)) {
    console.log('❌ Role check failed');
    return res.status(403).json({ message: 'Not authorized for this action' });
  }
  console.log('✅ Role check passed');
  next();
};

// Platform admin only
const platformAdmin = (req, res, next) => {
  console.log('🔐 Platform Admin check:', req.user?.role);
  if (req.user.role !== 'PLATFORM_ADMIN') {
    console.log('❌ Platform Admin required');
    return res.status(403).json({ message: 'Platform Admin access required' });
  }
  console.log('✅ Platform Admin check passed');
  next();
};

// Org admin or above
const orgAdmin = (req, res, next) => {
  console.log('🔐 Org Admin check:', req.user?.role);
  if (!['PLATFORM_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    console.log('❌ Org Admin required');
    return res.status(403).json({ message: 'Organization Admin access required' });
  }
  console.log('✅ Org Admin check passed');
  next();
};

// HR admin or above
const hrAdmin = (req, res, next) => {
  console.log('🔐 HR Admin check:', req.user?.role);
  if (!['PLATFORM_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'].includes(req.user.role)) {
    console.log('❌ HR Admin required');
    return res.status(403).json({ message: 'HR Admin access required' });
  }
  console.log('✅ HR Admin check passed');
  next();
};

// Manager or above
const manager = (req, res, next) => {
  console.log('🔐 Manager check:', req.user?.role);
  if (req.user.role === 'EMPLOYEE') {
    console.log('❌ Manager required');
    return res.status(403).json({ message: 'Manager access required' });
  }
  console.log('✅ Manager check passed');
  next();
};

module.exports = { auth, authorize, platformAdmin, orgAdmin, hrAdmin, manager };