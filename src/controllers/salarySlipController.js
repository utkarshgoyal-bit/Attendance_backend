import salarySlipGenerator from '../services/salarySlipGenerator.js';
import Salary from '../models/salaryModel.js';

// ========== GENERATE SALARY SLIP PDF ==========
export const generateSalarySlip = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch salary to get employee name for filename
    const salary = await Salary.findById(id).populate('employeeId', 'firstName lastName eId');

    if (!salary) {
      return res.status(404).json({
        message: 'Salary record not found'
      });
    }

    // Check if salary is approved
    if (salary.status !== 'APPROVED') {
      return res.status(400).json({
        message: 'Salary slip can only be generated for approved salaries'
      });
    }

    // Generate PDF
    const doc = await salarySlipGenerator.generateSlip(id);

    // Set response headers for PDF download
    const filename = `SalarySlip_${salary.employeeId.eId}_${salary.month}_${salary.year}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe the PDF to response
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error('Error generating salary slip:', error);
    res.status(500).json({
      message: 'Failed to generate salary slip',
      error: error.message
    });
  }
};

// ========== GENERATE BULK SALARY SLIPS ==========
export const generateBulkSlips = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: 'month and year are required'
      });
    }

    // Get all approved salaries for the period
    const salaries = await Salary.find({
      month,
      year: parseInt(year),
      status: 'APPROVED'
    }).populate('employeeId', 'firstName lastName eId');

    if (salaries.length === 0) {
      return res.status(404).json({
        message: 'No approved salaries found for this period'
      });
    }

    res.status(200).json({
      message: 'Bulk slip generation ready',
      count: salaries.length,
      salaries: salaries.map(s => ({
        id: s._id,
        employeeName: `${s.employeeId.firstName} ${s.employeeId.lastName}`,
        employeeId: s.employeeId.eId
      }))
    });

  } catch (error) {
    console.error('Error in bulk slip generation:', error);
    res.status(500).json({
      message: 'Failed to generate bulk slips',
      error: error.message
    });
  }
};