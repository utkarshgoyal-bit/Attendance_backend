import { Organization, Branch } from "../models/Organization.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// ==================== ORGANIZATION ====================

export const createOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.create(req.body);
  res.status(201).json({ message: "Organization created", organization });
});

export const getOrganizations = asyncHandler(async (req, res) => {
  const organizations = await Organization.find().populate("adminId", "firstName lastName email");
  res.json({ organizations });
});

export const getOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id).populate("adminId", "firstName lastName email");
  if (!organization) {
    return res.status(404).json({ message: "Organization not found" });
  }
  res.json({ organization });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!organization) {
    return res.status(404).json({ message: "Organization not found" });
  }
  res.json({ message: "Organization updated", organization });
});

export const deleteOrganization = asyncHandler(async (req, res) => {
  await Organization.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: "Organization deactivated" });
});

// ==================== BRANCH ====================

export const createBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(201).json({ message: "Branch created", branch });
});

export const getBranches = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.orgId) query.orgId = req.query.orgId;
  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === "true";
  
  const branches = await Branch.find(query).populate("orgId", "name");
  res.json({ branches });
});

export const getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id).populate("orgId", "name");
  if (!branch) {
    return res.status(404).json({ message: "Branch not found" });
  }
  res.json({ branch });
});

export const updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!branch) {
    return res.status(404).json({ message: "Branch not found" });
  }
  res.json({ message: "Branch updated", branch });
});

export const deleteBranch = asyncHandler(async (req, res) => {
  await Branch.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: "Branch deactivated" });
});
