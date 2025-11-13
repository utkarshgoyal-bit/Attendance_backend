// Simple System Diagnostic Script (No external dependencies)
// Run this with: node diagnose_simple.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const BACKEND_PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

console.log('\n🔍 HR SYSTEM DIAGNOSTIC TOOL\n');
console.log('='.repeat(50));

// Test 1: Check .env file
function checkEnvFile() {
  console.log('\n📄 Test 1: Environment Configuration');
  
  if (!MONGO_URI) {
    console.log('❌ MONGO_URI not found in .env file');
    return false;
  }
  
  console.log('✅ .env file loaded');
  console.log(`   MONGO_URI: ${MONGO_URI.substring(0, 30)}...`);
  console.log(`   PORT: ${BACKEND_PORT}`);
  return true;
}

// Test 2: MongoDB Connection
async function testMongoDB() {
  console.log('\n📊 Test 2: MongoDB Connection');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   Collections found: ${collections.length}`);
    
    if (collections.length === 0) {
      console.log('   ⚠️  No collections found - database is empty');
    } else {
      collections.forEach(col => console.log(`   - ${col.name}`));
    }
    
    // Check employees
    const empCount = await mongoose.connection.collection('employees').countDocuments();
    console.log(`   Total employees: ${empCount}`);
    
    if (empCount === 0) {
      console.log('   ⚠️  No employees found - need to create admin user');
    } else {
      // Check for admin
      const adminCount = await mongoose.connection.collection('employees').countDocuments({ 
        role: { $in: ['SUPER_ADMIN', 'HR_ADMIN'] } 
      });
      console.log(`   Admin users: ${adminCount}`);
      
      if (adminCount === 0) {
        console.log('   ⚠️  No admin users found');
      }
    }
    
    // Check branches
    const branchCount = await mongoose.connection.collection('branches').countDocuments();
    console.log(`   Total branches: ${branchCount}`);
    
    if (branchCount === 0) {
      console.log('   ⚠️  No branches found');
    }
    
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 3: Backend Server
function testBackend() {
  console.log('\n🖥️  Test 3: Backend Server');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Backend server is running');
          console.log(`   Status: ${res.statusCode}`);
          try {
            const jsonData = JSON.parse(data);
            console.log(`   Response: ${JSON.stringify(jsonData)}`);
            if (jsonData.mode) {
              console.log(`   Mode: ${jsonData.mode}`);
            }
          } catch (e) {
            console.log(`   Response: ${data}`);
          }
          resolve(true);
        } else {
          console.log(`⚠️  Server responded with status: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Backend server not responding');
      console.log(`   Error: ${error.message}`);
      console.log(`   Make sure server is running on port ${BACKEND_PORT}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Request timed out');
      console.log(`   Server may not be running on port ${BACKEND_PORT}`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Test 4: Check if server file exists
async function checkServerFile() {
  console.log('\n📁 Test 4: Server Files');
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const indexPath = path.join(process.cwd(), 'src', 'index.js');
    
    if (fs.existsSync(indexPath)) {
      console.log('✅ src/index.js found');
      
      // Read and check for authentication
      const content = fs.readFileSync(indexPath, 'utf8');
      
      if (content.includes('authenticate,')) {
        console.log('   ⚠️  Authentication middleware is ENABLED');
        console.log('   → All routes require JWT token');
        console.log('   → Need to login first OR disable auth for testing');
      } else if (content.includes('authenticate')) {
        console.log('   ⚠️  Authentication middleware detected');
      } else {
        console.log('   ✅ No authentication middleware found (testing mode)');
      }
    } else {
      console.log('❌ src/index.js not found');
      console.log('   Current directory:', process.cwd());
    }
  } catch (error) {
    console.log('⚠️  Could not check server file');
  }
}

// Main diagnostic function
async function runDiagnostics() {
  try {
    // Test 1: Environment
    const envOK = checkEnvFile();
    
    if (!envOK) {
      console.log('\n❌ Environment configuration failed');
      console.log('   Fix: Check your .env file has MONGO_URI');
      process.exit(1);
    }
    
    // Test 2: MongoDB
    const mongoOK = await testMongoDB();
    
    // Test 3: Backend
    const backendOK = await testBackend();
    
    // Test 4: Server file
    await checkServerFile();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 DIAGNOSTIC SUMMARY\n');
    
    if (!mongoOK) {
      console.log('❌ CRITICAL: MongoDB connection failed');
      console.log('\n🔧 FIX:');
      console.log('   1. Check MONGO_URI in .env file');
      console.log('   2. Make sure MongoDB Atlas/local DB is accessible');
      console.log('   3. Check network connection');
    } else if (!backendOK) {
      console.log('❌ CRITICAL: Backend server not running');
      console.log('\n🔧 FIX:');
      console.log('   1. Start backend: npm start');
      console.log('   2. Check for errors in server startup');
      console.log('   3. Make sure port ' + BACKEND_PORT + ' is not in use');
    } else {
      console.log('✅ System is operational!');
      console.log('\n📝 IMPORTANT NOTES:');
      
      const empCount = await mongoose.connection.collection('employees').countDocuments();
      const branchCount = await mongoose.connection.collection('branches').countDocuments();
      
      if (empCount === 0) {
        console.log('   ⚠️  No employees - create admin user first');
        console.log('      Run: node createAdmin.js');
      }
      
      if (branchCount === 0) {
        console.log('   ⚠️  No branches - create a branch first');
      }
      
      console.log('\n🎯 AUTHENTICATION STATUS:');
      console.log('   If auth is ENABLED → Need to login first');
      console.log('   If auth is DISABLED → Can create branches/employees directly');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('   1. For TESTING: Use index_testing.js (auth disabled)');
      console.log('   2. For PRODUCTION: Use index_production.js (auth enabled)');
      console.log('   3. Create admin: node createAdmin.js');
      console.log('   4. Test frontend: npm start in hr-frontend folder');
    }
    
  } catch (error) {
    console.log('\n❌ Diagnostic failed');
    console.log(`   Error: ${error.message}`);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    console.log('\n' + '='.repeat(50) + '\n');
    process.exit(0);
  }
}

// Run diagnostics
runDiagnostics();
