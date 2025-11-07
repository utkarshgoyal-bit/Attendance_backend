import { api } from './apiClient';
import { employeesListCache, dashboardStatsCache } from './cacheService';

/**
 * Fetch employees with filters and pagination
 * @param {Object} options - Query options
 * @param {string} options.month - Filter by month (e.g., "October")
 * @param {number} options.year - Filter by year (e.g., 2025)
 * @param {string} options.branch - Filter by branch (e.g., "All", "Engineering")
 * @param {string} options.search - Search term for firstName, lastName, email, eId
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 50)
 * @param {boolean} options.useCache - Whether to use cache (default: false)
 * @returns {Promise<Object>} Response with employees array and pagination metadata
 */
export const fetchEmployees = async (options = {}) => {
  const {
    month,
    year,
    branch,
    search,
    page = 1,
    limit = 50,
    useCache = false,
  } = options;

  // Create cache key based on query parameters
  const cacheKey = `employees_${month}_${year}_${branch}_${search}_${page}_${limit}`;

  // Check cache first if enabled
  if (useCache) {
    const cached = employeesListCache.get();
    if (cached && cached.cacheKey === cacheKey) {
      console.log('[API] Using cached employees data');
      return { data: cached.data, error: null, fromCache: true };
    }
  }

  // Build query parameters
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  if (branch && branch !== 'All') params.branch = branch;
  if (search) params.search = search;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  // Make API request
  const result = await api.get('/employees', params);

  // Cache successful response
  if (result.data && useCache) {
    employeesListCache.set({
      cacheKey,
      data: result.data,
    });
  }

  return { ...result, fromCache: false };
};

/**
 * Fetch dashboard statistics
 * @param {string} month - Month (e.g., "October")
 * @param {number} year - Year (e.g., 2025)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Object>} Dashboard stats including total employees, salary paid, etc.
 */
export const fetchDashboardStats = async (month, year, useCache = true) => {
  if (!month || !year) {
    return {
      data: null,
      error: {
        message: 'Month and year are required parameters',
        status: 400,
      },
    };
  }

  // Create cache key
  const cacheKey = `stats_${month}_${year}`;

  // Check cache first if enabled
  if (useCache) {
    const cached = dashboardStatsCache.get();
    if (cached && cached.cacheKey === cacheKey) {
      console.log('[API] Using cached dashboard stats');
      return { data: cached.data, error: null, fromCache: true };
    }
  }

  // Make API request
  const result = await api.get('/employees/stats', { month, year });

  // Cache successful response
  if (result.data && useCache) {
    dashboardStatsCache.set({
      cacheKey,
      data: result.data,
    });
  }

  return { ...result, fromCache: false };
};

/**
 * Save salary for an employee
 * @param {Object} payload - Salary data
 * @returns {Promise<Object>} Response with saved salary
 */
export const saveSalary = async (payload) => {
  // Validate required fields
  if (!payload.employeeId || !payload.attendanceDays || !payload.month || !payload.year) {
    return {
      data: null,
      error: {
        message: 'Missing required fields: employeeId, attendanceDays, month, and year are required',
        status: 400,
      },
    };
  }

  const result = await api.post('/salaries', payload);

  // Invalidate relevant caches on successful save
  if (result.data) {
    employeesListCache.invalidate();
    dashboardStatsCache.invalidate();
  }

  return result;
};

/**
 * Update existing salary
 * @param {string} id - Salary ID
 * @param {Object} payload - Updated salary data
 * @returns {Promise<Object>} Response with updated salary
 */
export const updateSalary = async (id, payload) => {
  if (!id) {
    return {
      data: null,
      error: {
        message: 'Salary ID is required',
        status: 400,
      },
    };
  }

  const result = await api.put(`/salaries/${id}`, payload);

  // Invalidate relevant caches on successful update
  if (result.data) {
    employeesListCache.invalidate();
    dashboardStatsCache.invalidate();
  }

  return result;
};

/**
 * Fetch salaries with filters and pagination
 * @param {Object} options - Query options
 * @param {string} options.month - Filter by month
 * @param {number} options.year - Filter by year
 * @param {string} options.employeeId - Filter by employee ID
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 100)
 * @returns {Promise<Object>} Response with salaries array and pagination metadata
 */
export const fetchSalaries = async (options = {}) => {
  const {
    month,
    year,
    employeeId,
    page = 1,
    limit = 100,
  } = options;

  // Build query parameters
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  if (employeeId) params.employeeId = employeeId;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  return await api.get('/salaries', params);
};

/**
 * Invalidate all employee-related caches
 * Use this when you want to force fresh data on next request
 */
export const invalidateEmployeeCaches = () => {
  employeesListCache.invalidate();
  dashboardStatsCache.invalidate();
};
