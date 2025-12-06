require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const email = 'admin@hrms.com';
    const password = 'admin123';
    
    console.log('Testing login for:', email);
    console.log('Password:', password);
    console.log('');
    
    // Find user - need to select password explicitly
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log('✅ User found');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Has password field:', !!user.password);
    console.log('  Password hash:', user.password?.substring(0, 20) + '...');
    console.log('');
    
    // Test password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch ? '✅ YES' : '❌ NO');
    
    if (!isMatch) {
      console.log('\n❌ PASSWORD MISMATCH!');
      console.log('This means the password hash in database is wrong.');
      console.log('Solution: Delete the user and run seed.js again');
    } else {
      console.log('\n✅ LOGIN WOULD SUCCEED');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

testLogin();