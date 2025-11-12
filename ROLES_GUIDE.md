# Role-Based Access Control (RBAC) Guide

## Overview

The system now includes role-based access control with four distinct user roles, each with specific permissions and responsibilities.

## User Roles

### 1. SUPER_ADMIN
**Highest level of access**
- Full system access
- Manage all users and their roles
- Access all organizational data
- Configure system settings
- Override any restrictions

### 2. HR_ADMIN
**Human Resources Administrator**
- Manage employee records
- Process salaries for all employees
- View and manage all leave applications
- Configure organization policies
- Access attendance records
- Generate reports

### 3. MANAGER
**Team/Department Manager**
- Manage team members' data
- Approve/reject team attendance
- Approve/reject team leave applications
- View team performance metrics
- Cannot access other teams' data

### 4. EMPLOYEE
**Regular Employee**
- View and update own profile
- Apply for leave
- Check-in/check-out attendance
- View own attendance records
- View own salary slips
- Cannot access other employees' data

## Role Hierarchy

```
SUPER_ADMIN (Level 4)
    ↓
HR_ADMIN (Level 3)
    ↓
MANAGER (Level 2)
    ↓
EMPLOYEE (Level 1)
```

## Sample Users

Run the seed script to create sample users for testing:

```bash
npm run seed
```

### Created Users

| Role         | Employee ID | Email                      | Password | Department      |
|--------------|-------------|----------------------------|----------|-----------------|
| SUPER_ADMIN  | EMP001      | admin@maitrii.com          | TBD      | Administration  |
| HR_ADMIN     | EMP002      | hr@maitrii.com             | TBD      | Human Resources |
| MANAGER      | EMP003      | john.doe@maitrii.com       | TBD      | Engineering     |
| MANAGER      | EMP004      | sarah.williams@maitrii.com | TBD      | Sales          |
| EMPLOYEE     | EMP005      | rahul.sharma@maitrii.com   | TBD      | Engineering     |
| EMPLOYEE     | EMP006      | priya.patel@maitrii.com    | TBD      | Engineering     |
| EMPLOYEE     | EMP007      | amit.kumar@maitrii.com     | TBD      | Sales          |
| EMPLOYEE     | EMP008      | neha.singh@maitrii.com     | TBD      | Sales          |

### Manager-Employee Relationships

**Engineering Team (Manager: John Doe)**
- Rahul Sharma (EMP005)
- Priya Patel (EMP006)

**Sales Team (Manager: Sarah Williams)**
- Amit Kumar (EMP007)
- Neha Singh (EMP008)

## Using the Authentication Middleware

### In Routes

Protect routes by requiring specific roles:

```javascript
import { requireRole, ROLES } from '../middleware/authMiddleware.js';

// Only HR_ADMIN and SUPER_ADMIN can access
router.get('/salaries',
  requireRole(ROLES.HR_ADMIN, ROLES.SUPER_ADMIN),
  getSalaries
);

// Only MANAGER and above can approve attendance
router.put('/attendance/approve/:id',
  requireRole(ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN),
  approveAttendance
);

// Any authenticated employee can access
router.get('/profile',
  requireRole(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN),
  getProfile
);
```

### Testing with Headers

Until JWT authentication is implemented, use headers for testing:

```bash
# Test as HR Admin
curl -H "x-user-role: HR_ADMIN" \
     -H "x-user-id: <user_id>" \
     -H "x-employee-id: <employee_id>" \
     http://localhost:5000/api/salaries

# Test as Manager
curl -H "x-user-role: MANAGER" \
     -H "x-employee-id: <employee_id>" \
     http://localhost:5000/api/attendance/pending

# Test as Employee
curl -H "x-user-role: EMPLOYEE" \
     -H "x-employee-id: <employee_id>" \
     http://localhost:5000/api/leaves/balance/<employee_id>
```

## Permission Matrix

| Feature                  | EMPLOYEE | MANAGER | HR_ADMIN | SUPER_ADMIN |
|-------------------------|----------|---------|----------|-------------|
| View own profile        | ✅       | ✅      | ✅       | ✅          |
| Edit own profile        | ✅       | ✅      | ✅       | ✅          |
| View team data          | ❌       | ✅      | ✅       | ✅          |
| View all employees      | ❌       | ❌      | ✅       | ✅          |
| Apply leave             | ✅       | ✅      | ✅       | ✅          |
| Approve team leave      | ❌       | ✅      | ✅       | ✅          |
| Approve all leave       | ❌       | ❌      | ✅       | ✅          |
| Check-in attendance     | ✅       | ✅      | ✅       | ✅          |
| Approve team attendance | ❌       | ✅      | ✅       | ✅          |
| Process salaries        | ❌       | ❌      | ✅       | ✅          |
| Configure org settings  | ❌       | ❌      | ✅       | ✅          |
| Manage user roles       | ❌       | ❌      | ❌       | ✅          |

## Database Schema Updates

### Employee Model Changes

Added fields:
- `role`: String enum ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN']
- `managerId`: Reference to another Employee (for hierarchy)
- `department`: String (for organizational structure)

### Indexes Added

For better query performance:
- `role`: For filtering by role
- `managerId`: For manager-employee queries
- `department`: For department-based queries

## Next Steps

1. **Implement JWT Authentication**
   - Replace header-based auth with JWT tokens
   - Add login/logout endpoints
   - Store tokens securely on frontend

2. **Password Management**
   - Add password field to Employee model
   - Hash passwords using bcrypt
   - Implement password reset flow

3. **Frontend Integration**
   - Store user role in session/localStorage
   - Show/hide UI elements based on role
   - Redirect unauthorized users

4. **Audit Logging**
   - Track who performed what action
   - Log all role-based access attempts
   - Create audit trail for compliance

## Running the Seed Script

```bash
# Navigate to backend directory
cd Attendance_backend

# Run the seed script
npm run seed
```

The script will:
1. Connect to MongoDB
2. Clear existing sample employees (if any)
3. Create 8 sample employees with different roles
4. Set up manager-employee relationships
5. Create leave balances for all employees
6. Display a summary of created users

## Security Notes

⚠️ **Important**: The current implementation uses headers for testing only.
In production:
- Replace header-based auth with JWT tokens
- Implement proper session management
- Add rate limiting
- Enable HTTPS only
- Add input validation and sanitization
- Implement CSRF protection
