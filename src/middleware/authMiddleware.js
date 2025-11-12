// Authentication and Authorization Middleware

/**
 * Middleware to require specific roles for route access
 * Usage: router.get('/route', requireRole('HR_ADMIN', 'SUPER_ADMIN'), controller)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // TODO: Get user from session/token when auth is implemented
    // For now, extract from headers for testing
    const userRole = req.headers['x-user-role'] || 'EMPLOYEE';
    const userId = req.headers['x-user-id'];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: userRole
      });
    }

    // Attach user info to request
    req.user = {
      id: userId,
      role: userRole
    };

    next();
  };
};

/**
 * Middleware to extract user information from request
 * Attaches user info to req.user for use in controllers
 */
export const extractUser = (req, res, next) => {
  // TODO: Extract from JWT token when auth is implemented
  // For now, use headers for testing
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'] || 'EMPLOYEE';
  const employeeId = req.headers['x-employee-id'];

  req.user = {
    id: userId,
    role: userRole,
    employeeId: employeeId
  };

  next();
};

/**
 * Check if user is authenticated
 * For future JWT implementation
 */
export const isAuthenticated = (req, res, next) => {
  // TODO: Implement JWT verification
  // For now, just check if user headers exist
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  next();
};

/**
 * Role hierarchy for permission checking
 */
export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  HR_ADMIN: 'HR_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

/**
 * Check if user has permission based on role hierarchy
 * SUPER_ADMIN > HR_ADMIN > MANAGER > EMPLOYEE
 */
export const hasPermission = (userRole, requiredRole) => {
  const hierarchy = {
    EMPLOYEE: 1,
    MANAGER: 2,
    HR_ADMIN: 3,
    SUPER_ADMIN: 4
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
};

/**
 * Middleware to check if user can access employee data
 * - Employees can only access their own data
 * - Managers can access their team members' data
 * - HR_ADMIN and SUPER_ADMIN can access all data
 */
export const canAccessEmployee = async (req, res, next) => {
  const userRole = req.headers['x-user-role'] || 'EMPLOYEE';
  const userId = req.headers['x-employee-id'];
  const targetEmployeeId = req.params.employeeId || req.body.employeeId;

  // Admins can access all
  if (userRole === 'HR_ADMIN' || userRole === 'SUPER_ADMIN') {
    return next();
  }

  // Employees can only access their own data
  if (userRole === 'EMPLOYEE' && userId !== targetEmployeeId) {
    return res.status(403).json({
      message: 'Access denied. You can only access your own data.'
    });
  }

  // TODO: For managers, check if target employee reports to them
  // This requires querying the database to check managerId

  next();
};

export default {
  requireRole,
  extractUser,
  isAuthenticated,
  ROLES,
  hasPermission,
  canAccessEmployee
};
