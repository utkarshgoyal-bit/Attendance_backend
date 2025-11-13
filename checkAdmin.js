import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Employee = mongoose.model('Employee', new mongoose.Schema({
      email: String,
      hasAccount: Boolean,
      firstName: String,
      lastName: String,
      eId: String,
      role: String
    }));
    
    // Find by email
    const admin = await Employee.findOne({ email: 'admin@company.com' });
    
    console.log('\n=== ADMIN USER DATA ===');
    if (admin) {
      console.log('Found:', admin.email);
      console.log('hasAccount:', admin.hasAccount);
      console.log('Name:', admin.firstName, admin.lastName);
      console.log('Role:', admin.role);
      console.log('eId:', admin.eId);
      
      if (!admin.hasAccount) {
        console.log('\n❌ PROBLEM: hasAccount is FALSE!');
        console.log('Fixing now...');
        admin.hasAccount = true;
        await admin.save();
        console.log('✅ Fixed! hasAccount is now TRUE');
      }
    } else {
      console.log('❌ No user with email: admin@company.com');
      
      // Show all users
      const allUsers = await Employee.find({});
      console.log('\nAll users in database:');
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (hasAccount: ${u.hasAccount})`);
      });
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAdmin();