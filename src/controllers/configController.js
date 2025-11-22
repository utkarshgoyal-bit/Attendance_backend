import OrganizationConfig from "../models/organizationConfigModel.js";

// ========== GET ORGANIZATION CONFIG ==========
export const getConfig = async (req, res) => {
  try {
    const { orgId } = req.params;
    if (!orgId) return res.status(400).json({ message: "Organization ID is required" });

    const config = await OrganizationConfig.getOrCreateConfig(orgId);
    res.status(200).json({ message: "Configuration retrieved successfully", config });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ message: "Failed to get configuration", error: error.message });
  }
};

// ========== UPDATE ENTIRE SECTION ==========
export const updateSection = async (req, res) => {
  try {
    const { orgId, section } = req.params;
    const { enabled, fields } = req.body;

    const validSections = ['attendanceSettings', 'deductionSettings', 'leaveSettings', 'workingDaysSettings', 'qrSettings', 'companyProfile'];
    if (!validSections.includes(section)) return res.status(400).json({ message: "Invalid section name" });

    const updateData = {};
    if (enabled !== undefined) updateData[`${section}.enabled`] = enabled;
    if (fields) updateData[`${section}.fields`] = fields;

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { $set: updateData, lastUpdatedBy: req.user?.id },
      { new: true, runValidators: true }
    );

    if (!config) return res.status(404).json({ message: "Configuration not found" });
    res.status(200).json({ message: `${section} updated successfully`, section: config[section] });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ message: "Failed to update section", error: error.message });
  }
};

// ========== TOGGLE SECTION ENABLED ==========
export const toggleSection = async (req, res) => {
  try {
    const { orgId, section } = req.params;
    const { enabled } = req.body;

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { $set: { [`${section}.enabled`]: enabled } },
      { new: true }
    );

    if (!config) return res.status(404).json({ message: "Configuration not found" });
    res.status(200).json({ message: `${section} ${enabled ? 'enabled' : 'disabled'} successfully`, enabled: config[section].enabled });
  } catch (error) {
    console.error('Error toggling section:', error);
    res.status(500).json({ message: "Failed to toggle section", error: error.message });
  }
};

// ========== ADD CUSTOM FIELD ==========
export const addField = async (req, res) => {
  try {
    const { orgId, section } = req.params;
    const fieldData = req.body;

    if (!fieldData.key || !fieldData.label || !fieldData.type) {
      return res.status(400).json({ message: "Field must have key, label, and type" });
    }

    const config = await OrganizationConfig.findOne({ orgId });
    if (!config) return res.status(404).json({ message: "Configuration not found" });

    const existingField = config[section]?.fields?.find(f => f.key === fieldData.key);
    if (existingField) return res.status(400).json({ message: "Field with this key already exists" });

    const newField = {
      ...fieldData,
      deletable: true,
      editable: true,
      order: (config[section]?.fields?.length || 0) + 1
    };

    const updatedConfig = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { $push: { [`${section}.fields`]: newField }, lastUpdatedBy: req.user?.id },
      { new: true }
    );

    res.status(201).json({ message: "Field added successfully", field: newField, fields: updatedConfig[section].fields });
  } catch (error) {
    console.error('Error adding field:', error);
    res.status(500).json({ message: "Failed to add field", error: error.message });
  }
};

// ========== UPDATE FIELD ==========
export const updateField = async (req, res) => {
  try {
    const { orgId, section, fieldId } = req.params;
    const updates = req.body;

    const config = await OrganizationConfig.findOne({ orgId });
    if (!config) return res.status(404).json({ message: "Configuration not found" });

    const fieldIndex = config[section]?.fields?.findIndex(f => f._id.toString() === fieldId);
    if (fieldIndex === -1) return res.status(404).json({ message: "Field not found" });

    const field = config[section].fields[fieldIndex];

    if (!field.editable && updates.value !== undefined) {
      return res.status(403).json({ message: "This field cannot be edited" });
    }

    if (!field.deletable) {
      delete updates.key;
      delete updates.deletable;
      delete updates.type;
    }

    Object.keys(updates).forEach(key => {
      config[section].fields[fieldIndex][key] = updates[key];
    });

    config.lastUpdatedBy = req.user?.id;
    await config.save();

    res.status(200).json({ message: "Field updated successfully", field: config[section].fields[fieldIndex] });
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({ message: "Failed to update field", error: error.message });
  }
};

// ========== DELETE FIELD ==========
export const deleteField = async (req, res) => {
  try {
    const { orgId, section, fieldId } = req.params;

    const config = await OrganizationConfig.findOne({ orgId });
    if (!config) return res.status(404).json({ message: "Configuration not found" });

    const field = config[section]?.fields?.find(f => f._id.toString() === fieldId);
    if (!field) return res.status(404).json({ message: "Field not found" });

    if (!field.deletable) {
      return res.status(403).json({ message: "This is a core field and cannot be deleted" });
    }

    const updatedConfig = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { $pull: { [`${section}.fields`]: { _id: fieldId } }, lastUpdatedBy: req.user?.id },
      { new: true }
    );

    res.status(200).json({ message: "Field deleted successfully", fields: updatedConfig[section].fields });
  } catch (error) {
    console.error('Error deleting field:', error);
    res.status(500).json({ message: "Failed to delete field", error: error.message });
  }
};

