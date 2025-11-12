# API Security & Route Protection Guide

## Overview

All sensitive API routes are now protected with role-based access control (RBAC). This document provides a comprehensive overview of which roles can access which endpoints.

## Quick Reference

### Role Levels (Hierarchy)
```
SUPER_ADMIN (Level 4) - Full system access
    ↓
HR_ADMIN (Level 3) - HR operations, salary, config viewing
    ↓
MANAGER (Level 2) - Team management, approvals
    ↓
EMPLOYEE (Level 1) - Self-service only
```

## Protected Routes by Module

### 1. Attendance Routes (`/api/attendance`)

| Method | Endpoint | Roles Required | Description |
|--------|----------|----------------|-------------|
| GET | `/qr/active` | ⚠️ **PUBLIC** | Get active QR code |
| POST | `/qr/validate` | ⚠️ **PUBLIC** | Validate QR code |
| POST | `/checkin` | ⚠️ **PUBLIC** | Employee check-in (QR secured) |
| GET | `/today` | MANAGER, HR_ADMIN, SUPER_ADMIN | View today's attendance |
| GET | `/monthly` | EMPLOYEE, MANAGER, HR_ADMIN, SUPER_ADMIN | View monthly attendance |
| GET | `/monthly-summary` | EMPLOYEE, MANAGER, HR_ADMIN, SUPER_ADMIN | Monthly attendance summary |
| PUT | `/approve/:id` | MANAGER, HR_ADMIN, SUPER_ADMIN | Approve attendance |
| PUT | `/reject/:id` | MANAGER, HR_ADMIN, SUPER_ADMIN | Reject attendance |

**Notes:**
- Check-in is public but secured by QR validation
- Employees can view their own attendance
- Managers can approve their team's attendance

---

### 2. Leave Routes (`/api/leaves`)

| Method | Endpoint | Roles Required | Description |
|--------|----------|----------------|-------------|
| POST | `/apply` | EMPLOYEE, MANAGER, HR_ADMIN, SUPER_ADMIN | Apply for leave |
| GET | `/balance/:employeeId` | EMPLOYEE, MANAGER, HR_ADMIN, SUPER_ADMIN | Get leave balance |
| GET | `/` | MANAGER, HR_ADMIN, SUPER_ADMIN | Get all leaves (filtered) |
| GET | `/pending` | MANAGER, HR_ADMIN, SUPER_ADMIN | Get pending leaves |
| PUT | `/approve/:id` | MANAGER, HR_ADMIN, SUPER_ADMIN | Approve leave |
| PUT | `/reject/:id` | MANAGER, HR_ADMIN, SUPER_ADMIN | Reject leave |
| POST | `/bulk-approve` | MANAGER, HR_ADMIN, SUPER_ADMIN | Bulk approve leaves |

**Notes:**
- Any authenticated employee can apply for leave
- Managers can approve their team's leaves
- HR can approve all leaves

---

### 3. Salary Routes (`/api/salaries`)

| Method | Endpoint | Roles Required | Description |
|--------|----------|----------------|-------------|
| POST | `/` | 🔒 HR_ADMIN, SUPER_ADMIN | Create salary record |
| GET | `/` | 🔒 HR_ADMIN, SUPER_ADMIN | Get all salaries |
| PUT | `/:id` | 🔒 HR_ADMIN, SUPER_ADMIN | Edit salary record |
| POST | `/calculate-from-attendance` | 🔒 HR_ADMIN, SUPER_ADMIN | Auto-calculate salary |

**Notes:**
- Only HR and Super Admin can manage salaries
- Most restrictive routes to protect financial data

---

### 4. Salary Config Routes (`/api/salary-config`)

| Method | Endpoint | Roles Required | Description |
|--------|----------|----------------|-------------|
| GET | `/` | 🔒 HR_ADMIN, SUPER_ADMIN | Get salary configuration |
| PUT | `/` | 🔒 HR_ADMIN, SUPER_ADMIN | Update salary configuration |

**Notes:**
- Controls PF, ESI, and other salary calculations
- HR and Super Admin only

