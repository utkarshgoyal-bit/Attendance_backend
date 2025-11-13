import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import salaryConfigRoutes from "./routes/salaryConfigRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/employees", employeeRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/salary-config", salaryConfigRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/config", configRoutes);
app.use("/api/leaves", leaveRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));