import SalaryComponent from "../models/salaryComponentModel.js";

// ========== CREATE SALARY COMPONENT ==========
export const createSalaryComponent = async (req, res) => {
  try {
    const {
      orgId,
      name,
      code,
      category,
      type,
      calculationType,
      value,
      formula,
      isActive,
      isTaxable,
      isStatutory,
      isAttendanceBased,
      displayOrder,
      applicableRoles,
      applicableBranches,
      minThreshold,
      maxThreshold,
      description
    } = req.body;

    // Validation
    if (!orgId || !name || !code || !category || !type) {
      return res.status(400).json({
        message: "Missing required fields: orgId, name, code, category, and type are required"
      });
    }

    // Check if code already exists
    const existingComponent = await SalaryComponent.findOne({ code });
    if (existingComponent) {
      return res.status(409).json({
        message: `Component with code '${code}' already exists`
      });
    }

    // Validate formula if type is FORMULA
    if (type === 'FORMULA' && !formula) {
      return res.status(400).json({
        message: "Formula is required for FORMULA type components"
      });
    }

    // Create component
    const component = new SalaryComponent({
      orgId,
      name,
      code: code.toUpperCase(),
      category,
      type,
      calculationType: calculationType || 'FLAT',
      value,
      formula,
      isActive: isActive !== undefined ? isActive : true,
      isTaxable: isTaxable !== undefined ? isTaxable : true,
      isStatutory: isStatutory || false,
      isAttendanceBased: isAttendanceBased !== undefined ? isAttendanceBased : true,
      displayOrder: displayOrder || 0,
      applicableRoles,
      applicableBranches,
      minThreshold,
      maxThreshold,
      description,
      createdBy: req.user?.id
    });

    await component.save();

    res.status(201).json({
      message: "Salary component created successfully",
      component
    });

  } catch (error) {
    console.error("Error creating salary component:", error);
    res.status(500).json({
      message: "Failed to create salary component",
      error: error.message
    });
  }
};

// ========== GET ALL SALARY COMPONENTS ==========
export const getSalaryComponents = async (req, res) => {
  try {
    const { orgId, category, isActive } = req.query;

    const query = {};
    if (orgId) query.orgId = orgId;
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const components = await SalaryComponent.find(query).sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      count: components.length,
      components
    });

  } catch (error) {
    console.error("Error fetching salary components:", error);
    res.status(500).json({
      message: "Failed to fetch salary components",
      error: error.message
    });
  }
};

// ========== GET SINGLE SALARY COMPONENT ==========
export const getSalaryComponent = async (req, res) => {
  try {
    const { id } = req.params;

    const component = await SalaryComponent.findById(id);

    if (!component) {
      return res.status(404).json({
        message: "Salary component not found"
      });
    }

    res.status(200).json({ component });

  } catch (error) {
    console.error("Error fetching salary component:", error);
    res.status(500).json({
      message: "Failed to fetch salary component",
      error: error.message
    });
  }
};

// ========== UPDATE SALARY COMPONENT ==========
export const updateSalaryComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const component = await SalaryComponent.findById(id);

    if (!component) {
      return res.status(404).json({
        message: "Salary component not found"
      });
    }

    // If changing code, check for duplicates
    if (updateData.code && updateData.code !== component.code) {
      const existingComponent = await SalaryComponent.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });

      if (existingComponent) {
        return res.status(409).json({
          message: `Component with code '${updateData.code}' already exists`
        });
      }

      updateData.code = updateData.code.toUpperCase();
    }

    // Validate formula if type is FORMULA
    if (updateData.type === 'FORMULA' && !updateData.formula && !component.formula) {
      return res.status(400).json({
        message: "Formula is required for FORMULA type components"
      });
    }

    updateData.updatedBy = req.user?.id;

    const updatedComponent = await SalaryComponent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Salary component updated successfully",
      component: updatedComponent
    });

  } catch (error) {
    console.error("Error updating salary component:", error);
    res.status(500).json({
      message: "Failed to update salary component",
      error: error.message
    });
  }
};

// ========== DELETE SALARY COMPONENT ==========
export const deleteSalaryComponent = async (req, res) => {
  try {
    const { id } = req.params;

    const component = await SalaryComponent.findById(id);

    if (!component) {
      return res.status(404).json({
        message: "Salary component not found"
      });
    }

    // Check if component is used in any employee salary structures
    // TODO: Add validation to prevent deletion if in use

    await SalaryComponent.findByIdAndDelete(id);

    res.status(200).json({
      message: "Salary component deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting salary component:", error);
    res.status(500).json({
      message: "Failed to delete salary component",
      error: error.message
    });
  }
};

// ========== TOGGLE COMPONENT STATUS ==========
export const toggleComponentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const component = await SalaryComponent.findById(id);

    if (!component) {
      return res.status(404).json({
        message: "Salary component not found"
      });
    }

    component.isActive = !component.isActive;
    component.updatedBy = req.user?.id;
    await component.save();

    res.status(200).json({
      message: `Component ${component.isActive ? 'activated' : 'deactivated'} successfully`,
      component
    });

  } catch (error) {
    console.error("Error toggling component status:", error);
    res.status(500).json({
      message: "Failed to toggle component status",
      error: error.message
    });
  }
};

// ========== BULK CREATE COMPONENTS ==========
export const bulkCreateComponents = async (req, res) => {
  try {
    const { components } = req.body;

    if (!Array.isArray(components) || components.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of components"
      });
    }

    // Add createdBy to all components
    const componentsWithMetadata = components.map(comp => ({
      ...comp,
      code: comp.code.toUpperCase(),
      createdBy: req.user?.id
    }));

    const createdComponents = await SalaryComponent.insertMany(componentsWithMetadata, {
      ordered: false // Continue on error
    });

    res.status(201).json({
      message: "Components created successfully",
      count: createdComponents.length,
      components: createdComponents
    });

  } catch (error) {
    if (error.name === 'MongoBulkWriteError') {
      // Some components were created, some failed
      return res.status(207).json({
        message: "Partial success - some components could not be created",
        created: error.result.nInserted,
        failed: error.writeErrors?.length || 0,
        errors: error.writeErrors
      });
    }

    console.error("Error bulk creating components:", error);
    res.status(500).json({
      message: "Failed to create components",
      error: error.message
    });
  }
};

// ========== GET EARNING COMPONENTS ==========
export const getEarningComponents = async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({
        message: "orgId is required"
      });
    }

    const components = await SalaryComponent.getEarningComponents(orgId);

    res.status(200).json({
      count: components.length,
      components
    });

  } catch (error) {
    console.error("Error fetching earning components:", error);
    res.status(500).json({
      message: "Failed to fetch earning components",
      error: error.message
    });
  }
};

// ========== GET DEDUCTION COMPONENTS ==========
export const getDeductionComponents = async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({
        message: "orgId is required"
      });
    }

    const components = await SalaryComponent.getDeductionComponents(orgId);

    res.status(200).json({
      count: components.length,
      components
    });

  } catch (error) {
    console.error("Error fetching deduction components:", error);
    res.status(500).json({
      message: "Failed to fetch deduction components",
      error: error.message
    });
  }
};
