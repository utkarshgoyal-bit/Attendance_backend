import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/employeeModel.js';
import LeaveBalance from '../models/leaveBalanceModel.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://aniketmaitrii:aniketmaitrii@cluster0.fknjg.mongodb.net/attendence-database";

const sampleUsers = [
  // Super Admin
  {
    firstName: 'Admin',
    lastName: 'Super',
    eId: 'EMP001',
    email: 'admin@maitrii.com',
    role: 'SUPER_ADMIN',
    department: 'Administration',
    designation: 'Super Administrator',
    sex: 'Male',
    dob: new Date('1985-01-15').getTime(),
    joiningDate: new Date('2020-01-01').getTime(),
    maritalStatus: 'Married',
    qualification: 'MBA',
    addressLine1: '123 Admin Street',
    country: 'India',
    state: 'Maharashtra',
    mobile: '9876543210',
    baseSalary: '100000',
    isActive: true,
    orgName: 'maitrii'
  },

  // HR Admin
  {
    firstName: 'HR',
    lastName: 'Manager',
    eId: 'EMP002',
    email: 'hr@maitrii.com',
    role: 'HR_ADMIN',
    department: 'Human Resources',
    designation: 'HR Manager',
    sex: 'Female',
    dob: new Date('1988-03-20').getTime(),
    joiningDate: new Date('2020-06-01').getTime(),
    maritalStatus: 'Single',
    qualification: 'MBA - HR',
    addressLine1: '456 HR Avenue',
    country: 'India',
    state: 'Maharashtra',
    mobile: '9876543211',
    baseSalary: '80000',
    isActive: true,
    orgName: 'maitrii'
  },

  // Manager 1 - Engineering
  {
    firstName: 'John',
    lastName: 'Doe',
    eId: 'EMP003',
    email: 'john.doe@maitrii.com',
    role: 'MANAGER',
    department: 'Engineering',
    designation: 'Engineering Manager',
    sex: 'Male',
    dob: new Date('1990-05-10').getTime(),
    joiningDate: new Date('2021-01-15').getTime(),
    maritalStatus: 'Married',
    qualification: 'B.Tech',
    addressLine1: '789 Tech Park',
    country: 'India',
    state: 'Karnataka',
    mobile: '9876543212',
    baseSalary: '75000',
    isActive: true,
    orgName: 'maitrii'
  },

  // Manager 2 - Sales
  {
    firstName: 'Sarah',
    lastName: 'Williams',
    eId: 'EMP004',
    email: 'sarah.williams@maitrii.com',
    role: 'MANAGER',
    department: 'Sales',
    designation: 'Sales Manager',
    sex: 'Female',
    dob: new Date('1987-08-25').getTime(),
    joiningDate: new Date('2021-03-01').getTime(),
    maritalStatus: 'Single',
    qualification: 'MBA',
    addressLine1: '321 Commerce Plaza',
    country: 'India',
    state: 'Delhi',
    mobile: '9876543213',
    baseSalary: '70000',
    isActive: true,
    orgName: 'maitrii'
  },

  // Employee 1 - Engineering team
  {
    firstName: 'Rahul',
    lastName: 'Sharma',
    eId: 'EMP005',
    email: 'rahul.sharma@maitrii.com',
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: 'Senior Developer',
    sex: 'Male',
    dob: new Date('1995-02-14').getTime(),
    joiningDate: new Date('2022-01-10').getTime(),
    maritalStatus: 'Single',
    qualification: 'B.Tech - CSE',
    addressLine1: '111 Dev Colony',
    country: 'India',
    state: 'Karnataka',
    mobile: '9876543214',
    baseSalary: '60000',
    isActive: true,
    orgName: 'maitrii'
  },

  // Employee 2 - Engineering team
  {
    firstName: 'Priya',
    lastName: 'Patel',
    eId: 'EMP006',
    email: 'priya.patel@maitrii.com',
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: 'Developer',
    sex: 'Female',
    dob: new Date('1996-07-22').getTime(),
    joiningDate: new Date('2022-03-15').getTime(),
    maritalStatus: 'Single',
    qualification: 'B.Tech - IT',
    addressLine1: '222 Tech Street',
    country: 'India',
    state: 'Gujarat',
    mobile: '9876543215',
    baseSalary: '55000',
    isActive: true,
    orgName: 'maitrii'
  },

  // Employee 3 - Sales team
  {
    firstName: 'Amit',
    lastName: 'Kumar',
    eId: 'EMP007',
    email: 'amit.kumar@maitrii.com',
    role: 'EMPLOYEE',
    department: 'Sales',
    designation: 'Sales Executive',
    sex: 'Male',
    dob: new Date('1994-11-30').getTime(),
    joiningDate: new Date('2022-06-01').getTime(),
    maritalStatus: 'Married',
    qualification: 'BBA',
    addressLine1: '333 Market Road',
    country: 'India',
    state: 'Delhi',
    mobile: '9876543216',
    baseSalary: '50000',
    isActive: true,
    orgName: 'maitrii'
  },

  // Employee 4 - Sales team
  {
    firstName: 'Neha',
    lastName: 'Singh',
    eId: 'EMP008',
    email: 'neha.singh@maitrii.com',
    role: 'EMPLOYEE',
    department: 'Sales',
    designation: 'Sales Executive',
    sex: 'Female',
    dob: new Date('1997-04-18').getTime(),
    joiningDate: new Date('2023-01-15').getTime(),
    maritalStatus: 'Single',
    qualification: 'MBA',
    addressLine1: '444 Sales Avenue',
    country: 'India',
    state: 'Maharashtra',
    mobile: '9876543217',
    baseSalary: '48000',
    isActive: true,
    orgName: 'maitrii'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing employees (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing sample employees...');
    await Employee.deleteMany({
      email: {
        $in: sampleUsers.map(u => u.email)
      }
    });

    console.log('👥 Creating sample employees...');

    // Create employees
    const createdEmployees = await Employee.insertMany(sampleUsers);
    console.log(`✅ Created ${createdEmployees.length} employees`);

    // Update manager references
    console.log('🔗 Setting up manager relationships...');

    const johnManager = createdEmployees.find(e => e.email === 'john.doe@maitrii.com');
    const sarahManager = createdEmployees.find(e => e.email === 'sarah.williams@maitrii.com');

    // Assign Engineering team to John
    await Employee.updateMany(
      {
        email: {
          $in: ['rahul.sharma@maitrii.com', 'priya.patel@maitrii.com']
        }
      },
      { managerId: johnManager._id }
    );

    // Assign Sales team to Sarah
    await Employee.updateMany(
      {
        email: {
          $in: ['amit.kumar@maitrii.com', 'neha.singh@maitrii.com']
        }
      },
      { managerId: sarahManager._id }
    );

    console.log('✅ Manager relationships established');

    // Create leave balances for all employees
    console.log('📅 Creating leave balances...');

    const leaveBalances = createdEmployees.map(emp => ({
      employeeId: emp._id,
      year: new Date().getFullYear(),
      casualLeave: { total: 12, used: 0, remaining: 12 },
      sickLeave: { total: 12, used: 0, remaining: 12 },
      earnedLeave: { total: 15, used: 0, remaining: 15 }
    }));

    await LeaveBalance.insertMany(leaveBalances);
    console.log(`✅ Created leave balances for ${leaveBalances.length} employees`);

    // Display created users
    console.log('\n📋 Sample Users Created:');
    console.log('========================\n');

    createdEmployees.forEach(emp => {
      console.log(`${emp.role.padEnd(15)} | ${emp.eId.padEnd(10)} | ${emp.email.padEnd(30)} | ${emp.firstName} ${emp.lastName}`);
    });

    console.log('\n🔐 Access Control:');
    console.log('==================');
    console.log('SUPER_ADMIN  : Full system access');
    console.log('HR_ADMIN     : HR operations, salary, leave, attendance');
    console.log('MANAGER      : Team management, attendance approval, leave approval');
    console.log('EMPLOYEE     : Own data access, leave application, attendance check-in');

    console.log('\n✅ Seed completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed
seedDatabase();
