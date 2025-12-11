const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Error:', err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  isFirstLogin: Boolean,
});

const User = mongoose.model('User', userSchema);

async function resetPassword(email, newPassword) {
  try {
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.email} (${user.role})`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    user.isFirstLogin = false; // Set to false so they don't have to change password
    await user.save();

    console.log(`✅ Password reset successfully!`);
    console.log(`\nNew Credentials:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`\nYou can now login with these credentials.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2] || 'admin@hrms.com';
const newPassword = process.argv[3] || 'admin123';

console.log(`\n🔄 Resetting password for: ${email}\n`);
resetPassword(email, newPassword);