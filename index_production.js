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

// Import middleware
import { authenticate } from "./middleware/authMiddleware.js";

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

// 🔒 PRODUCTION MODE - AUTH ENABLED 🔒
console.log('\n' + '='.repeat(60));
console.log('🔒 PRODUCTION MODE: Authentication is ENABLED');
console.log('🔒 Protected routes require valid JWT token');
console.log('='.repeat(60) + '\n');

// PUBLIC ROUTES (no authentication needed)
app.use("/api/auth", authRoutes);

// PROTECTED ROUTES (authentication required)
app.use("/api/employees", authenticate, employeeRoutes);
app.use("/api/salaries", authenticate, salaryRoutes);
app.use("/api/salary-config", authenticate, salaryConfigRoutes);
app.use("/api/attendance", authenticate, attendanceRoutes);
app.use("/api/config", authenticate, configRoutes);
app.use("/api/leaves", authenticate, leaveRoutes);
app.use("/api/branches", authenticate, branchRoutes);

// Health check (public)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    mode: "PRODUCTION (Auth Enabled)",
    auth: "JWT Required for protected routes"
  });
});

// Root endpoint (public)
app.get("/", (req, res) => {
  res.json({
    message: "HR Management System API",
    mode: "PRODUCTION MODE - Auth Enabled",
    auth: {
      login: "POST /api/auth/login",
      register: "POST /api/auth/register"
    },
    protected_endpoints: {
      employees: "/api/employees (requires JWT)",
      branches: "/api/branches (requires JWT)",
      salaries: "/api/salaries (requires JWT)",
      attendance: "/api/attendance (requires JWT)",
      config: "/api/config (requires JWT)",
      leaves: "/api/leaves (requires JWT)"
    },
    instructions: "Login first to receive JWT token, then include in Authorization header"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    requested: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
  console.log(`✓ Health: http://localhost:${PORT}/api/health`);
  console.log(`✓ Docs: http://localhost:${PORT}/`);
  console.log(`\n🔒 Auth ENABLED - Production Mode`);
  console.log(`   Login at: POST /api/auth/login\n`);
});
