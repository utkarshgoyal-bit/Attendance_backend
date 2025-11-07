/**
 * Cache Service - Manages browser storage caching with TTL support
 * Uses sessionStorage for session-based caching
 */

// Cache configuration
const CACHE_CONFIG = {
  // Cache keys
  KEYS: {
    SALARY_CONFIG: 'hr_salary_config',
    EMPLOYEES_LIST: 'hr_employees_list',
    DASHBOARD_STATS: 'hr_dashboard_stats',
  },
  // TTL (Time To Live) in milliseconds
  TTL: {
    SALARY_CONFIG: 60 * 60 * 1000, // 1 hour
    EMPLOYEES_LIST: 5 * 60 * 1000, // 5 minutes
    DASHBOARD_STATS: 2 * 60 * 1000, // 2 minutes
  },
};

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {*} data - Cached data
 * @property {number} timestamp - When the data was cached
 * @property {number} ttl - Time to live in milliseconds
 */

/**
 * Storage wrapper to handle sessionStorage operations
 */
const storage = {
  /**
   * Get item from storage
   */
  get: (key) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`[Cache] Error reading from storage for key: ${key}`, error);
      return null;
    }
  },

  /**
   * Set item in storage
   */
  set: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Cache] Error writing to storage for key: ${key}`, error);
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        console.warn('[Cache] Storage quota exceeded, clearing old cache');
        cacheService.clearAll();
      }
      return false;
    }
  },

  /**
   * Remove item from storage
   */
  remove: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Cache] Error removing from storage for key: ${key}`, error);
      return false;
    }
  },

  /**
   * Clear all items from storage
   */
  clear: () => {
    try {
      // Only clear HR-related cache items
      Object.values(CACHE_CONFIG.KEYS).forEach((key) => {
        sessionStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('[Cache] Error clearing storage', error);
      return false;
    }
  },
};

/**
 * Check if cached data is still valid based on TTL
 */
const isValid = (cacheEntry) => {
  if (!cacheEntry || !cacheEntry.timestamp || !cacheEntry.ttl) {
    return false;
  }

  const now = Date.now();
  const age = now - cacheEntry.timestamp;

  return age < cacheEntry.ttl;
};

/**
 * Cache Service API
 */
export const cacheService = {
  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {*|null} Cached data or null if not found/expired
   */
  get: (key) => {
    const cacheEntry = storage.get(key);

    if (!cacheEntry) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cache] Miss for key: ${key}`);
      }
      return null;
    }

    if (!isValid(cacheEntry)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cache] Expired for key: ${key}`);
      }
      storage.remove(key);
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      const age = Date.now() - cacheEntry.timestamp;
      console.log(`[Cache] Hit for key: ${key} (age: ${Math.round(age / 1000)}s)`);
    }

    return cacheEntry.data;
  },

  /**
   * Set cached data with TTL
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @returns {boolean} Success status
   */
  set: (key, data, ttl = null) => {
    // Get default TTL if not provided
    const defaultTTL = CACHE_CONFIG.TTL[Object.keys(CACHE_CONFIG.KEYS).find(
      k => CACHE_CONFIG.KEYS[k] === key
    )];

    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || defaultTTL || 5 * 60 * 1000, // Default 5 minutes
    };

    const success = storage.set(key, cacheEntry);

    if (success && process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Set for key: ${key} (TTL: ${cacheEntry.ttl / 1000}s)`);
    }

    return success;
  },

  /**
   * Invalidate (remove) cached data
   * @param {string} key - Cache key
   * @returns {boolean} Success status
   */
  invalidate: (key) => {
    const success = storage.remove(key);

    if (success && process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Invalidated key: ${key}`);
    }

    return success;
  },

  /**
   * Clear all cache
   * @returns {boolean} Success status
   */
  clearAll: () => {
    const success = storage.clear();

    if (success && process.env.NODE_ENV === 'development') {
      console.log('[Cache] All cache cleared');
    }

    return success;
  },

  /**
   * Check if cache exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean} Valid status
   */
  has: (key) => {
    const cacheEntry = storage.get(key);
    return cacheEntry && isValid(cacheEntry);
  },

  /**
   * Get cache info (for debugging)
   * @param {string} key - Cache key
   * @returns {object|null} Cache info
   */
  getInfo: (key) => {
    const cacheEntry = storage.get(key);

    if (!cacheEntry) {
      return null;
    }

    const now = Date.now();
    const age = now - cacheEntry.timestamp;
    const remaining = cacheEntry.ttl - age;

    return {
      key,
      timestamp: cacheEntry.timestamp,
      age: Math.round(age / 1000),
      ttl: Math.round(cacheEntry.ttl / 1000),
      remaining: Math.round(remaining / 1000),
      valid: isValid(cacheEntry),
    };
  },

  /**
   * Get all cache info (for debugging)
   * @returns {Array} Array of cache info objects
   */
  getAllInfo: () => {
    return Object.values(CACHE_CONFIG.KEYS).map((key) => {
      const info = cacheService.getInfo(key);
      return info || { key, exists: false };
    });
  },
};

// Specific cache utilities for different data types
export const salaryConfigCache = {
  get: () => cacheService.get(CACHE_CONFIG.KEYS.SALARY_CONFIG),
  set: (data) => cacheService.set(CACHE_CONFIG.KEYS.SALARY_CONFIG, data, CACHE_CONFIG.TTL.SALARY_CONFIG),
  invalidate: () => cacheService.invalidate(CACHE_CONFIG.KEYS.SALARY_CONFIG),
};

export const employeesListCache = {
  get: () => cacheService.get(CACHE_CONFIG.KEYS.EMPLOYEES_LIST),
  set: (data) => cacheService.set(CACHE_CONFIG.KEYS.EMPLOYEES_LIST, data, CACHE_CONFIG.TTL.EMPLOYEES_LIST),
  invalidate: () => cacheService.invalidate(CACHE_CONFIG.KEYS.EMPLOYEES_LIST),
};

export const dashboardStatsCache = {
  get: () => cacheService.get(CACHE_CONFIG.KEYS.DASHBOARD_STATS),
  set: (data) => cacheService.set(CACHE_CONFIG.KEYS.DASHBOARD_STATS, data, CACHE_CONFIG.TTL.DASHBOARD_STATS),
  invalidate: () => cacheService.invalidate(CACHE_CONFIG.KEYS.DASHBOARD_STATS),
};

// Export cache keys for use in other modules
export const CACHE_KEYS = CACHE_CONFIG.KEYS;

export default cacheService;
