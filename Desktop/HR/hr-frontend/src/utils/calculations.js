/**
 * Salary Calculation Utilities
 *
 * Pure functions for calculating employee salary components including
 * PF (Provident Fund), ESI (Employee State Insurance), net payable, and CTC.
 *
 * All functions are pure (no side effects) and can be safely memoized.
 */

/**
 * Calculate all deductions for an employee based on salary config
 *
 * @pure
 * @param {number} base - Pro-rated basic salary
 * @param {number} totalEarning - Total earning (base + hra + conveyance)
 * @param {number} preHra - Pro-rated HRA amount
 * @param {Object|null} config - Salary configuration object
 * @param {number} config.pfThresholdMin - Minimum threshold for PF applicability
 * @param {number} config.pfThresholdMax - Maximum threshold for PF applicability
 * @param {number} config.esiThresholdMin - Minimum threshold for ESI applicability
 * @param {number} config.esiThresholdMax - Maximum threshold for ESI applicability
 * @param {number} config.employeePF - Employee PF percentage
 * @param {number} config.employeeESI - Employee ESI percentage
 * @param {number} config.companyPF - Company PF percentage
 * @param {number} config.companyESI - Company ESI percentage
 * @param {number} config.companyPension - Company pension percentage
 * @returns {Object} Deduction breakdown
 * @returns {number} return.employeePF - Employee PF deduction
 * @returns {number} return.employeeESI - Employee ESI deduction
 * @returns {number} return.companyPF - Company PF contribution
 * @returns {number} return.companyESI - Company ESI contribution
 * @returns {number} return.pension - Pension contribution
 * @returns {number} return.companyPay - Total company contribution
 *
 * @example
 * const deductions = calculateDeductions(15000, 20000, 5000, salaryConfig);
 * // Returns: { employeePF: 1800, employeeESI: 300, companyPF: 1800, ... }
 */
