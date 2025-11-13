// System Diagnostic Script
// Run this with: node diagnose_system.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BACKEND_URL = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI;

console.log('\n🔍 HR SYSTEM DIAGNOSTIC TOOL\n');
console.log('=' . repeat(50));

// Test 1: MongoDB Connection
async function testMongoDB() {
  console.log('\n📊 Test 1: MongoDB Connection');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   Collections found: ${collections.length}`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Check if admin exists
    const adminCount = await mongoose.connection.collection('employees').countDocuments({ role: 'SUPER_ADMIN' });
    console.log(`   Super Admin accounts: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('   ⚠️  WARNING: No Super Admin found!');
    }
    
    // Check employee count
    const empCount = await mongoose.connection.collection('employees').countDocuments();
    console.log(`   Total employees: ${empCount}`);
    
    // Check branch count
    const branchCount = await mongoose.connection.collection('branches').countDocuments();
    console.log(`   Total branches: ${branchCount}`);
    
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 2: Backend Server
async function testBackend() {
  console.log('\n🖥️  Test 2: Backend Server');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend server is running');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Message: ${response.data.message}`);
    return true;
  } catch (error) {
    console.log('❌ Backend server not responding');
    console.log(`   Error: ${error.message}`);
    console.log('   Make sure backend is running on port 5000');
    return false;
  }
}

// Test 3: Auth Endpoint
async function testAuth() {
  console.log('\n🔐 Test 3: Authentication System');
  try {
    // Try to login with common credentials
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'admin123'
    });
    console.log('✅ Authentication endpoint is working');
    console.log(`   Login successful for: admin@company.com`);
    if (response.data.token) {
      console.log(`   Token received: ${response.data.token.substring(0, 20)}...`);
      return response.data.token;
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ Authentication failed');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message}`);
      
      if (error.response.status === 401) {
        console.log('   ⚠️  Admin credentials may not exist');
      }
    } else {
      console.log('❌ Cannot reach auth endpoint');
      console.log(`   Error: ${error.message}`);
    }
  }
  return null;
}

// Test 4: Protected Routes (with token)
async function testProtectedRoutes(token) {
  console.log('\n🔒 Test 4: Protected Routes');
  
  if (!token) {
    console.log('⚠️  Skipping protected routes test (no token)');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const routes = [
    { name: 'Employees', url: '/employees' },
    { name: 'Branches', url: '/branches', method: 'post', data: { orgId: '673db4bb4ea85b50f50f20d4' } },
    { name: 'Salary Config', url: '/salary-config' },
    { name: 'Attendance', url: '/attendance/today' }
  ];
  
  for (const route of routes) {
    try {
      const config = { headers };
      let response;
      
      if (route.method === 'post') {
        response = await axios.post(`${BACKEND_URL}${route.url}`, route.data, config);
      } else {
        response = await axios.get(`${BACKEND_URL}${route.url}`, config);
      }
      
      console.log(`   ✅ ${route.name}: Accessible`);
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ ${route.name}: ${error.response.status} - ${error.response.data.message || 'Error'}`);
      } else {
        console.log(`   ❌ ${route.name}: ${error.message}`);
      }
    }
  }
}

// Test 5: Create Employee Endpoint
async function testCreateEmployee(token) {
  console.log('\n👤 Test 5: Create Employee Endpoint');
  
  if (!token) {
    console.log('⚠️  Skipping create employee test (no token)');
    return;
  }
  
  const testEmployee = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@company.com`,
    phone: '9876543210',
    eId: `TEST${Date.now()}`,
    branchId: '673db4bb4ea85b50f50f20d4',
    department: 'IT',
    designation: 'Developer',
    joiningDate: new Date().toISOString(),
    base: 30000,
    hra: 12000,
    conveyance: 1600,
    hasAccount: false,
    role: 'EMPLOYEE',
    orgId: '673db4bb4ea85b50f50f20d4'
  };
  
  try {
    const response = await axios.post(
      `${BACKEND_URL}/employees`,
      testEmployee,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('✅ Create employee endpoint is working');
    console.log(`   Created employee: ${testEmployee.firstName} ${testEmployee.lastName}`);
    console.log(`   Employee ID: ${testEmployee.eId}`);
    return response.data;
  } catch (error) {
    console.log('❌ Create employee failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.response.data}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  return null;
}

// Test 6: Create Branch Endpoint
async function testCreateBranch(token) {
  console.log('\n🏢 Test 6: Create Branch Endpoint');
  
  if (!token) {
    console.log('⚠️  Skipping create branch test (no token)');
    return;
  }
  
  const testBranch = {
    name: 'Test Branch',
    code: `BR${Date.now()}`,
    address: {
      street: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      pinCode: '123456'
    },
    contact: {
      phone: '9876543210',
      email: 'test@branch.com'
    },
    orgId: '673db4bb4ea85b50f50f20d4'
  };
  
  try {
    const response = await axios.post(
      `${BACKEND_URL}/branches`,
      testBranch,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('✅ Create branch endpoint is working');
    console.log(`   Created branch: ${testBranch.name}`);
    console.log(`   Branch code: ${testBranch.code}`);
    return response.data;
  } catch (error) {
    console.log('❌ Create branch failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.response.data}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  return null;
}

// Main diagnostic function
async function runDiagnostics() {
  try {
    // Test MongoDB
    const mongoOK = await testMongoDB();
    
    // Test Backend
    const backendOK = await testBackend();
    
    if (!mongoOK || !backendOK) {
      console.log('\n❌ Basic connectivity failed. Fix these first:\n');
      if (!mongoOK) console.log('   1. Check MongoDB connection string in .env');
      if (!backendOK) console.log('   2. Start backend server: cd backend && npm start');
      process.exit(1);
    }
    
    // Test Auth
    const token = await testAuth();
    
    // Test Protected Routes
    await testProtectedRoutes(token);
    
    // Test Create Employee
    await testCreateEmployee(token);
    
    // Test Create Branch
    await testCreateBranch(token);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 DIAGNOSTIC SUMMARY\n');
    
    if (token) {
      console.log('✅ System is working correctly!');
      console.log('\nYou can now:');
      console.log('   1. Login with: admin@company.com / admin123');
      console.log('   2. Create employees and branches');
      console.log('   3. Use all system features');
    } else {
      console.log('⚠️  System partially working');
      console.log('\nIssues found:');
      console.log('   - Authentication not working');
      console.log('   - May need to create admin user');
      console.log('\nRun this to create admin:');
      console.log('   node createAdmin.js');
    }
    
  } catch (error) {
    console.log('\n❌ Diagnostic failed');
    console.log(`   Error: ${error.message}`);
  } finally {
    await mongoose.disconnect();
    console.log('\n' + '='.repeat(50) + '\n');
    process.exit(0);
  }
}

// Run diagnostics
runDiagnostics();
