import mongoose from 'mongoose';
import Employee from './src/models/employeeModel.js';
import dotenv from 'dotenv';

dotenv.config();

const getEmployees = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const employees = await Employee.find().limit(5);
    
    console.log('\n=== Employee IDs ===\n');
    employees.forEach(emp => {
      console.log(`ID: ${emp._id}`);
      console.log(`Name: ${emp.firstName} ${emp.lastName}`);
      console.log(`eId: ${emp.eId || 'N/A'}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

getEmployees();