import { api } from './apiClient';
import { salaryConfigCache } from './cacheService';

/**
 * Fetch salary configuration
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Object>} Response with salary config data
 */
export const fetchSalaryConfig = async (useCache = true) => {
  // Check cache first if enabled
  if (useCache) {
    const cached = salaryConfigCache.get();
    if (cached) {
      console.log('[API] Using cached salary config');
      return { data: cached, error: null, fromCache: true };
    }
  }

  // Make API request
  const result = await api.get('/salary-config');

  // Cache successful response
  if (result.data && useCache) {
    salaryConfigCache.set(result.data);
  }

  return { ...result, fromCache: false };
};

/**
 * Update salary configuration
 * @param {Object} payload - Updated salary config
 * @returns {Promise<Object>} Response with updated salary config
 */
export const updateSalaryConfig = async (payload) => {
  if (!payload) {
    return {
      data: null,
      error: {
        message: 'Salary config data is required',
        status: 400,
      },
    };
  }

  const result = await api.put('/salary-config', payload);

  // Invalidate cache on successful update
  if (result.data) {
    salaryConfigCache.invalidate();
  }

  return result;
};

/**
 * Invalidate salary config cache
 * Use this when you want to force fresh data on next request
 */
export const invalidateSalaryConfigCache = () => {
  salaryConfigCache.invalidate();
};
