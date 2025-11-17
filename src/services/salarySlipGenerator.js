import PDFDocument from 'pdfkit';
import Salary from '../models/salaryModel.js';
import Employee from '../models/employeeModel.js';

class SalarySlipGenerator {
  
  async generateSlip(salaryId) {
    try {
      // Fetch salary with employee details
      const salary = await Salary.findById(salaryId)
        .populate('employeeId', 'firstName lastName email eId department designation');

      if (!salary) {
        throw new Error('Salary record not found');
      }

      const employee = salary.employeeId;

      // Create PDF document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      // Company Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('MAITRII INFOTECH', { align: 'center' });
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('Salary Slip', { align: 'center' })
         .moveDown();

      // Period Info
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`Period: ${salary.month} ${salary.year}`, { align: 'center' })
         .moveDown(2);

      // Employee Details Section
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('EMPLOYEE DETAILS', { underline: true })
         .moveDown(0.5);

      const startY = doc.y;
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('Employee Name:', 50, startY)
         .font('Helvetica-Bold')
         .text(`${employee.firstName} ${employee.lastName}`, 200, startY);

      doc.font('Helvetica')
         .text('Employee ID:', 50, startY + 20)
         .font('Helvetica-Bold')
         .text(employee.eId, 200, startY + 20);

      doc.font('Helvetica')
         .text('Department:', 50, startY + 40)
         .font('Helvetica-Bold')
         .text(employee.department || 'N/A', 200, startY + 40);

      doc.font('Helvetica')
         .text('Designation:', 50, startY + 60)
         .font('Helvetica-Bold')
         .text(employee.designation || 'N/A', 200, startY + 60);

      doc.moveDown(5);

      // Attendance Details
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('ATTENDANCE DETAILS', { underline: true })
         .moveDown(0.5);

      const attY = doc.y;
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('Total Days:', 50, attY)
         .font('Helvetica-Bold')
         .text(salary.totalDays.toString(), 200, attY);

      doc.font('Helvetica')
         .text('Present Days:', 50, attY + 20)
         .font('Helvetica-Bold')
         .text(salary.attendanceDays.toString(), 200, attY + 20);

      doc.font('Helvetica')
         .text('Absent Days:', 50, attY + 40)
         .font('Helvetica-Bold')
         .text((salary.totalDays - salary.attendanceDays).toString(), 200, attY + 40);

      doc.moveDown(4);

      // Earnings & Deductions Table
      const tableTop = doc.y + 20;
      const col1X = 50;
      const col2X = 300;
      const col3X = 450;

      // Table Headers
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('EARNINGS', col1X, tableTop)
         .text('AMOUNT', col2X, tableTop)
         .text('DEDUCTIONS', col3X + 50, tableTop);

      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      let currentY = tableTop + 25;

      // Earnings
      doc.fontSize(10)
         .font('Helvetica')
         .text('Basic Salary', col1X, currentY)
         .text(`₹${salary.base?.toLocaleString() || '0'}`, col2X, currentY);

      currentY += 20;
      doc.text('HRA', col1X, currentY)
         .text(`₹${salary.hra?.toLocaleString() || '0'}`, col2X, currentY);

      currentY += 20;
      doc.text('Conveyance', col1X, currentY)
         .text(`₹${salary.conveyance?.toLocaleString() || '0'}`, col2X, currentY);

      // Deductions (calculate from gross - net)
      const deductions = (salary.ctc || 0) - (salary.netPayable || 0);
      
      currentY = tableTop + 25;
      doc.text('PF / ESI / PT', col3X + 50, currentY)
         .text(`₹${deductions.toLocaleString()}`, col3X + 150, currentY);

      // Totals line
      currentY += 60;
      doc.moveTo(50, currentY)
         .lineTo(550, currentY)
         .stroke();

      currentY += 10;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('GROSS EARNINGS', col1X, currentY)
         .text(`₹${salary.ctc?.toLocaleString() || '0'}`, col2X, currentY)
         .text('TOTAL DEDUCTIONS', col3X + 50, currentY)
         .text(`₹${deductions.toLocaleString()}`, col3X + 150, currentY);

      // Net Salary
      currentY += 30;
      doc.moveTo(50, currentY)
         .lineTo(550, currentY)
         .stroke();

      currentY += 15;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('NET SALARY', col1X, currentY)
         .text(`₹${salary.netPayable?.toLocaleString() || '0'}`, col2X, currentY);

      currentY += 5;
      doc.moveTo(50, currentY)
         .lineTo(550, currentY)
         .stroke();

      // Footer
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .text('This is a computer-generated salary slip and does not require a signature.', 50, 750, {
           align: 'center',
           width: 500
         });

      return doc;

    } catch (error) {
      console.error('Error generating salary slip:', error);
      throw error;
    }
  }
}

export default new SalarySlipGenerator();