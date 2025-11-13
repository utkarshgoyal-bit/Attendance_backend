# 🔧 COMPLETE SYSTEM FIX GUIDE

## Problem Diagnosis

You're experiencing issues with:
1. ❌ Cannot create branches
2. ❌ Cannot create employees  
3. ❌ System not working properly

## Root Cause

Your backend has **authentication middleware** enabled on ALL routes except `/api/auth`. This means you MUST:
- Either **login first** to get a token
- OR **temporarily disable authentication** for testing

---

## ✅ SOLUTION 1: Quick Fix (Disable Auth for Testing)

### Step 1: Update `src/index.js`

Replace the file with this version:

```javascript
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Import routes
import employeeRoutes from "./routes/employeeRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import salaryConfigRoutes from "./routes/salaryConfigRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());

// Connect to database
connectDB();

// ⚠️ TESTING MODE - AUTH DISABLED ⚠️
console.log('\n⚠️  WARNING: Authentication is DISABLED for testing\n');

// ALL ROUTES - NO AUTH REQUIRED (for testing)
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/salary-config", salaryConfigRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/config", configRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/branches", branchRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running (Auth Disabled)" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
  console.log(`✓ Health: http://localhost:${PORT}/api/health`);
  console.log(`⚠️  Auth DISABLED - For testing only!\n`);
});
```

### Step 2: Restart Backend

```bash
cd backend  # or wherever your backend is
npm start
```

### Step 3: Test It

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test creating a branch
curl -X POST http://localhost:5000/api/branches \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Branch",
    "code": "TEST01",
    "address": {
      "street": "123 Test St",
      "city": "Test City",
      "state": "Test State",
      "pinCode": "123456"
    },
    "contact": {
      "phone": "9876543210",
      "email": "test@branch.com"
    },
    "orgId": "673db4bb4ea85b50f50f20d4"
  }'

# Test creating an employee
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@company.com",
    "phone": "9876543210",
    "eId": "EMP001",
    "branchId": "673db4bb4ea85b50f50f20d4",
    "department": "IT",
    "designation": "Developer",
    "joiningDate": "2025-01-01",
    "base": 30000,
    "hra": 12000,
    "conveyance": 1600,
    "hasAccount": false,
    "role": "EMPLOYEE",
    "orgId": "673db4bb4ea85b50f50f20d4"
  }'
```

---

## ✅ SOLUTION 2: Proper Fix (Enable Auth with Admin User)

### Step 1: Create Admin User

Run this script:

```bash
node createAdmin.js
```

If `createAdmin.js` doesn't exist, create it:

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const employeeSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  eId: String,
  department: String,
  designation: String,
  joiningDate: Date,
  base: Number,
  hra: Number,
  conveyance: Number,
  hasAccount: Boolean,
  password: String,
  role: String,
  orgId: String
});

const Employee = mongoose.model('Employee', employeeSchema);

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existing = await Employee.findOne({ email: 'admin@company.com' });
    if (existing) {
      console.log('⚠️  Admin already exists!');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await Employee.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@company.com',
      phone: '9876543210',
      eId: 'EMP001',
      department: 'Management',
      designation: 'System Admin',
      joiningDate: new Date(),
      base: 50000,
      hra: 20000,
      conveyance: 1600,
      hasAccount: true,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      orgId: '673db4bb4ea85b50f50f20d4'
    });

    console.log('\n✓ Admin created successfully!\n');
    console.log('Login Credentials:');
    console.log('Email: admin@company.com');
    console.log('Password: admin123');
    console.log('Role: SUPER_ADMIN\n');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
```

### Step 2: Keep Auth Enabled in `src/index.js`

```javascript
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Import routes
import employeeRoutes from "./routes/employeeRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import salaryConfigRoutes from "./routes/salaryConfigRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Import middleware
import { authenticate } from "./middleware/authMiddleware.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());

// Connect to database
connectDB();

// PUBLIC ROUTES (no authentication needed)
app.use("/api/auth", authRoutes);

// PROTECTED ROUTES (authentication required)
app.use("/api/employees", authenticate, employeeRoutes);
app.use("/api/salaries", authenticate, salaryRoutes);
app.use("/api/salary-config", authenticate, salaryConfigRoutes);
app.use("/api/attendance", authenticate, attendanceRoutes);
app.use("/api/config", authenticate, configRoutes);
app.use("/api/leaves", authenticate, leaveRoutes);
app.use("/api/branches", authenticate, branchRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
  console.log(`✓ Health: http://localhost:${PORT}/api/health\n`);
});
```

### Step 3: Update Frontend to Send Token

In your frontend `apiClient.js`:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Step 4: Login to Get Token

```javascript
// In your login component
const handleLogin = async (email, password) => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });
    
    // Save token
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Now all apiClient requests will include the token
    navigate('/home');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

## 📊 Run Diagnostics

Use the diagnostic script I created to check everything:

```bash
node diagnose_system.js
```

This will test:
- MongoDB connection
- Backend server
- Authentication system
- All protected routes
- Employee creation
- Branch creation

---

## 🎯 Which Solution to Use?

### Use Solution 1 (Disable Auth) if:
- ✅ You want to test quickly
- ✅ You're still in development
- ✅ You don't need security yet

### Use Solution 2 (Enable Auth) if:
- ✅ You want proper security
- ✅ You're preparing for production
- ✅ You want the complete system

---

## 🚀 Quick Start Commands

```bash
# 1. Run diagnostics
node diagnose_system.js

# 2. If no admin exists, create one
node createAdmin.js

# 3. Restart backend
cd backend
npm start

# 4. Test frontend
cd hr-frontend
npm start
```

---

## 📞 Still Having Issues?

If the system still doesn't work:

1. **Check backend logs** - Look for error messages
2. **Check frontend console** - Press F12 in browser
3. **Verify MongoDB** - Make sure it's connected
4. **Check .env file** - Make sure MONGO_URI is correct
5. **Run diagnostics** - Use the diagnose_system.js script

---

## ✅ Success Checklist

- [ ] Backend starts without errors
- [ ] Can access http://localhost:5000/api/health
- [ ] Can create branches
- [ ] Can create employees
- [ ] Can login (if auth enabled)
- [ ] Frontend can fetch data

Once all checked, your system is working! 🎉
