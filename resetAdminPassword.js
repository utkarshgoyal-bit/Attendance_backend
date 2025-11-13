import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const Employee = mongoose.model('Employee', new mongoose.Schema({
      email: String,
      password: String,
      hasAccount: Boolean
    }));
    
    const newPassword = await bcrypt.hash('admin123', 10);
    
    const result = await Employee.updateOne(
      { email: 'admin@company.com' },
      { 
        password: newPassword,
        hasAccount: true 
      }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Password reset successfully!\n');
      console.log('Login with:');
      console.log('  Email: admin@company.com');
      console.log('  Password: admin123\n');
    } else {
      console.log('❌ User admin@company.com not found');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();