---

### 5. Organization Config Routes (`/api/config`)

| Method | Endpoint | Roles Required | Description |
|--------|----------|----------------|-------------|
| GET | `/:orgId` | 🔒 HR_ADMIN, SUPER_ADMIN | Get org configuration |
| PUT | `/:orgId` | 🔐 **SUPER_ADMIN ONLY** | Update entire configuration |
| POST | `/:orgId/reset` | 🔐 **SUPER_ADMIN ONLY** | Reset to defaults |
| PUT | `/:orgId/attendance-timing` | 🔐 **SUPER_ADMIN ONLY** | Update attendance timing |
| PUT | `/:orgId/deductions` | 🔐 **SUPER_ADMIN ONLY** | Update deduction rules |
| PUT | `/:orgId/leave-policy` | 🔐 **SUPER_ADMIN ONLY** | Update leave policy |
| PUT | `/:orgId/working-days` | 🔐 **SUPER_ADMIN ONLY** | Update working days |
| PUT | `/:orgId/qr-settings` | 🔐 **SUPER_ADMIN ONLY** | Update QR settings |
| PUT | `/:orgId/grace-period` | 🔐 **SUPER_ADMIN ONLY** | Update grace period |
| POST | `/:orgId/check-status` | 🔒 HR_ADMIN, SUPER_ADMIN | Check attendance status |
| POST | `/:orgId/calculate-deductions` | 🔒 HR_ADMIN, SUPER_ADMIN | Calculate deductions |

**Notes:**
- Most critical routes - configuration changes affect entire organization
- Only Super Admin can modify settings
- HR can view and use utility functions

---

### 6. Employee Routes (`/api/employees`)

| Method | Endpoint | Roles Required | Description |
|--------|----------|----------------|-------------|
| GET | `/` | MANAGER, HR_ADMIN, SUPER_ADMIN | Get all employees |
| GET | `/stats` | 🔒 HR_ADMIN, SUPER_ADMIN | Get employee statistics |

**Notes:**
- Managers can view employees (typically their team)
- HR and Admin can view all employees
- Stats are restricted to HR and Admin

---

## Testing Protected Routes

### Using Headers (Current Implementation)

Until JWT authentication is implemented, use these headers:

```bash
# Example: Test as HR Admin
curl -X GET http://localhost:5000/api/salaries \
  -H "x-user-role: HR_ADMIN" \
  -H "x-employee-id: <employee_id>"

# Example: Test as Manager
curl -X GET http://localhost:5000/api/leaves/pending \
  -H "x-user-role: MANAGER" \
  -H "x-employee-id: <employee_id>"

# Example: Test as Employee
curl -X POST http://localhost:5000/api/leaves/apply \
  -H "x-user-role: EMPLOYEE" \
  -H "x-employee-id: <employee_id>" \
  -H "Content-Type: application/json" \
  -d '{"leaveType": "CL", "startDate": "2025-12-01", ...}'
```

### Expected Responses

**Success (200/201):**
```json
{
  "message": "Success",
  "data": {...}
}
```

**Forbidden (403):**
```json
{
  "message": "Access denied. Insufficient permissions.",
  "required": ["HR_ADMIN", "SUPER_ADMIN"],
  "current": "EMPLOYEE"
}
```

**Unauthorized (401):**
```json
{
  "message": "Authentication required"
}
```

## Security Features

### Implemented ✅

1. **Role-Based Access Control (RBAC)**
   - 4-tier role hierarchy
   - Middleware-based route protection
   - Granular permission control

2. **Header-Based Authentication (Testing)**
   - `x-user-role`: User's role
   - `x-user-id`: User ID
   - `x-employee-id`: Employee ID

3. **Route Protection**
   - Public routes: QR codes, check-in
   - Employee routes: Self-service (leave, attendance view)
   - Manager routes: Team approvals
   - HR routes: Salary, all employee data
   - Admin routes: Configuration changes

### To Be Implemented 🔜

