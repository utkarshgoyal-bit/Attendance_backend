import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const handleExport = (selectedMonth, selectedYear, employees) => {
  const companyName = "MENTOR FINMART PRIVATE LIMITED";
  const reportTitle = `Salary Sheet Report for the month of ${selectedMonth.toUpperCase()}/${selectedYear}`;
  const printDate = new Date().toLocaleDateString("en-GB");

  const topHeader = [
    [companyName],
    [reportTitle],
    [`Print Date : ${printDate}`],
    [],
  ];

  const headers = [
    [
      "", "", "", "Actuals", "Actuals", "Actuals", "",
      "Earnings", "Earnings", "Earnings", "Earnings", "Earnings", "",
      "Deduction", "Deduction", "Deduction", "Deduction", "Deduction", "Deduction",
      "", "", "", ""
    ],
    [
      "S. NO.",
      "Ref. No.",
      "Employee Name",
      "BASIC",
      "HRA",
      "CON",
      "Pre Days",
      "BASIC",
      "HRA",
      "CON",
      "Tot ESI",
      "Earn.",
      "Earnings",
      "PF",
      "ESI",
      "Co.PF",
      "Co.ESI",
      "Pension",
      "Co.Pay",
      "Employee Pay",
      "Net Payable",
      "CTC of Company",
      "Remarks if any and Signature",
    ],
  ];

  const rows = employees.map((emp, index) => {
    const base = emp.base || 0;
    const hra = emp.hra || 0;
    const conveyance = emp.conveyance || 0;
    const attendanceDays = emp.attendanceDays || 0;
    const totalDays = emp.totalDays || 30;

    const baseEarn = (base / totalDays) * attendanceDays;
    const hraEarn = (hra / totalDays) * attendanceDays;
    const conEarn = (conveyance / totalDays) * attendanceDays;
    const totalEarn = baseEarn + hraEarn + conEarn;

    const pf = baseEarn * 0.06;
    const esi = totalEarn * 0.0075;
    const coPf = baseEarn * 0.06;
    const coEsi = totalEarn * 0.0075;
    const pension = baseEarn * 0.0833;
    const coPay = coPf + coEsi + pension;

    const employeePay = pf + esi;
    const netPayable = totalEarn - employeePay;
    const ctc = totalEarn + coPay;

    return [
      index + 1,
      emp.refNo || `P-${String(index + 1).padStart(3, "0")}`,
      emp.name,
      base.toFixed(0),
      hra.toFixed(0),
      conveyance.toFixed(0),
      attendanceDays,
      baseEarn.toFixed(0),
      hraEarn.toFixed(0),
      conEarn.toFixed(0),
      esi.toFixed(0),
      totalEarn.toFixed(0),
      totalEarn.toFixed(0),
      pf.toFixed(0),
      esi.toFixed(0),
      coPf.toFixed(0),
      coEsi.toFixed(0),
      pension.toFixed(0),
      coPay.toFixed(0),
      employeePay.toFixed(0),
      netPayable.toFixed(0),
      ctc.toFixed(0),
      "",
    ];
  });


  const worksheetData = [...topHeader, ...headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);


  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 22 } }, 
    { s: { r: 1, c: 0 }, e: { r: 1, c: 22 } }, 
    { s: { r: 2, c: 0 }, e: { r: 2, c: 22 } }, 
  ];


  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = 0; R <= 2; ++R) {
    for (let C = 0; C <= 22; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellRef]) continue;
      if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
      worksheet[cellRef].s.alignment = {
        horizontal: "center",
        vertical: "center",
      };
      worksheet[cellRef].s.font = { bold: true, sz: R === 0 ? 14 : 12 };
    }
  }

  worksheet["!cols"] = [
    { wch: 6 }, { wch: 10 }, { wch: 20 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 12 },
    { wch: 12 }, { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Sheet");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Salary_Sheet_${selectedMonth}_${selectedYear}.xlsx`);
};
