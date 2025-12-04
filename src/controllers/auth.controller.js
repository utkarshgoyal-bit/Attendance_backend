import bcrypt from "bcryptjs";
import Employee from "../models/Employee.model.js";
import { generateToken } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// Register/Create Account
export const register = asyncHandler(async (req, res) => {
  const { email, password, employeeId } = req.body;
  
  const employee = await Employee.findOne({ 
    $or: [{ email }, { _id: employeeId }] 
  });
  
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }
  
  if (employee.hasAccount) {
    return res.status(400).json({ message: "Account already exists" });
  }
  
  employee.password = await bcrypt.hash(password, 10);
  employee.hasAccount = true;
  await employee.save();
  
  const token = generateToken(employee._id, employee.role);
  
  res.cookie("token", token, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000 
  });
  
  res.status(201).json({
    message: "Account created successfully",
    user: { id: employee._id, email: employee.email, role: employee.role, name: employee.fullName }
  });
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const employee = await Employee.findOne({ email, hasAccount: true }).select("+password");
  
  if (!employee || !(await bcrypt.compare(password, employee.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  
  const token = generateToken(employee._id, employee.role);
  
  res.cookie("token", token, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000 
  });
  
  res.json({
    message: "Login successful",
    user: { id: employee._id, employeeId: employee._id, email: employee.email, role: employee.role, name: employee.fullName },
    token
  });
});

// Logout
export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.json({ message: "Logged out successfully" });
});

// Get current user
export const getMe = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.user.id);
  if (!employee) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ user: employee });
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const employee = await Employee.findById(req.user.id).select("+password");
  
  if (!(await bcrypt.compare(currentPassword, employee.password))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }
  
  employee.password = await bcrypt.hash(newPassword, 10);
  await employee.save();
  
  res.json({ message: "Password changed successfully" });
});
