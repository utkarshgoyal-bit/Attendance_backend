import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import salaryConfigRoutes from "./routes/salaryConfigRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authenticate } from "./middleware/authMiddleware.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

connectDB();

// PUBLIC routes (before authenticate)
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes); // Move here (temporarily)

// Then add authenticate for other routes
app.use("/api/attendance", authenticate, attendanceRoutes);
app.use("/api/leaves", authenticate, leaveRoutes);
app.use("/api/salaries", authenticate, salaryRoutes);
app.use("/api/config", authenticate, configRoutes);
app.use("/api/branches", authenticate, branchRoutes);

// Protected routes (require authentication)
// Note: Temporarily keeping routes unprotected for gradual migration
// Uncomment authenticate middleware when ready
// import { authenticate } from "./middleware/authMiddleware.js";
// app.use("/api/employees", authenticate, employeeRoutes);
// app.use("/api/attendance", authenticate, attendanceRoutes);
// app.use("/api/leaves", authenticate, leaveRoutes);
// app.use("/api/salaries", authenticate, salaryRoutes);
// app.use("/api/config", authenticate, configRoutes);
// app.use("/api/branches", authenticate, branchRoutes);

app.use("/api/employees", employeeRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/salary-config", salaryConfigRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/config", configRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/branches", branchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));