import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Import routes
import employeeRoutes from "./routes/employeeRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import salaryConfigRoutes from "./routes/salaryConfigRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());

// Connect to database
connectDB();

// ⚠️ TESTING MODE - AUTH DISABLED ⚠️
console.log('\n' + '='.repeat(60));
console.log('⚠️  WARNING: Authentication is DISABLED for testing');
console.log('⚠️  All routes are publicly accessible');
console.log('⚠️  DO NOT use this configuration in production!');
console.log('='.repeat(60) + '\n');

// ALL ROUTES - NO AUTH REQUIRED (for testing)
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/salary-config", salaryConfigRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/config", configRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/branches", branchRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    mode: "TESTING (Auth Disabled)",
    warning: "Do not use in production"
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "HR Management System API",
    mode: "TESTING MODE - Auth Disabled",
    endpoints: {
      health: "/api/health",
      employees: "/api/employees",
      branches: "/api/branches",
      salaries: "/api/salaries",
      attendance: "/api/attendance",
      config: "/api/config",
      leaves: "/api/leaves"
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
  console.log(`✓ Health: http://localhost:${PORT}/api/health`);
  console.log(`✓ Docs: http://localhost:${PORT}/`);
  console.log(`\n⚠️  Auth DISABLED - For testing only!`);
  console.log(`   To enable auth, use index_with_auth.js instead\n`);
});