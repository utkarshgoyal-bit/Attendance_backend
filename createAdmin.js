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