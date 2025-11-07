export const calculateDeductions = (base, totalEarning, preHra, config) => {
  if (!config) {
    // If config is not available, return zero deductions
    return {
      employeePF: 0,
      employeeESI: 0,
      companyPF: 0,
      companyESI: 0,
      pension: 0,
      companyPay: 0,
    };
  }

  // Check thresholds for PF and ESI
  const isPFApplicable = base >= config.pfThresholdMin && base <= config.pfThresholdMax;
  const isESIApplicable = totalEarning >= config.esiThresholdMin && totalEarning <= config.esiThresholdMax;

  const employeePF = isPFApplicable ? base * (config.employeePF / 100) : 0;
  const totalEsiBase = base + preHra;
  const employeeESI = isESIApplicable ? totalEsiBase * (config.employeeESI / 100) : 0;

  const companyPF = isPFApplicable ? base * (config.companyPF / 100) : 0;
  const companyESI = isESIApplicable ? totalEsiBase * (config.companyESI / 100) : 0;
  const pension = isPFApplicable ? base * (config.companyPension / 100) : 0;
  const companyPay = companyPF + companyESI;

  return {
    employeePF,
    employeeESI,
    companyPF,
    companyESI,
    pension,
    companyPay,
  };
};

export const calculateNetPayable = (employee, salaryConfig) => {
  const { base, hra, conveyance, attendanceDays, totalDays } = employee;

  const preBasic = (base * attendanceDays) / totalDays;
  const preHra = (hra * attendanceDays) / totalDays;
  const preConv = (conveyance * attendanceDays) / totalDays;
  const totalEarning = preBasic + preHra + preConv;

  const { employeePF, employeeESI } = calculateDeductions(
    preBasic,
    totalEarning,
    preHra,
    salaryConfig
  );
  const totalDeduction = employeePF + employeeESI;

  const netPayable = totalEarning - totalDeduction;
  return Math.round(netPayable);
};

export const calculateCTC = (employee, salaryConfig) => {
  const { base, hra, conveyance, attendanceDays, totalDays } = employee;

  const preBasic = (base * attendanceDays) / totalDays;
  const preHra = (hra * attendanceDays) / totalDays;
  const preConv = (conveyance * attendanceDays) / totalDays;
  const totalEarning = preBasic + preHra + preConv;

  const { employeePF, employeeESI, pension, companyPay } = calculateDeductions(
    preBasic,
    totalEarning,
    preHra,
    salaryConfig
  );

  const netPayable = totalEarning - (employeePF + employeeESI);

  const ctc = netPayable + companyPay + (employeePF + employeeESI) + pension;

  return Math.round(ctc);
};
