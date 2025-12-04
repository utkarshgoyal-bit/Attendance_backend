import { Salary, SalaryConfig, SalaryComponent, EmployeeSalaryStructure } from "../models/Salary.model.js";
import Employee from "../models/Employee.model.js";
import Attendance from "../models/Attendance.model.js";
import Config from "../models/Config.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// Calculate salary for employee
export const calculateSalary = asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.body;
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIndex = months.indexOf(month);
  
  if (monthIndex === -1) {
    return res.status(400).json({ message: "Invalid month" });
  }
  
  // Get employee
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }
  
  // Get attendance
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);
  const totalDays = endDate.getDate();
  
  const records = await Attendance.find({
    employeeId,
    date: { $gte: startDate, $lte: endDate },
    status: "APPROVED"
  });
  
  // Calculate attendance metrics
  const fullDays = records.filter(r => r.autoStatus === "FULL_DAY").length;
  const lateDays = records.filter(r => r.autoStatus === "LATE").length;
  const halfDays = records.filter(r => r.autoStatus === "HALF_DAY").length;
  const paidLeaves = records.filter(r => r.autoStatus === "PAID_LEAVE").length;
  
  // Get config for deductions
  const config = await Config.findOne({ orgId: employee.orgId });
  const deductions = config?.calculateDeductions(lateDays, halfDays) || 0;
  
  const attendanceDays = fullDays + lateDays + halfDays + paidLeaves - deductions;
  
  // Get salary config
  const salaryConfig = await SalaryConfig.findOne({ orgId: employee.orgId }) || {};
  
  // Calculate salary
  const base = (employee.salary.base / totalDays) * attendanceDays;
  const hra = (employee.salary.hra / totalDays) * attendanceDays;
  const conveyance = (employee.salary.conveyance / totalDays) * attendanceDays;
  const grossEarnings = base + hra + conveyance;
  
  // Calculate statutory deductions
  const pfBase = Math.min(employee.salary.base, salaryConfig.pfCeiling || 15000);
  const pf = pfBase * (salaryConfig.employeePF || 12) / 100;
  
  let esi = 0;
  if (grossEarnings <= (salaryConfig.esiCeiling || 21000)) {
    esi = grossEarnings * (salaryConfig.employeeESI || 0.75) / 100;
  }
  
  const totalDeductions = Math.round(pf + esi);
  const netPayable = Math.round(grossEarnings - totalDeductions);
  
  const salaryData = {
    employeeId,
    month,
    year,
    attendanceDays,
    totalDays,
    earnings: { base: Math.round(base), hra: Math.round(hra), conveyance: Math.round(conveyance) },
    grossEarnings: Math.round(grossEarnings),
    deductions: { pf: Math.round(pf), esi: Math.round(esi) },
    totalDeductions,
    netPayable,
    ctc: employee.salary.ctc
  };
  
  res.json({ salary: salaryData });
});

// Save calculated salary
export const saveSalary = asyncHandler(async (req, res) => {
  const { employeeId, month, year, ...salaryData } = req.body;
  
  const salary = await Salary.findOneAndUpdate(
    { employeeId, month, year },
    { ...salaryData, employeeId, month, year },
    { upsert: true, new: true }
  );
  
  res.json({ message: "Salary saved", salary });
});

// Get salaries
export const getSalaries = asyncHandler(async (req, res) => {
  const { month, year, status, page = 1, limit = 10 } = req.query;
  
  const query = {};
  if (month) query.month = month;
  if (year) query.year = parseInt(year);
  if (status) query.status = status;
  
  const total = await Salary.countDocuments(query);
  const salaries = await Salary.find(query)
    .populate("employeeId", "firstName lastName eId department")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  res.json({ salaries, total, pages: Math.ceil(total / limit) });
});

// Approve salary
export const approveSalary = asyncHandler(async (req, res) => {
  const salary = await Salary.findByIdAndUpdate(
    req.params.id,
    { status: "APPROVED", approvedBy: req.user.id, approvedAt: new Date() },
    { new: true }
  );
  
  if (!salary) {
    return res.status(404).json({ message: "Salary record not found" });
  }
  
  res.json({ message: "Salary approved", salary });
});

// Bulk process salaries
export const bulkCalculate = asyncHandler(async (req, res) => {
  const { employeeIds, month, year } = req.body;
  const results = [];
  
  for (const employeeId of employeeIds) {
    try {
      // Use the same calculation logic
      const employee = await Employee.findById(employeeId);
      if (!employee) continue;
      
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthIndex = months.indexOf(month);
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);
      const totalDays = endDate.getDate();
      
      const records = await Attendance.find({
        employeeId,
        date: { $gte: startDate, $lte: endDate },
        status: "APPROVED"
      });
      
      const attendanceDays = records.filter(r => 
        ["FULL_DAY", "LATE", "HALF_DAY", "PAID_LEAVE"].includes(r.autoStatus)
      ).length;
      
      const base = (employee.salary.base / totalDays) * attendanceDays;
      const hra = (employee.salary.hra / totalDays) * attendanceDays;
      const conveyance = (employee.salary.conveyance / totalDays) * attendanceDays;
      const grossEarnings = base + hra + conveyance;
      const pf = Math.min(employee.salary.base, 15000) * 0.12;
      const netPayable = grossEarnings - pf;
      
      await Salary.findOneAndUpdate(
        { employeeId, month, year },
        {
          employeeId, month, year, attendanceDays, totalDays,
          earnings: { base: Math.round(base), hra: Math.round(hra), conveyance: Math.round(conveyance) },
          grossEarnings: Math.round(grossEarnings),
          deductions: { pf: Math.round(pf) },
          totalDeductions: Math.round(pf),
          netPayable: Math.round(netPayable),
          ctc: employee.salary.ctc
        },
        { upsert: true, new: true }
      );
      
      results.push({ employeeId, status: "success" });
    } catch (error) {
      results.push({ employeeId, status: "failed", error: error.message });
    }
  }
  
  res.json({ message: "Bulk calculation complete", results });
});

// Get/Update salary config
export const getSalaryConfig = asyncHandler(async (req, res) => {
  const config = await SalaryConfig.findOne({ orgId: req.query.orgId }) || {};
  res.json({ config });
});

export const updateSalaryConfig = asyncHandler(async (req, res) => {
  const config = await SalaryConfig.findOneAndUpdate(
    { orgId: req.body.orgId },
    req.body,
    { upsert: true, new: true }
  );
  res.json({ message: "Config updated", config });
});

// Salary components CRUD
export const getSalaryComponents = asyncHandler(async (req, res) => {
  const components = await SalaryComponent.find({ orgId: req.query.orgId, isActive: true })
    .sort({ displayOrder: 1 });
  res.json({ components });
});

export const createSalaryComponent = asyncHandler(async (req, res) => {
  const component = await SalaryComponent.create(req.body);
  res.status(201).json({ message: "Component created", component });
});

export const updateSalaryComponent = asyncHandler(async (req, res) => {
  const component = await SalaryComponent.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: "Component updated", component });
});
