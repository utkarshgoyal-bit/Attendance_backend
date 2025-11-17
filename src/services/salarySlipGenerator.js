import PDFDocument from 'pdfkit';
import Salary from '../models/salaryModel.js';
import Employee from '../models/employeeModel.js';
import salaryCalculationService from './salaryCalculationService.js';

class SalarySlipGenerator {
  
  async generateSlip(salaryId) {
    try {
      // Fetch salary with full calculation details
      const salary = await Salary.findById(salaryId)
        .populate('employeeId', 'firstName lastName email eId department designation joiningDate');

      if (!salary) {
        throw new Error('Salary record not found');
      }

      const employee = salary.employeeId;

      // Get detailed calculation breakdown
      const calculationDetails = await salaryCalculationService.calculateSalary(
        employee._id,
        salary.month,
        salary.year
      );

      // Create PDF document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      // ==================== HEADER ====================
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('MAITRII INFOTECH', { align: 'center' });
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Salary Slip', { align: 'center' })
         .moveDown(0.3);

      // Period with colored background
      doc.rect(50, doc.y, 495, 30)
         .fillAndStroke('#dbeafe', '#3b82f6');
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text(`Pay Period: ${salary.month} ${salary.year}`, 50, doc.y - 22, { 
           align: 'center', 
           width: 495 
         });

      doc.moveDown(2);

      // ==================== EMPLOYEE DETAILS ====================
      const detailsY = doc.y;
      
      // Left column
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('EMPLOYEE INFORMATION', 50, detailsY);

      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#6b7280');

      doc.text('Name:', 50, detailsY + 25)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(`${employee.firstName} ${employee.lastName}`, 150, detailsY + 25);

      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text('Employee ID:', 50, detailsY + 45)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(employee.eId, 150, detailsY + 45);

      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text('Department:', 50, detailsY + 65)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(employee.department || 'N/A', 150, detailsY + 65);

      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text('Designation:', 50, detailsY + 85)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(employee.designation || 'N/A', 150, detailsY + 85);

      // Right column - Attendance
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('ATTENDANCE SUMMARY', 320, detailsY);

      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#6b7280');

      const attendance = calculationDetails.attendance;

      doc.text('Total Working Days:', 320, detailsY + 25)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(attendance.totalDays.toString(), 460, detailsY + 25);

      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text('Days Present:', 320, detailsY + 45)
         .font('Helvetica-Bold')
         .fillColor('#059669')
         .text(attendance.presentDays.toString(), 460, detailsY + 45);

      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text('Days Absent:', 320, detailsY + 65)
         .font('Helvetica-Bold')
         .fillColor('#dc2626')
         .text((attendance.totalDays - attendance.presentDays).toString(), 460, detailsY + 65);

      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text('Attendance %:', 320, detailsY + 85)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(`${Math.round(attendance.attendancePercentage)}%`, 460, detailsY + 85);

      doc.moveDown(6);

      // ==================== EARNINGS & DEDUCTIONS TABLE ====================
      const tableTop = doc.y + 20;
      
      // Table header background
      doc.rect(50, tableTop - 5, 495, 25)
         .fillAndStroke('#f3f4f6', '#d1d5db');

      // Table headers
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('EARNINGS', 60, tableTop)
         .text('AMOUNT', 200, tableTop, { align: 'right', width: 80 })
         .text('DEDUCTIONS', 320, tableTop)
         .text('AMOUNT', 460, tableTop, { align: 'right', width: 80 });

      let currentY = tableTop + 30;

      // Earnings
      const earnings = calculationDetails.earnings;
      const maxRows = Math.max(earnings.length, calculationDetails.deductions.length);

      doc.fontSize(10).font('Helvetica').fillColor('#111827');

      for (let i = 0; i < maxRows; i++) {
        // Earnings column
        if (i < earnings.length) {
          const earning = earnings[i];
          doc.text(earning.name, 60, currentY)
             .text(`₹${earning.amount.toLocaleString()}`, 200, currentY, { 
               align: 'right', 
               width: 80 
             });
        }

        // Deductions column
        if (i < calculationDetails.deductions.length) {
          const deduction = calculationDetails.deductions[i];
          doc.text(deduction.name, 320, currentY)
             .fillColor('#dc2626')
             .text(`₹${deduction.amount.toLocaleString()}`, 460, currentY, { 
               align: 'right', 
               width: 80 
             })
             .fillColor('#111827');
        }

        currentY += 20;
      }

      // Separator line
      currentY += 10;
      doc.moveTo(50, currentY)
         .lineTo(545, currentY)
         .strokeColor('#d1d5db')
         .lineWidth(1)
         .stroke();

      // Totals
      currentY += 15;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('GROSS EARNINGS', 60, currentY)
         .fillColor('#059669')
         .text(`₹${calculationDetails.grossEarnings.toLocaleString()}`, 200, currentY, { 
           align: 'right', 
           width: 80 
         });

      doc.fillColor('#374151')
         .text('TOTAL DEDUCTIONS', 320, currentY)
         .fillColor('#dc2626')
         .text(`₹${calculationDetails.totalDeductions.toLocaleString()}`, 460, currentY, { 
           align: 'right', 
           width: 80 
         });

      // Net Salary Box
      currentY += 40;
      doc.rect(50, currentY, 495, 40)
         .fillAndStroke('#dbeafe', '#3b82f6');

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('NET SALARY (Take Home)', 60, currentY + 12)
         .fontSize(16)
         .text(`₹${calculationDetails.netSalary.toLocaleString()}`, 460, currentY + 10, { 
           align: 'right', 
           width: 80 
         });

      // Amount in words
      currentY += 50;
      doc.fontSize(10)
         .font('Helvetica-Oblique')
         .fillColor('#6b7280')
         .text(`Amount in words: ${this.numberToWords(calculationDetails.netSalary)} Rupees Only`, 50, currentY);

      // Footer
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .fillColor('#9ca3af')
         .text('This is a computer-generated salary slip and does not require a signature.', 50, 750, {
           align: 'center',
           width: 495
         });

      doc.fontSize(7)
         .text('For any queries, please contact HR Department', 50, 765, {
           align: 'center',
           width: 495
         });

      return doc;

    } catch (error) {
      console.error('Error generating salary slip:', error);
      throw error;
    }
  }

  // Helper function to convert number to words
  numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanThousand(n % 100) : '');
    };

    if (num < 1000) return convertLessThanThousand(num);
    if (num < 100000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      return convertLessThanThousand(thousands) + ' Thousand' + (remainder !== 0 ? ' ' + convertLessThanThousand(remainder) : '');
    }
    
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return convertLessThanThousand(lakhs) + ' Lakh' + (remainder !== 0 ? ' ' + this.numberToWords(remainder) : '');
  }
}

export default new SalarySlipGenerator();