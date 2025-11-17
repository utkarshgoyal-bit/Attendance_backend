import Salary from "../models/salaryModel.js";

// ========== GET PENDING SALARIES ==========
export const getPendingSalaries = async (req, res) => {
  try {
    const { month, year } = req.query;

    const query = { status: 'DRAFT' };
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    const salaries = await Salary.find(query)
      .populate('employeeId', 'firstName lastName email eId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: salaries.length,
      salaries
    });

  } catch (error) {
    console.error("Error fetching pending salaries:", error);
    res.status(500).json({
      message: "Failed to fetch pending salaries",
      error: error.message
    });
  }
};

// ========== APPROVE SINGLE SALARY ==========
export const approveSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const salary = await Salary.findById(id);

    if (!salary) {
      return res.status(404).json({
        message: "Salary not found"
      });
    }

    if (salary.status !== 'DRAFT') {
      return res.status(400).json({
        message: `Cannot approve salary with status: ${salary.status}`
      });
    }

    salary.status = 'APPROVED';
    salary.approvedBy = req.user?.id;
    salary.approvedAt = new Date();
    salary.approvalComments = comments || '';

    await salary.save();

    res.status(200).json({
      message: "Salary approved successfully",
      salary
    });

  } catch (error) {
    console.error("Error approving salary:", error);
    res.status(500).json({
      message: "Failed to approve salary",
      error: error.message
    });
  }
};

// ========== BULK APPROVE SALARIES ==========
export const bulkApproveSalaries = async (req, res) => {
  try {
    const { salaryIds, comments } = req.body;

    if (!salaryIds || salaryIds.length === 0) {
      return res.status(400).json({
        message: "salaryIds array is required"
      });
    }

    const result = await Salary.updateMany(
      {
        _id: { $in: salaryIds },
        status: 'DRAFT'
      },
      {
        $set: {
          status: 'APPROVED',
          approvedBy: req.user?.id,
          approvedAt: new Date(),
          approvalComments: comments || ''
        }
      }
    );

    res.status(200).json({
      message: "Salaries approved successfully",
      approvedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Error in bulk approval:", error);
    res.status(500).json({
      message: "Failed to approve salaries",
      error: error.message
    });
  }
};

// ========== REJECT SALARY ==========
export const rejectSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const salary = await Salary.findById(id);

    if (!salary) {
      return res.status(404).json({
        message: "Salary not found"
      });
    }

    // Delete the salary record (or you could add a REJECTED status)
    await Salary.findByIdAndDelete(id);

    res.status(200).json({
      message: "Salary rejected and deleted",
      comments
    });

  } catch (error) {
    console.error("Error rejecting salary:", error);
    res.status(500).json({
      message: "Failed to reject salary",
      error: error.message
    });
  }
};

// ========== GET APPROVED SALARIES ==========
export const getApprovedSalaries = async (req, res) => {
  try {
    const { month, year } = req.query;

    const query = { status: 'APPROVED' };
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    const salaries = await Salary.find(query)
      .populate('employeeId', 'firstName lastName email eId')
      .populate('approvedBy', 'firstName lastName')
      .sort({ approvedAt: -1 });

    res.status(200).json({
      count: salaries.length,
      salaries
    });

  } catch (error) {
    console.error("Error fetching approved salaries:", error);
    res.status(500).json({
      message: "Failed to fetch approved salaries",
      error: error.message
    });
  }
};