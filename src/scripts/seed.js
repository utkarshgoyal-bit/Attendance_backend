import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Employee from "../models/Employee.model.js";
import { Organization, Branch } from "../models/Organization.model.js";
import Config from "../models/Config.model.js";
import { SalaryConfig } from "../models/Salary.model.js";

dotenv.config();

const seed = async () => {
  try {
    console.log("🌱 Starting seed process...\n");
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Create Organization
    let org = await Organization.findOne({ email: "admin@company.com" });
    if (!org) {
      org = await Organization.create({
        name: "HR Company",
        email: "admin@company.com",
        phone: "9876543210",
        address: "123 Business Street"
      });
      console.log("✅ Organization created");
    }

    // Create Branches
    const branches = [
      { orgId: org._id, name: "Jaipur Office", code: "JPR", address: { city: "Jaipur", state: "Rajasthan" } },
      { orgId: org._id, name: "Dehradun Office", code: "DDN", address: { city: "Dehradun", state: "Uttarakhand" } }
    ];

    for (const b of branches) {
      await Branch.findOneAndUpdate({ orgId: b.orgId, code: b.code }, b, { upsert: true });
    }
    console.log("✅ Branches created");

    // Create Config
    await Config.findOneAndUpdate(
      { orgId: org._id },
      { orgId: org._id },
      { upsert: true }
    );
    console.log("✅ Config created");

    // Create Salary Config
    await SalaryConfig.findOneAndUpdate(
      { orgId: org._id },
      { 
        orgId: org._id,
        employeePF: 12, employerPF: 12,
        employeeESI: 0.75, employerESI: 3.25,
        pfCeiling: 15000, esiCeiling: 21000
      },
      { upsert: true }
    );
    console.log("✅ Salary Config created");

    // Create Admin User
    const adminExists = await Employee.findOne({ email: "admin@company.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const admin = await Employee.create({
        firstName: "Admin",
        lastName: "User",
        email: "admin@company.com",
        phone: "9876543210",
        eId: "ADMIN001",
        department: "Management",
        designation: "System Administrator",
        joiningDate: new Date(),
        orgId: org._id,
        salary: { base: 50000, hra: 20000, conveyance: 1600 },
        hasAccount: true,
        password: hashedPassword,
        role: "SUPER_ADMIN"
      });

      // Update org with admin
      org.adminId = admin._id;
      await org.save();

      console.log("✅ Admin user created");
      console.log("\n📝 Login Credentials:");
      console.log("   Email: admin@company.com");
      console.log("   Password: admin123");
      console.log("   Role: SUPER_ADMIN\n");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    console.log("🎉 Seed completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seed();
