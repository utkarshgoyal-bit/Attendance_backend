/**
 * Employee Table API Service
 *
 * Handles all API calls related to employees and salaries
 * using the centralized apiClient
 */

import apiClient from './apiClient';

/**
 * Fetch employees with optional filters and pagination
 *
 * @param {string} month - Filter by month (e.g., "October")
 * @param {string|number} year - Filter by year (e.g., "2025" or 2025)
 * @param {string} branch - Filter by branch (default: "All")
 * @param {string} search - Search term for name, email, or eId
 * @param {number} page - Page number for pagination (default: 1)
 * @param {number} limit - Number of records per page (default: 50)
 * @returns {Promise<Object>} Response with employees array and pagination metadata
 *
 * @example
 * // Fetch all employees
 * const data = await fetchEmployees();
 *
 * @example
 * // Fetch employees for October 2025
 * const data = await fetchEmployees('October', 2025);
 *
 * @example
 * // Fetch with filters and pagination
 * const data = await fetchEmployees('October', 2025, 'Engineering', 'john', 1, 50);
 */
export const fetchEmployees = async (month, year, branch = 'All', search = '', page = 1, limit = 50) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();

    // Only add parameters if they have values
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (branch && branch !== 'All') params.append('branch', branch);
    if (search && search.trim()) params.append('search', search.trim());

    // Always add pagination parameters
    params.append('page', page);
    params.append('limit', limit);

    // Make API request with query parameters
    const response = await apiClient.get(`/employees?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

/**
 * Save salary data for an employee
 *
 * @param {Object} payload - Salary data to save
 * @param {string} payload.employeeId - Employee ID
 * @param {number} payload.attendanceDays - Number of days attended
 * @param {number} payload.totalDays - Total working days
 * @param {number} payload.base - Base salary
 * @param {number} payload.hra - HRA amount
 * @param {number} payload.conveyance - Conveyance allowance
 * @param {number} payload.netPayable - Net payable amount
 * @param {number} payload.ctc - CTC amount
 * @param {string} payload.month - Month name
 * @param {number} payload.year - Year
 * @returns {Promise<Object>} Response with saved salary data
 *
 * @example
 * const salaryData = {
 *   employeeId: '123',
 *   attendanceDays: 25,
 *   totalDays: 30,
 *   base: 50000,
 *   hra: 10000,
 *   conveyance: 2000,
 *   netPayable: 58000,
 *   ctc: 65000,
 *   month: 'October',
 *   year: 2025
 * };
 * const result = await saveSalary(salaryData);
 */
export const saveSalary = async (payload) => {
  try {
    const response = await apiClient.post('/salaries', payload);
    return response.data;
  } catch (error) {
    console.error("Error saving salary:", error);
    throw error;
  }
};

/**
 * Update existing salary data
 *
 * @param {string} id - Salary record ID
 * @param {Object} payload - Updated salary data
 * @returns {Promise<Object>} Response with updated salary data
 *
 * @example
 * const updatedData = {
 *   attendanceDays: 26,
 *   netPayable: 60000
 * };
 * const result = await updateSalary('salary123', updatedData);
 */
export const updateSalary = async (id, payload) => {
  try {
    const response = await apiClient.put(`/salaries/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating salary:", error);
    throw error;
  }
};
