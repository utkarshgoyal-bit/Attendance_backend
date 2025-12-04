import Config from "../models/Config.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// Get config
export const getConfig = asyncHandler(async (req, res) => {
  let config = await Config.findOne({ orgId: req.params.orgId });
  
  if (!config) {
    config = await Config.create({ orgId: req.params.orgId });
  }
  
  res.json({ config });
});

// Update entire config
export const updateConfig = asyncHandler(async (req, res) => {
  const config = await Config.findOneAndUpdate(
    { orgId: req.params.orgId },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );
  
  res.json({ message: "Configuration updated", config });
});

// Update specific section
export const updateSection = asyncHandler(async (req, res) => {
  const { orgId, section } = req.params;
  const updateData = { [section]: req.body };
  
  const config = await Config.findOneAndUpdate(
    { orgId },
    updateData,
    { new: true, upsert: true }
  );
  
  res.json({ message: `${section} updated`, config });
});

// Reset to defaults
export const resetConfig = asyncHandler(async (req, res) => {
  await Config.findOneAndDelete({ orgId: req.params.orgId });
  const config = await Config.create({ orgId: req.params.orgId });
  
  res.json({ message: "Configuration reset to defaults", config });
});

// Check attendance status (utility endpoint)
export const checkAttendanceStatus = asyncHandler(async (req, res) => {
  const { checkInTime } = req.body;
  const config = await Config.findOne({ orgId: req.params.orgId });
  
  if (!config) {
    return res.status(404).json({ message: "Configuration not found" });
  }
  
  const status = config.getAttendanceStatus(checkInTime);
  res.json({ status, checkInTime });
});

// Calculate deductions (utility endpoint)
export const calculateDeductions = asyncHandler(async (req, res) => {
  const { lateCount, halfDayCount } = req.body;
  const config = await Config.findOne({ orgId: req.params.orgId });
  
  if (!config) {
    return res.status(404).json({ message: "Configuration not found" });
  }
  
  const deductions = config.calculateDeductions(lateCount, halfDayCount);
  res.json({ deductions, lateCount, halfDayCount });
});
