const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('🔍 AUTH V4 - FINAL');
    
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'User inactive' });
    }

    // Set user first
    req.user = user;
    
    // Set orgId safely
    if (user.role === 'PLATFORM_ADMIN') {
      // Platform admin: get orgId from query or body, default to null
      req.orgId = (req.query && req.query.orgId) || (req.body && req.body.orgId) || null;
    } else {
      // Other users: use their orgId
      req.orgId = user.orgId || null;
    }

    console.log('✅ Auth success:', user.email, user.role);
    next();
  } catch (err) {
    console.log('❌ Auth error:', err.message);
    return res.status(401).json({ message: 'Auth error', error: err.message });
  }
};

const platformAdmin = (req, res, next) => {
  if (req.user.role !== 'PLATFORM_ADMIN') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
};

const orgAdmin = (req, res, next) => {
  if (!['PLATFORM_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Org Admin required' });
  }
  next();
};

const hrAdmin = (req, res, next) => {
  if (!['PLATFORM_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'HR Admin required' });
  }
  next();
};

const manager = (req, res, next) => {
  if (req.user.role === 'EMPLOYEE') {
    return res.status(403).json({ message: 'Manager required' });
  }
  next();
};

module.exports = { auth, platformAdmin, orgAdmin, hrAdmin, manager };