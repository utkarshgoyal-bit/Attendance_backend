import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Import consolidated routes
import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import configRoutes from "./routes/config.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import organizationRoutes from "./routes/organization.routes.js";

// Middleware
import { authenticate } from "./middleware/auth.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

// Core Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(cookieParser());

// Database
connectDB();

// Health Check
app.get("/api/health", (_, res) => res.json({ status: "OK", timestamp: new Date().toISOString() }));

// Public Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance/qr", attendanceRoutes); // QR routes are public

// Protected Routes
app.use("/api/employees", authenticate, employeeRoutes);
app.use("/api/attendance", authenticate, attendanceRoutes);
app.use("/api/leaves", authenticate, leaveRoutes);
app.use("/api/salaries", authenticate, salaryRoutes);
app.use("/api/config", authenticate, configRoutes);
app.use("/api/branches", authenticate, branchRoutes);
app.use("/api/organizations", authenticate, organizationRoutes);

// Error Handler
app.use(errorHandler);

// 404 Handler
app.use((_, res) => res.status(404).json({ message: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 HR Backend v2.0 running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);
});
