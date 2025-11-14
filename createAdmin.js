import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Employee from './src/models/employeeModel.js';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Employee.findOne({ email: 'admin@company.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Has Account:', existingAdmin.hasAccount);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = new Employee({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@company.com',
      password: hashedPassword,
      mobile: '9876543210',
      eId: 'ADMIN001',
      department: 'Management',
      designation: 'System Administrator',
      joiningDate: Date.now(),
      baseSalary: '100000',
      hra: '40000',
      conveyance: '1600',
      hasAccount: true,
      role: 'SUPER_ADMIN',
      orgId: new mongoose.Types.ObjectId('673db4bb4ea85b50f50f20d4'),
      isActive: true
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log('Email: admin@company.com');
    console.log('Password: admin123');
    console.log('Role: SUPER_ADMIN');
    console.log('Employee ID: ADMIN001');
    console.log('================================');
    console.log('\nYou can now login using these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// Run the script
createAdminUser();
