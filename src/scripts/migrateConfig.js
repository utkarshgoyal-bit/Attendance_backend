// src/scripts/migrateConfig.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OrganizationConfig from '../models/organizationConfigModel.js';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const orgId = "673db4bb4ea85b50f50f20d4";
    
    // Delete old
    await OrganizationConfig.deleteOne({ orgId });
    console.log('✅ Deleted old config');
    
    // Create new with defaults
    const config = await OrganizationConfig.getOrCreateConfig(orgId);
    console.log('✅ Created new config');
    console.log('Fields:', {
      attendance: config.attendanceSettings.fields.length,
      deduction: config.deductionSettings.fields.length,
      leave: config.leaveSettings.fields.length
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

migrate();