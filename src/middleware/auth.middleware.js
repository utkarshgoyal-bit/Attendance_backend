import jwt from "jsonwebtoken";
import Employee from "../models/Employee.model.js";

// Role hierarchy for permission checking
const ROLE_HIERARCHY = { EMPLOYEE: 1, MANAGER: 2, HR_ADMIN: 3, SUPER_ADMIN: 4 };

/**
 * Authentication Middleware
 * Supports both JWT tokens and header-based auth for backwards compatibility
 */
export const authenticate = async (req, res, next) => {
  try {
    // Try JWT first
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    
    if (token && token !== "undefined") {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "hr-secret-key");
      const user = await Employee.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Fallback to header-based auth (for testing/backwards compatibility)
    const role = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"];
    
    if (role && userId) {
      req.user = { id: userId, role, employeeId: req.headers["x-employee-id"] || userId };
      return next();
    }

    return res.status(401).json({ message: "Authentication required" });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Role-based access control middleware
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const hasAccess = allowedRoles.some(role => userRoleLevel >= (ROLE_HIERARCHY[role] || 0));

    if (!hasAccess) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

/**
 * Generate JWT token
 */
export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET || "hr-secret-key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};
