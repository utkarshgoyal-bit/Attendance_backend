/**
 * Cache Service using sessionStorage
 *
 * Provides caching functionality with TTL (time-to-live) support
 * to reduce API calls and improve application performance.
 *
 * Features:
 * - Automatic expiry based on TTL
 * - JSON serialization/deserialization
 * - Quota exceeded error handling
 * - Cache invalidation methods
 */

/**
 * Set data in cache with expiry time
 *
 * @param {string} key - Unique cache key to identify the data
 * @param {any} data - Data to cache (will be JSON serialized)
 * @param {number} ttl - Time to live in milliseconds (e.g., 5 * 60 * 1000 = 5 minutes)
 * @returns {boolean} - Returns true if cached successfully, false otherwise
 *
 * @example
 * // Cache employee data for 5 minutes
 * setCache('employees', employeeData, 5 * 60 * 1000);
 *
 * // Cache salary config for 1 hour
 * setCache('salaryConfig', config, 60 * 60 * 1000);
 */
export const setCache = (key, data, ttl) => {
  try {
    // Create cache object with data and expiry timestamp
    const cacheObject = {
      data: data,
      expiry: Date.now() + ttl, // Current time + time-to-live
    };

    // Serialize and store in sessionStorage
    sessionStorage.setItem(key, JSON.stringify(cacheObject));

    console.log(`[Cache] Set: ${key} (TTL: ${ttl}ms, expires at: ${new Date(cacheObject.expiry).toLocaleTimeString()})`);

    return true;
  } catch (error) {
    // Handle quota exceeded error or other storage errors
    if (error.name === 'QuotaExceededError') {
      console.error('[Cache] Storage quota exceeded. Consider clearing old cache.');
      // Optionally, clear all cache to free up space
      clearAllCache();
    } else {
      console.error('[Cache] Error setting cache:', error.message);
    }
    return false;
  }
};

/**
 * Get data from cache if not expired
 *
 * @param {string} key - Cache key to retrieve
 * @returns {any|null} - Cached data or null if expired/not found
 *
 * @example
 * const employees = getCache('employees');
 * if (employees) {
 *   console.log('Using cached data');
 * } else {
 *   console.log('Cache expired or not found, fetch fresh data');
 * }
 */
export const getCache = (key) => {
  try {
    // Retrieve from sessionStorage
    const cached = sessionStorage.getItem(key);

    // Check if cache exists
    if (!cached) {
      console.log(`[Cache] Miss: ${key} - not found`);
      return null;
    }

    // Parse cached object
    const cacheObject = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() > cacheObject.expiry) {
      console.log(`[Cache] Miss: ${key} - expired`);
      // Remove expired cache
      clearCache(key);
      return null;
    }

    // Cache is valid, return data
    console.log(`[Cache] Hit: ${key} - valid until ${new Date(cacheObject.expiry).toLocaleTimeString()}`);
    return cacheObject.data;
  } catch (error) {
    console.error('[Cache] Error getting cache:', error.message);
    // If parsing fails, clear corrupted cache
    clearCache(key);
    return null;
  }
};

/**
 * Clear specific cache entry
 *
 * @param {string} key - Cache key to remove
 * @returns {boolean} - Returns true if cleared successfully
 *
 * @example
 * clearCache('employees'); // Remove employees cache
 */
export const clearCache = (key) => {
  try {
    sessionStorage.removeItem(key);
    console.log(`[Cache] Cleared: ${key}`);
    return true;
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error.message);
    return false;
  }
};

/**
 * Clear all cache entries from sessionStorage
 *
 * @returns {boolean} - Returns true if cleared successfully
 *
 * @example
 * clearAllCache(); // Clear all cached data
 */
export const clearAllCache = () => {
  try {
    sessionStorage.clear();
    console.log('[Cache] Cleared all cache');
    return true;
  } catch (error) {
    console.error('[Cache] Error clearing all cache:', error.message);
    return false;
  }
};

/**
 * Check if a cache entry exists and is valid
 *
 * @param {string} key - Cache key to check
 * @returns {boolean} - Returns true if cache exists and is not expired
 *
 * @example
 * if (hasValidCache('employees')) {
 *   console.log('Valid cache exists');
 * }
 */
export const hasValidCache = (key) => {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return false;

    const cacheObject = JSON.parse(cached);
    return Date.now() <= cacheObject.expiry;
  } catch (error) {
    return false;
  }
};

/**
 * Get remaining TTL for a cache entry
 *
 * @param {string} key - Cache key to check
 * @returns {number|null} - Remaining time in milliseconds, or null if not found/expired
 *
 * @example
 * const remainingTime = getRemainingTTL('employees');
 * console.log(`Cache expires in ${remainingTime}ms`);
 */
export const getRemainingTTL = (key) => {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;

    const cacheObject = JSON.parse(cached);
    const remaining = cacheObject.expiry - Date.now();

    return remaining > 0 ? remaining : null;
  } catch (error) {
    return null;
  }
};

/**
 * Common TTL constants (in milliseconds)
 * Use these for consistent cache durations across the app
 */
export const TTL = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
};

/**
 * Cache keys constants
 * Define all cache keys here for consistency
 */
export const CACHE_KEYS = {
  EMPLOYEES: 'hr_employees',
  SALARY_CONFIG: 'hr_salary_config',
  DASHBOARD_STATS: 'hr_dashboard_stats',
  USER_PROFILE: 'hr_user_profile',
};
