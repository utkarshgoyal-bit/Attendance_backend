import OrganizationConfig from "../models/organizationConfigModel.js";

// ========== GET ORGANIZATION CONFIG ==========
// Route: GET /api/config/:orgId
export const getConfig = async (req, res) => {
  try {
    const { orgId } = req.params;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    // Get or create config
    let config = await OrganizationConfig.getOrCreateConfig(orgId);

    res.status(200).json({
      message: "Configuration retrieved successfully",
      config
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({
      message: "Failed to get configuration",
      error: error.message
    });
  }
};

// ========== UPDATE ORGANIZATION CONFIG ==========
// Route: PUT /api/config/:orgId
export const updateConfig = async (req, res) => {
  try {
    const { orgId } = req.params;
    const updates = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    // Get updatedBy from request (in production, get from auth middleware)
    const updatedBy = req.body.updatedBy || req.user?.id;

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { ...updates, lastUpdatedBy: updatedBy },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "Configuration updated successfully",
      config
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({
      message: "Failed to update configuration",
      error: error.message
    });
  }
};

// ========== UPDATE ATTENDANCE TIMING ==========
// Route: PUT /api/config/:orgId/attendance-timing
export const updateAttendanceTiming = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { fullDayBefore, lateBefore, halfDayBefore } = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    const updates = { attendanceTiming: {} };
    if (fullDayBefore) updates.attendanceTiming.fullDayBefore = fullDayBefore;
    if (lateBefore) updates.attendanceTiming.lateBefore = lateBefore;
    if (halfDayBefore) updates.attendanceTiming.halfDayBefore = halfDayBefore;

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      updates,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        message: "Configuration not found"
      });
    }

    res.status(200).json({
      message: "Attendance timing updated successfully",
      attendanceTiming: config.attendanceTiming
    });
  } catch (error) {
    console.error('Error updating attendance timing:', error);
    res.status(500).json({
      message: "Failed to update attendance timing",
      error: error.message
    });
  }
};

// ========== UPDATE DEDUCTION RULES ==========
// Route: PUT /api/config/:orgId/deductions
export const updateDeductions = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { lateRule, halfDayRule } = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    const updates = { deductions: {} };
    if (lateRule) updates.deductions.lateRule = lateRule;
    if (halfDayRule) updates.deductions.halfDayRule = halfDayRule;

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      updates,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        message: "Configuration not found"
      });
    }

    res.status(200).json({
      message: "Deduction rules updated successfully",
      deductions: config.deductions
    });
  } catch (error) {
    console.error('Error updating deductions:', error);
    res.status(500).json({
      message: "Failed to update deduction rules",
      error: error.message
    });
  }
};

// ========== UPDATE LEAVE POLICY ==========
// Route: PUT /api/config/:orgId/leave-policy
export const updateLeavePolicy = async (req, res) => {
  try {
    const { orgId } = req.params;
    const leavePolicyUpdates = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { leavePolicy: leavePolicyUpdates },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        message: "Configuration not found"
      });
    }

    res.status(200).json({
      message: "Leave policy updated successfully",
      leavePolicy: config.leavePolicy
    });
  } catch (error) {
    console.error('Error updating leave policy:', error);
    res.status(500).json({
      message: "Failed to update leave policy",
      error: error.message
    });
  }
};

// ========== UPDATE WORKING DAYS ==========
// Route: PUT /api/config/:orgId/working-days
export const updateWorkingDays = async (req, res) => {
  try {
    const { orgId } = req.params;
    const workingDaysUpdates = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { workingDays: workingDaysUpdates },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        message: "Configuration not found"
      });
    }

    res.status(200).json({
      message: "Working days updated successfully",
      workingDays: config.workingDays
    });
  } catch (error) {
    console.error('Error updating working days:', error);
    res.status(500).json({
      message: "Failed to update working days",
      error: error.message
    });
  }
};

// ========== UPDATE QR CODE SETTINGS ==========
// Route: PUT /api/config/:orgId/qr-settings
export const updateQRSettings = async (req, res) => {
  try {
    const { orgId } = req.params;
    const qrSettingsUpdates = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      { qrCodeSettings: qrSettingsUpdates },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        message: "Configuration not found"
      });
    }

    res.status(200).json({
      message: "QR code settings updated successfully",
      qrCodeSettings: config.qrCodeSettings
    });
  } catch (error) {
    console.error('Error updating QR settings:', error);
    res.status(500).json({
      message: "Failed to update QR code settings",
      error: error.message
    });
  }
};

// ========== UPDATE GRACE PERIOD ==========
// Route: PUT /api/config/:orgId/grace-period
export const updateGracePeriod = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { enabled, minutes, description } = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    const updates = { gracePeriod: {} };
    if (enabled !== undefined) updates.gracePeriod.enabled = enabled;
    if (minutes !== undefined) updates.gracePeriod.minutes = minutes;
    if (description) updates.gracePeriod.description = description;

    const config = await OrganizationConfig.findOneAndUpdate(
      { orgId },
      updates,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        message: "Configuration not found"
      });
    }

    res.status(200).json({
      message: "Grace period updated successfully",
      gracePeriod: config.gracePeriod
    });
  } catch (error) {
    console.error('Error updating grace period:', error);
    res.status(500).json({
      message: "Failed to update grace period",
      error: error.message
    });
  }
};

// ========== RESET TO DEFAULTS ==========
// Route: POST /api/config/:orgId/reset
export const resetToDefaults = async (req, res) => {
  try {
    const { orgId } = req.params;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    // Delete existing config
    await OrganizationConfig.findOneAndDelete({ orgId });

    // Create new default config
    const config = await OrganizationConfig.create({ orgId });

    res.status(200).json({
      message: "Configuration reset to defaults successfully",
      config
    });
  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({
      message: "Failed to reset configuration",
      error: error.message
    });
  }
};

// ========== GET ATTENDANCE STATUS FOR TIME ==========
// Route: POST /api/config/:orgId/check-status
export const checkAttendanceStatus = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { checkInTime } = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    if (!checkInTime) {
      return res.status(400).json({
        message: "Check-in time is required"
      });
    }

    const config = await OrganizationConfig.getOrCreateConfig(orgId);
    const status = config.getAttendanceStatus(checkInTime);

    res.status(200).json({
      checkInTime,
      status,
      config: {
        fullDayBefore: config.attendanceTiming.fullDayBefore,
        lateBefore: config.attendanceTiming.lateBefore,
        halfDayBefore: config.attendanceTiming.halfDayBefore,
        gracePeriod: config.gracePeriod
      }
    });
  } catch (error) {
    console.error('Error checking attendance status:', error);
    res.status(500).json({
      message: "Failed to check attendance status",
      error: error.message
    });
  }
};

// ========== CALCULATE DEDUCTIONS ==========
// Route: POST /api/config/:orgId/calculate-deductions
export const calculateDeductions = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { lateCount, halfDayCount } = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization ID is required"
      });
    }

    if (lateCount === undefined || halfDayCount === undefined) {
      return res.status(400).json({
        message: "Late count and half-day count are required"
      });
    }

    const config = await OrganizationConfig.getOrCreateConfig(orgId);
    const deductions = config.calculateDeductions(lateCount, halfDayCount);

    res.status(200).json({
      lateCount,
      halfDayCount,
      totalDeductions: deductions,
      rules: config.deductions
    });
  } catch (error) {
    console.error('Error calculating deductions:', error);
    res.status(500).json({
      message: "Failed to calculate deductions",
      error: error.message
    });
  }
};
