require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Delete existing admin
    const deleted = await User.deleteOne({ email: 'admin@hrms.com' });
    console.log('Deleted existing admin:', deleted.deletedCount > 0 ? 'YES' : 'NO');
    
    // Create new admin
    const admin = new User({
      email: 'admin@hrms.com',
      password: 'admin123',
      role: 'PLATFORM_ADMIN',
      isFirstLogin: true,
      isActive: true,
      orgId: null,
      employeeId: null,
      tokenVersion: 0,
    });
    
    await admin.save();
    
    console.log('✅ NEW Platform Admin created!');
    console.log('   Email: admin@hrms.com');
    console.log('   Password: admin123');
    console.log('   Role: PLATFORM_ADMIN');
    console.log('   isFirstLogin: true');
    console.log('\n⚠️  You will need to:');
    console.log('   1. Login with admin@hrms.com / admin123');
    console.log('   2. Change password on first login');
    console.log('   3. Set security questions');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

resetAdmin();