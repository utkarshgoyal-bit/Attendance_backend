import Organization from "../models/organizationModel.js";
import OrganizationConfig from "../models/organizationConfigModel.js";
import Employee from "../models/employeeModel.js";

// ========== CREATE ORGANIZATION ==========
export const createOrganization = async (req, res) => {
  try {
    const { name, email, phone, address, adminId, logo } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !adminId) {
      return res.status(400).json({ 
        message: "Name, email, phone, and admin are required" 
      });
    }

    // Check if email already exists
    const existing = await Organization.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        message: "Organization with this email already exists" 
      });
    }

    // Verify admin exists and update their orgId
    const admin = await Employee.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    // Create organization
    const organization = await Organization.create({
      name,
      email,
      phone,
      address,
      logo,
      adminId,
      createdBy: req.user?.id
    });

    // Update admin's orgId
    admin.orgId = organization._id;
    await admin.save();

    // Auto-create default organization config
    await OrganizationConfig.getOrCreateConfig(organization._id);

    await organization.populate('adminId', 'firstName lastName email eId');

    res.status(201).json({
      message: "Organization created successfully",
      organization
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== GET ALL ORGANIZATIONS ==========
export const getAllOrganizations = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const organizations = await Organization.find(filter)
      .populate('adminId', 'firstName lastName email eId role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      organizations,
      count: organizations.length
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== GET SINGLE ORGANIZATION ==========
export const getOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id)
      .populate('adminId', 'firstName lastName email eId role phone');

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Get employee count
    const employeeCount = await Employee.countDocuments({ 
      orgId: organization._id 
    });

    res.status(200).json({
      organization,
      stats: {
        totalEmployees: employeeCount
      }
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== UPDATE ORGANIZATION ==========
export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, logo, adminId } = req.body;

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // If email is being changed, check uniqueness
    if (email && email !== organization.email) {
      const existing = await Organization.findOne({ email });
      if (existing) {
        return res.status(400).json({ 
          message: "Email already in use by another organization" 
        });
      }
    }

    // If admin is being changed
    if (adminId && adminId !== organization.adminId.toString()) {
      const newAdmin = await Employee.findById(adminId);
      if (!newAdmin) {
        return res.status(404).json({ message: "New admin not found" });
      }
      
      // Update new admin's orgId
      newAdmin.orgId = organization._id;
      await newAdmin.save();
    }

    // Update organization
    if (name) organization.name = name;
    if (email) organization.email = email;
    if (phone) organization.phone = phone;
    if (address) organization.address = address;
    if (logo) organization.logo = logo;
    if (adminId) organization.adminId = adminId;

    await organization.save();
    await organization.populate('adminId', 'firstName lastName email eId');

    res.status(200).json({
      message: "Organization updated successfully",
      organization
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== TOGGLE ORGANIZATION STATUS ==========
export const toggleOrganizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const organization = await Organization.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).populate('adminId', 'firstName lastName email');

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.status(200).json({
      message: `Organization ${isActive ? 'activated' : 'deactivated'} successfully`,
      organization
    });
  } catch (error) {
    console.error('Toggle organization status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== DELETE ORGANIZATION ==========
export const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Check if org has employees
    const employeeCount = await Employee.countDocuments({ orgId: id });
    if (employeeCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete organization with ${employeeCount} employees. Please transfer or remove employees first.` 
      });
    }

    // Delete organization config
    await OrganizationConfig.deleteMany({ orgId: id });

    // Delete organization
    await organization.deleteOne();

    res.status(200).json({
      message: "Organization deleted successfully"
    });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== GET MY ORGANIZATION (For Org Admin) ==========
export const getMyOrganization = async (req, res) => {
  try {
    const userId = req.user?.id;

    const organization = await Organization.findOne({ adminId: userId })
      .populate('adminId', 'firstName lastName email eId role');

    if (!organization) {
      return res.status(404).json({ 
        message: "You are not assigned as admin to any organization" 
      });
    }

    // Get employee count
    const employeeCount = await Employee.countDocuments({ 
      orgId: organization._id 
    });

    res.status(200).json({
      organization,
      stats: {
        totalEmployees: employeeCount
      }
    });
  } catch (error) {
    console.error('Get my organization error:', error);
    res.status(500).json({ message: error.message });
  }
};
