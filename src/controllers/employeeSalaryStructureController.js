import EmployeeSalaryStructure from "../models/employeeSalaryStructureModel.js";
import SalaryComponent from "../models/salaryComponentModel.js";

// ========== CREATE/UPDATE SALARY STRUCTURE ==========
export const saveSalaryStructure = async (req, res) => {
  try {
    const { employeeId, components, effectiveFrom, orgId } = req.body;

    if (!employeeId || !components || components.length === 0) {
      return res.status(400).json({
        message: "Employee ID and components are required"
      });
    }

    // Calculate CTC
    let ctc = 0;
    for (const comp of components) {
      ctc += comp.value || 0;
    }

    // Check if structure exists
    const existing = await EmployeeSalaryStructure.findOne({
      employeeId,
      isActive: true
    });

    if (existing) {
      // Update existing structure
      existing.components = components;
      existing.ctc = ctc;
      existing.effectiveFrom = effectiveFrom || existing.effectiveFrom;
      existing.updatedBy = req.user?.id;
      
      await existing.save();
      await existing.calculateBreakdown();

      return res.status(200).json({
        message: "Salary structure updated successfully",
        structure: existing
      });
    } else {
      // Create new structure
      const structure = new EmployeeSalaryStructure({
        employeeId,
        orgId: orgId || 'ORG001',
        components,
        ctc,
        effectiveFrom: effectiveFrom || new Date(),
        createdBy: req.user?.id,
        approvalStatus: 'APPROVED', // Auto-approve for now
        isActive: true
      });

      await structure.save();
      await structure.calculateBreakdown();

      res.status(201).json({
        message: "Salary structure created successfully",
        structure
      });
    }
  } catch (error) {
    console.error("Error saving salary structure:", error);
    res.status(500).json({
      message: "Failed to save salary structure",
      error: error.message
    });
  }
};

// ========== GET EMPLOYEE SALARY STRUCTURE ==========
export const getEmployeeSalaryStructure = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const structure = await EmployeeSalaryStructure.findOne({
      employeeId,
      isActive: true
    }).populate('components.componentId');

    if (!structure) {
      return res.status(404).json({
        message: "No active salary structure found for this employee"
      });
    }

    res.status(200).json({
      structure
    });
  } catch (error) {
    console.error("Error fetching salary structure:", error);
    res.status(500).json({
      message: "Failed to fetch salary structure",
      error: error.message
    });
  }
};

// ========== GET STRUCTURE HISTORY ==========
export const getStructureHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const history = await EmployeeSalaryStructure.getHistory(employeeId);

    res.status(200).json({
      count: history.length,
      history
    });
  } catch (error) {
    console.error("Error fetching structure history:", error);
    res.status(500).json({
      message: "Failed to fetch structure history",
      error: error.message
    });
  }
};