export const calculateDeductions = (base, totalEarning, preHra, config) => {
  // Input validation - ensure all inputs are valid numbers
  if (typeof base !== 'number' || typeof totalEarning !== 'number' || typeof preHra !== 'number') {
    console.warn('[Calculations] Invalid input types for calculateDeductions');
    return {
      employeePF: 0,
      employeeESI: 0,
      companyPF: 0,
      companyESI: 0,
      pension: 0,
      companyPay: 0,
    };
  }

  // If config is not available, return zero deductions
  if (!config) {
    return {
      employeePF: 0,
      employeeESI: 0,
      companyPF: 0,
      companyESI: 0,
      pension: 0,
      companyPay: 0,
    };
  }

  // Check thresholds for PF and ESI applicability
  const isPFApplicable = base >= (config.pfThresholdMin || 0) && base <= (config.pfThresholdMax || Infinity);
  const isESIApplicable = totalEarning >= (config.esiThresholdMin || 0) && totalEarning <= (config.esiThresholdMax || Infinity);

  // Calculate employee deductions
  const employeePF = isPFApplicable ? base * ((config.employeePF || 0) / 100) : 0;
  const totalEsiBase = base + preHra;
  const employeeESI = isESIApplicable ? totalEsiBase * ((config.employeeESI || 0) / 100) : 0;

  // Calculate company contributions
  const companyPF = isPFApplicable ? base * ((config.companyPF || 0) / 100) : 0;
  const companyESI = isESIApplicable ? totalEsiBase * ((config.companyESI || 0) / 100) : 0;
  const pension = isPFApplicable ? base * ((config.companyPension || 0) / 100) : 0;
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

/**
 * Calculate net payable salary for an employee
 *
 * Net Payable = Total Earning - Total Deductions
 * Total Earning = Pro-rated (Base + HRA + Conveyance)
 * Total Deductions = Employee PF + Employee ESI
 *
 * @pure
 * @param {Object} employee - Employee object with salary components
 * @param {number} employee.base - Base salary per month
 * @param {number} employee.hra - HRA per month
 * @param {number} employee.conveyance - Conveyance allowance per month
 * @param {number} employee.attendanceDays - Days attended in the month
 * @param {number} employee.totalDays - Total working days in the month
 * @param {Object|null} salaryConfig - Salary configuration object
 * @returns {number} Net payable amount (rounded to nearest integer)
 *
 * @example
 * const netPayable = calculateNetPayable({
 *   base: 15000,
 *   hra: 5000,
 *   conveyance: 2000,
 *   attendanceDays: 25,
 *   totalDays: 30
 * }, salaryConfig);
 * // Returns: 18500 (example)
 */
export const calculateNetPayable = (employee, salaryConfig) => {
  // Input validation
  if (!employee || typeof employee !== 'object') {
    console.warn('[Calculations] Invalid employee object for calculateNetPayable');
    return 0;
  }

  const { base = 0, hra = 0, conveyance = 0, attendanceDays = 0, totalDays = 30 } = employee;

  // Avoid division by zero
  if (totalDays === 0) {
    console.warn('[Calculations] Total days is zero, returning 0');
    return 0;
  }

  // Calculate pro-rated components based on attendance
  const preBasic = (base * attendanceDays) / totalDays;
  const preHra = (hra * attendanceDays) / totalDays;
  const preConv = (conveyance * attendanceDays) / totalDays;
  const totalEarning = preBasic + preHra + preConv;

  // Calculate deductions
  const { employeePF, employeeESI } = calculateDeductions(
    preBasic,
    totalEarning,
    preHra,
    salaryConfig
  );
  const totalDeduction = employeePF + employeeESI;

  // Calculate net payable
  const netPayable = totalEarning - totalDeduction;

  // Return rounded value
  return Math.round(netPayable);
};

/**
 * Calculate Cost to Company (CTC) for an employee
 *
 * CTC = Net Payable + Company Contributions (PF + ESI + Pension)
 *
 * @pure
 * @param {Object} employee - Employee object with salary components
 * @param {number} employee.base - Base salary per month
 * @param {number} employee.hra - HRA per month
 * @param {number} employee.conveyance - Conveyance allowance per month
 * @param {number} employee.attendanceDays - Days attended in the month
 * @param {number} employee.totalDays - Total working days in the month
 * @param {Object|null} salaryConfig - Salary configuration object
 * @returns {number} CTC amount (rounded to nearest integer)
 *
 * @example
 * const ctc = calculateCTC({
 *   base: 15000,
 *   hra: 5000,
 *   conveyance: 2000,
 *   attendanceDays: 25,
 *   totalDays: 30
 * }, salaryConfig);
 * // Returns: 22500 (example)
 */
export const calculateCTC = (employee, salaryConfig) => {
  // Input validation
  if (!employee || typeof employee !== 'object') {
    console.warn('[Calculations] Invalid employee object for calculateCTC');
    return 0;
  }

  const { base = 0, hra = 0, conveyance = 0, attendanceDays = 0, totalDays = 30 } = employee;

  // Avoid division by zero
  if (totalDays === 0) {
    console.warn('[Calculations] Total days is zero, returning 0');
    return 0;
  }

  // Calculate pro-rated components based on attendance
  const preBasic = (base * attendanceDays) / totalDays;
  const preHra = (hra * attendanceDays) / totalDays;
  const preConv = (conveyance * attendanceDays) / totalDays;
  const totalEarning = preBasic + preHra + preConv;

  // Calculate all deductions and company contributions
  const { employeePF, employeeESI, pension, companyPay } = calculateDeductions(
    preBasic,
    totalEarning,
    preHra,
    salaryConfig
  );

  // Calculate net payable (what employee receives)
  const netPayable = totalEarning - (employeePF + employeeESI);

  // Calculate CTC (total cost to company)
  // CTC = Net Payable + Company Contributions + Employee Deductions + Pension
  const ctc = netPayable + companyPay + (employeePF + employeeESI) + pension;

  // Return rounded value
  return Math.round(ctc);
};

/**
 * Create a memoized version of calculateNetPayable for performance optimization
 * Uses a simple cache based on stringified inputs
 *
 * Note: This is optional and should only be used if calculations are called
 * repeatedly with the same inputs
 */
const memoCache = new Map();

/**
 * Memoized version of calculateNetPayable
 * @param {Object} employee - Employee object
 * @param {Object} salaryConfig - Salary config object
 * @returns {number} Net payable amount
 */
export const calculateNetPayableMemoized = (employee, salaryConfig) => {
  const cacheKey = JSON.stringify({ employee, salaryConfig });

  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey);
  }

  const result = calculateNetPayable(employee, salaryConfig);
  memoCache.set(cacheKey, result);

  // Clear cache if it gets too large (prevent memory leak)
  if (memoCache.size > 1000) {
    memoCache.clear();
  }

  return result;
};

/**
 * Memoized version of calculateCTC
 * @param {Object} employee - Employee object
 * @param {Object} salaryConfig - Salary config object
 * @returns {number} CTC amount
 */
export const calculateCTCMemoized = (employee, salaryConfig) => {
  const cacheKey = JSON.stringify({ employee, salaryConfig, type: 'ctc' });

  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey);
  }

  const result = calculateCTC(employee, salaryConfig);
  memoCache.set(cacheKey, result);

  // Clear cache if it gets too large (prevent memory leak)
  if (memoCache.size > 1000) {
    memoCache.clear();
  }

  return result;
};