1. **JWT Authentication**
   - Replace header-based auth
   - Token generation on login
   - Token validation middleware
   - Refresh token mechanism

2. **Password Security**
   - Bcrypt hashing
   - Password policies
   - Reset functionality

3. **Additional Security**
   - Rate limiting
   - CORS configuration
   - Input validation
   - SQL injection protection
   - XSS prevention
   - CSRF tokens

4. **Audit Logging**
   - Track all role-based access
   - Log permission violations
   - Monitor sensitive operations

## Permission Matrix

| Feature | Employee | Manager | HR Admin | Super Admin |
|---------|----------|---------|----------|-------------|
| **Attendance** |
| Check-in | ✅ | ✅ | ✅ | ✅ |
| View own attendance | ✅ | ✅ | ✅ | ✅ |
| View team attendance | ❌ | ✅ | ✅ | ✅ |
| Approve attendance | ❌ | ✅ | ✅ | ✅ |
| **Leave** |
| Apply leave | ✅ | ✅ | ✅ | ✅ |
| View own balance | ✅ | ✅ | ✅ | ✅ |
| Approve team leave | ❌ | ✅ | ✅ | ✅ |
| Approve all leave | ❌ | ❌ | ✅ | ✅ |
| **Salary** |
| View own salary | 🔜 | 🔜 | 🔜 | 🔜 |
| Process salaries | ❌ | ❌ | ✅ | ✅ |
| Manage salary config | ❌ | ❌ | ✅ | ✅ |
| **Configuration** |
| View org config | ❌ | ❌ | ✅ | ✅ |
| Update config | ❌ | ❌ | ❌ | ✅ |
| **Employees** |
| View own profile | ✅ | ✅ | ✅ | ✅ |
| View team | ❌ | ✅ | ✅ | ✅ |
| View all employees | ❌ | ❌ | ✅ | ✅ |

## Common Use Cases

### 1. Employee Workflow
```
1. Login → Get JWT token with role EMPLOYEE
2. Check-in → POST /api/attendance/checkin (public)
3. Apply leave → POST /api/leaves/apply (authenticated)
4. View balance → GET /api/leaves/balance/:id (own data)
5. View attendance → GET /api/attendance/monthly (own data)
```

### 2. Manager Workflow
```
1. Login → Get JWT token with role MANAGER
2. View team attendance → GET /api/attendance/today
3. Approve attendance → PUT /api/attendance/approve/:id
4. View pending leaves → GET /api/leaves/pending
5. Approve/Reject leave → PUT /api/leaves/approve/:id
```

### 3. HR Admin Workflow
```
1. Login → Get JWT token with role HR_ADMIN
2. View all employees → GET /api/employees
3. Process salaries → POST /api/salaries/calculate-from-attendance
4. View all leaves → GET /api/leaves/
5. Configure salary → PUT /api/salary-config
```

### 4. Super Admin Workflow
```
1. Login → Get JWT token with role SUPER_ADMIN
2. Update org config → PUT /api/config/:orgId
3. Manage all operations → Full access to all endpoints
4. View system stats → GET /api/employees/stats
```

## Troubleshooting

### 403 Forbidden Error
- Check if the user's role is included in the route's allowed roles
- Verify headers: `x-user-role` is correct
- Confirm route protection in the route file

### 401 Unauthorized Error
- Ensure authentication headers are present
- In future: Check if JWT token is valid

### Missing Role Header
- Add `x-user-role` header to request
- In future: Will be extracted from JWT token

## Best Practices

1. **Always use HTTPS in production**
2. **Never hardcode credentials**
3. **Log all permission violations**
4. **Implement rate limiting**
5. **Validate all inputs**
6. **Use environment variables for sensitive data**
7. **Regular security audits**
8. **Keep dependencies updated**

## Next Steps

1. ✅ RBAC implementation - **COMPLETE**
2. 🔜 JWT authentication
3. 🔜 Password management
4. 🔜 Frontend role-based UI
5. 🔜 Audit logging
6. 🔜 Rate limiting
7. 🔜 Production security hardening
