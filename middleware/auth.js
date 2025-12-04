const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, access denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found or inactive' });
    if (user.tokenVersion !== decoded.tokenVersion) return res.status(401).json({ message: 'Token revoked' });

    req.user = user;
    req.orgId = user.role === 'PLATFORM_ADMIN' ? req.query.orgId || req.body.orgId : user.orgId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Check roles
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized for this action' });
  }
  next();
};

// Platform admin only
const platformAdmin = (req, res, next) => {
  if (req.user.role !== 'PLATFORM_ADMIN') {
    return res.status(403).json({ message: 'Platform Admin access required' });
  }
  next();
};

// Org admin or above
const orgAdmin = (req, res, next) => {
  if (!['PLATFORM_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Organization Admin access required' });
  }
  next();
};

// HR admin or above
const hrAdmin = (req, res, next) => {
  if (!['PLATFORM_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'HR Admin access required' });
  }
  next();
};

// Manager or above
const manager = (req, res, next) => {
  if (req.user.role === 'EMPLOYEE') {
    return res.status(403).json({ message: 'Manager access required' });
  }
  next();
};

module.exports = { auth, authorize, platformAdmin, orgAdmin, hrAdmin, manager };
