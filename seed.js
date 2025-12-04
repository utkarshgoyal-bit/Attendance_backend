require('dotenv').config();
const mongoose = require('mongoose');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hr_system');
    console.log('Connected to MongoDB');
    
    // Import User after connection
    const User = require('./models/User');
    
    // Check if platform admin exists
    const existing = await User.findOne({ role: 'PLATFORM_ADMIN' });
    if (existing) {
      console.log('Platform Admin already exists:', existing.email);
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Create platform admin
    const admin = new User({
      email: 'admin@hrms.com',
      password: 'admin123',
      role: 'PLATFORM_ADMIN',
      isFirstLogin: true,
    });
    await admin.save();
    
    console.log('✅ Platform Admin created successfully!');
    console.log('   Email: admin@hrms.com');
    console.log('   Password: admin123');
    console.log('   (Change password on first login)');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seed();