import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authenticate = (req, res, next) => {
  try {
    // Check both cookie and Authorization header
    let token = req.cookies?.token;
    
    // If not in cookie, check Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) {
      console.log('❌ No token found in cookies or header');
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    console.log('✅ User authenticated:', decoded.email, decoded.role);
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Access denied: User has role ${req.user.role}, needs one of:`, allowedRoles);
      return res.status(403).json({ 
        message: "Access denied",
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};