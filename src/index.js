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
import salaryComponentRoutes from "./routes/salaryComponentRoutes.js";
import employeeSalaryStructureRoutes from "./routes/employeeSalaryStructureRoutes.js"; // 👈 ADD THIS
import statutoryTemplateRoutes from "./routes/statutoryTemplateRoutes.js";

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
app.use("/api/v2/salary-components", authenticate, salaryComponentRoutes);  // ✅ With authenticate
app.use("/api/employee-salary-structure", authenticate, employeeSalaryStructureRoutes); // 👈 ADD THIS
app.use("/api/statutory-templates", authenticate, statutoryTemplateRoutes);
// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
  console.log(`✓ Health: http://localhost:${PORT}/api/health\n`);
});