// ========== REORDER FIELDS ==========
export const reorderFields = async (req, res) => {
  try {
    const { orgId, section } = req.params;
    const { fieldOrders } = req.body;

    const config = await OrganizationConfig.findOne({ orgId });
    if (!config) return res.status(404).json({ message: "Configuration not found" });

    fieldOrders.forEach(({ fieldId, order }) => {
      const field = config[section].fields.find(f => f._id.toString() === fieldId);
      if (field) field.order = order;
    });

    config[section].fields.sort((a, b) => a.order - b.order);
    await config.save();

    res.status(200).json({ message: "Fields reordered successfully", fields: config[section].fields });
  } catch (error) {
    console.error('Error reordering fields:', error);
    res.status(500).json({ message: "Failed to reorder fields", error: error.message });
  }
};

// ========== BULK UPDATE FIELD VALUES ==========
export const bulkUpdateFieldValues = async (req, res) => {
  try {
    const { orgId, section } = req.params;
    const { updates } = req.body;

    const config = await OrganizationConfig.findOne({ orgId });
    if (!config) return res.status(404).json({ message: "Configuration not found" });

    updates.forEach(({ fieldId, value }) => {
      const field = config[section].fields.find(f => f._id.toString() === fieldId || f.key === fieldId);
      if (field && field.editable) field.value = value;
    });

    config.lastUpdatedBy = req.user?.id;
    await config.save();

    res.status(200).json({ message: "Fields updated successfully", section: config[section] });
  } catch (error) {
    console.error('Error bulk updating fields:', error);
    res.status(500).json({ message: "Failed to update fields", error: error.message });
  }
};

// ========== RESET SECTION TO DEFAULTS ==========
export const resetSection = async (req, res) => {
  try {
    const { orgId, section } = req.params;

    const defaultsMap = {
      attendanceSettings: OrganizationConfig.getDefaultAttendanceFields(),
      deductionSettings: OrganizationConfig.getDefaultDeductionFields(),
      leaveSettings: OrganizationConfig.getDefaultLeaveFields(),
      workingDaysSettings: OrganizationConfig.getDefaultWorkingDaysFields(),
      qrSettings: OrganizationConfig.getDefaultQRFields(),
      companyProfile: OrganizationConfig.getDefaultCompanyFields()
    };

    if (!defaultsMap[section]) return res.status(400).json({ message: "Invalid section" });

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { $set: { [`${section}.fields`]: defaultsMap[section], [`${section}.enabled`]: true }, lastUpdatedBy: req.user?.id },
      { new: true }
    );

    res.status(200).json({ message: `${section} reset to defaults successfully`, section: config[section] });
  } catch (error) {
    console.error('Error resetting section:', error);
    res.status(500).json({ message: "Failed to reset section", error: error.message });
  }
};

// ========== RESET ALL TO DEFAULTS ==========
export const resetAllToDefaults = async (req, res) => {
  try {
    const { orgId } = req.params;
    await OrganizationConfig.findOneAndDelete({ orgId });
    const config = await OrganizationConfig.getOrCreateConfig(orgId);
    res.status(200).json({ message: "All settings reset to defaults successfully", config });
  } catch (error) {
    console.error('Error resetting all:', error);
    res.status(500).json({ message: "Failed to reset settings", error: error.message });
  }
};

// ========== UPLOAD COMPANY LOGO ==========
export const uploadLogo = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { logo } = req.body;

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { $set: { 'companyProfile.logo': logo } },
      { new: true }
    );

    if (!config) return res.status(404).json({ message: "Configuration not found" });
    res.status(200).json({ message: "Logo uploaded successfully", logo: config.companyProfile.logo });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: "Failed to upload logo", error: error.message });
  }
};

// ========== TOGGLE BRANCH-SPECIFIC CONFIG ==========
export const toggleBranchSpecific = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { enabled } = req.body;

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { $set: { 'branchSpecificConfig.enabled': enabled } },
      { new: true }
    );

    res.status(200).json({ message: `Branch-specific settings ${enabled ? 'enabled' : 'disabled'}`, branchSpecificConfig: config.branchSpecificConfig });
  } catch (error) {
    console.error('Error toggling branch config:', error);
    res.status(500).json({ message: "Failed to toggle branch config", error: error.message });
  }
};

// ========== UTILITY: CHECK ATTENDANCE STATUS ==========
export const checkAttendanceStatus = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { checkInTime } = req.body;

    const config = await OrganizationConfig.findOne({ orgId });
    if (!config) return res.status(404).json({ message: "Configuration not found" });

    const status = config.getAttendanceStatus(checkInTime || new Date());
    res.status(200).json({ message: "Status calculated", checkInTime: checkInTime || new Date(), status });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ message: "Failed to check status", error: error.message });
  }
};

// ========== UTILITY: CALCULATE DEDUCTIONS ==========
export const calculateDeductions = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { lateCount, halfDayCount } = req.body;

    const config = await OrganizationConfig.findOne({ orgId });
    if (!config) return res.status(404).json({ message: "Configuration not found" });

    const deductions = config.calculateDeductions(lateCount || 0, halfDayCount || 0);
    res.status(200).json({ message: "Deductions calculated", lateCount, halfDayCount, totalDeductions: deductions });
  } catch (error) {
    console.error('Error calculating deductions:', error);
    res.status(500).json({ message: "Failed to calculate deductions", error: error.message });
  }
};