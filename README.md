# HR Management System v2.0 - Optimized & Lightweight

A streamlined, production-ready HR Management System backend built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB URI
nano .env

# Seed initial data
npm run seed

# Start development server
npm run dev

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── config/          # Database configuration
├── controllers/     # Request handlers (6 files)
├── middleware/      # Auth & error handling (2 files)
├── models/          # Mongoose schemas (6 files)
├── routes/          # API routes (8 files)
├── scripts/         # Utility scripts
└── index.js         # Application entry point
```

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/logout` | Auth | Logout |
| GET | `/api/auth/me` | Auth | Get current user |

### Employees
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/employees` | Manager+ | List employees |
| GET | `/api/employees/:id` | Manager+ | Get employee |
| POST | `/api/employees` | HR+ | Create employee |
| PUT | `/api/employees/:id` | HR+ | Update employee |
| DELETE | `/api/employees/:id` | HR+ | Deactivate employee |
| GET | `/api/employees/stats` | HR+ | Get statistics |

### Attendance
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/attendance/qr/active` | Public | Get QR code |
| POST | `/api/attendance/checkin` | Public | Check-in |
| GET | `/api/attendance/today` | Manager+ | Today's attendance |
| PUT | `/api/attendance/approve/:id` | Manager+ | Approve |
| POST | `/api/attendance/bulk-approve` | Manager+ | Bulk approve |
| GET | `/api/attendance/monthly` | Employee+ | Monthly report |

### Leaves
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/leaves/apply` | Employee+ | Apply for leave |
| GET | `/api/leaves` | Employee+ | List leaves |
| GET | `/api/leaves/balance/:id` | Employee+ | Leave balance |
| PUT | `/api/leaves/approve/:id` | Manager+ | Approve leave |
| PUT | `/api/leaves/reject/:id` | Manager+ | Reject leave |

### Salaries
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/salaries/calculate` | HR+ | Calculate salary |
| GET | `/api/salaries` | HR+ | List salaries |
| PUT | `/api/salaries/approve/:id` | HR+ | Approve salary |
| POST | `/api/salaries/bulk-calculate` | HR+ | Bulk process |
| GET | `/api/salaries/config` | HR+ | Get config |
| PUT | `/api/salaries/config` | SuperAdmin | Update config |

## 🔐 Role Hierarchy

```
SUPER_ADMIN (Level 4) - Full system access
    └── HR_ADMIN (Level 3) - HR operations
            └── MANAGER (Level 2) - Team management
                    └── EMPLOYEE (Level 1) - Self-service
```

## 🏗️ Models

- **Employee** - User accounts & employee data
- **Attendance** - Daily attendance records
- **Leave/LeaveBalance** - Leave requests & balances
- **Salary** - Monthly salary calculations
- **Organization/Branch** - Company structure
- **Config** - Organization settings

## 📊 Features

✅ JWT Authentication  
✅ Role-Based Access Control  
✅ QR-Based Attendance  
✅ Leave Management  
✅ Salary Processing  
✅ Organization Configuration  
✅ Branch Management  

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection | Required |
| JWT_SECRET | Token secret | Required |
| JWT_EXPIRES_IN | Token expiry | 7d |
| FRONTEND_URL | CORS origin | localhost:3000 |

## 📝 Default Admin

```
Email: admin@company.com
Password: admin123
Role: SUPER_ADMIN
```

---

Built with ❤️ for efficiency
