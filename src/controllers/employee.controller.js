import Employee from "../models/Employee.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// Get all employees
export const getEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, branch, department, role, status } = req.query;
  
  const query = {};
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { eId: { $regex: search, $options: "i" } }
    ];
  }
  
  if (branch) query.branchId = branch;
  if (department) query.department = department;
  if (role) query.role = role;
  if (status !== undefined) query.isActive = status === "active";
  
  const total = await Employee.countDocuments(query);
  const employees = await Employee.find(query)
    .populate("branchId", "name code")
    .select("-password")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  res.json({
    employees,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// Get employee by ID
export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate("branchId", "name code")
    .select("-password");
  
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }
  
  res.json({ employee });
});

// Create employee
export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.create(req.body);
  res.status(201).json({ message: "Employee created successfully", employee });
});

// Update employee
export const updateEmployee = asyncHandler(async (req, res) => {
  const { password, ...updateData } = req.body;
  
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select("-password");
  
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }
  
  res.json({ message: "Employee updated successfully", employee });
});

// Delete/Deactivate employee
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }
  
  res.json({ message: "Employee deactivated successfully" });
});

// Get employee stats
export const getEmployeeStats = asyncHandler(async (req, res) => {
  const [total, active, byDepartment, byRole] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ isActive: true }),
    Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$department", count: { $sum: 1 } } }
    ]),
    Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ])
  ]);
  
  res.json({
    total,
    active,
    inactive: total - active,
    byDepartment: byDepartment.reduce((acc, { _id, count }) => ({ ...acc, [_id || "Unassigned"]: count }), {}),
    byRole: byRole.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {})
  });
});
