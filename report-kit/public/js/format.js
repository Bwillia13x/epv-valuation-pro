/**
 * CPP Visual Report Kit - Formatting Utilities
 * Number formatting functions for currency, percentages, and abbreviations
 */

window.__FORMAT__ = {
  /**
   * Format currency with CPP-consistent $X.XXM format
   * @param {number} value - The value to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted currency string
   */
  money: function(value, options = {}) {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0.00M';
    }
    
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const forceUnit = options.unit;
    const forceDecimals = options.decimals;
    
    // CPP Standard: Always use $X.XXM format for consistency
    // No mixing of $K/$M in the same visual
    
    if (forceUnit === 'raw') {
      // Raw numbers only when explicitly requested
      return `${sign}$${abs.toLocaleString()}`;
    } else if (forceUnit === 'K' || (abs < 100000 && !forceUnit)) {
      // Use K for values under 100K when no mixing with M
      const scaled = abs / 1000;
      const decimals = forceDecimals !== undefined ? forceDecimals : (scaled >= 100 ? 0 : 1);
      return `${sign}$${scaled.toFixed(decimals)}K`;
    } else {
      // Default to millions format - CPP standard
      const scaled = abs / 1000000;
      const decimals = forceDecimals !== undefined ? forceDecimals : 
                      (scaled >= 100 ? 1 : 2); // $XXX.XM or $XX.XXM
      return `${sign}$${scaled.toFixed(decimals)}M`;
    }
  },
  
  /**
   * CPP-specific money formatting that always uses millions
   * @param {number} value - The value to format
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {string} Formatted currency string in $X.XXM format
   */
  moneyM: function(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0.00M';
    }
    
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const scaled = abs / 1000000;
    
    return `${sign}$${scaled.toFixed(decimals)}M`;
  },

  /**
   * Format percentage with specified decimal places
   * @param {number} value - The decimal value (0.25 = 25%)
   * @param {number} decimals - Number of decimal places (default: 1)
   * @returns {string} Formatted percentage string
   */
  pct: function(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    
    const percentage = value * 100;
    return `${percentage.toFixed(decimals)}%`;
  },
  
  /**
   * CPP-specific percentage formatting for basis points precision
   * @param {number} value - The decimal value (0.2565 = 25.7%)
   * @param {number} decimals - Number of decimal places (default: 1)
   * @returns {string} Formatted percentage string
   */
  pctBps: function(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    
    const percentage = value * 100;
    const rounded = Math.round(percentage * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return `${rounded.toFixed(decimals)}%`;
  },
  
  /**
   * Format multiple with consistent decimal places for valuation
   * @param {number} value - The multiple value (8.5)
   * @param {number} decimals - Number of decimal places (default: 1)
   * @returns {string} Formatted multiple string
   */
  multiple: function(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0×';
    }
    
    return `${value.toFixed(decimals)}×`;
  },

  /**
   * Format integer with thousands separators
   * @param {number} value - The value to format
   * @returns {string} Formatted integer string
   */
  int: function(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    
    return Math.round(value).toLocaleString();
  },

  /**
   * Format number with abbreviations (K, M, B)
   * @param {number} value - The value to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted abbreviated string
   */
  abbr: function(value, options = {}) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const decimals = options.decimals !== undefined ? options.decimals : 'auto';
    
    if (abs < 1000) {
      return `${sign}${abs.toLocaleString()}`;
    } else if (abs < 1000000) {
      const scaled = abs / 1000;
      const dec = decimals === 'auto' ? (scaled >= 100 ? 0 : 1) : decimals;
      return `${sign}${scaled.toFixed(dec)}K`;
    } else if (abs < 1000000000) {
      const scaled = abs / 1000000;
      const dec = decimals === 'auto' ? (scaled >= 100 ? 1 : 2) : decimals;
      return `${sign}${scaled.toFixed(dec)}M`;
    } else {
      const scaled = abs / 1000000000;
      const dec = decimals === 'auto' ? (scaled >= 100 ? 1 : 2) : decimals;
      return `${sign}${scaled.toFixed(dec)}B`;
    }
  },

  /**
   * Format multiple (e.g., 8.5x)
   * @param {number} value - The multiple value
   * @param {number} decimals - Number of decimal places (default: 1)
   * @returns {string} Formatted multiple string
   */
  multiple: function(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0×';
    }
    
    return `${value.toFixed(decimals)}×`;
  },

  /**
   * Format basis points
   * @param {number} value - The value in basis points
   * @returns {string} Formatted basis points string
   */
  bps: function(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0 bps';
    }
    
    return `${Math.round(value)} bps`;
  },

  /**
   * Format decimal as percentage points
   * @param {number} value - The decimal value (0.01 = 100 bps)
   * @param {string} format - 'bps' or 'pct' (default: 'bps')
   * @returns {string} Formatted string
   */
  points: function(value, format = 'bps') {
    if (value === null || value === undefined || isNaN(value)) {
      return format === 'bps' ? '0 bps' : '0.0%';
    }
    
    if (format === 'bps') {
      return this.bps(value * 10000);
    } else {
      return this.pct(value);
    }
  },

  /**
   * Format years
   * @param {number} value - Number of years
   * @param {boolean} short - Use short format (default: false)
   * @returns {string} Formatted years string
   */
  years: function(value, short = false) {
    if (value === null || value === undefined || isNaN(value)) {
      return short ? '0Y' : '0 years';
    }
    
    const rounded = Math.round(value * 10) / 10;
    if (short) {
      return `${rounded}Y`;
    } else {
      return rounded === 1 ? '1 year' : `${rounded} years`;
    }
  },

  /**
   * Safe number parsing with fallback
   * @param {any} value - Value to parse
   * @param {number} fallback - Fallback value (default: 0)
   * @returns {number} Parsed number
   */
  parseNumber: function(value, fallback = 0) {
    if (value === null || value === undefined) {
      return fallback;
    }
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  },

  /**
   * Format table cell based on value type
   * @param {any} value - The value to format
   * @param {string} type - Value type ('currency', 'percent', 'multiple', 'number')
   * @param {object} options - Formatting options
   * @returns {string} Formatted string
   */
  tableCell: function(value, type = 'number', options = {}) {
    switch (type) {
      case 'currency':
      case 'money':
        return this.money(value, options);
      case 'percent':
      case 'pct':
        return this.pct(value, options.decimals);
      case 'multiple':
        return this.multiple(value, options.decimals);
      case 'integer':
      case 'int':
        return this.int(value);
      case 'abbr':
        return this.abbr(value, options);
      default:
        return this.parseNumber(value, 0).toLocaleString();
    }
  },

  /**
   * Create a formatter function with preset options
   * @param {string} type - Formatter type
   * @param {object} options - Default options
   * @returns {function} Formatter function
   */
  create: function(type, options = {}) {
    const self = this;
    return function(value) {
      return self.tableCell(value, type, options);
    };
  },

  /**
   * Validation helpers
   */
  validation: {
    /**
     * Check if value is within tolerance
     * @param {number} actual - Actual value
     * @param {number} expected - Expected value
     * @param {number} tolerance - Tolerance as decimal (0.005 = 0.5%)
     * @returns {object} Validation result
     */
    withinTolerance: function(actual, expected, tolerance = 0.005) {
      if (expected === 0) {
        return {
          ok: Math.abs(actual) <= tolerance,
          diff: Math.abs(actual),
          diffPct: null
        };
      }
      
      const diff = Math.abs(actual - expected);
      const diffPct = diff / Math.abs(expected);
      
      return {
        ok: diffPct <= tolerance,
        diff: diff,
        diffPct: diffPct * 100
      };
    },

    /**
     * Format validation result for display
     * @param {object} result - Validation result from withinTolerance
     * @returns {string} Formatted difference
     */
    formatDiff: function(result) {
      if (result.diffPct === null) {
        return `${result.diff.toFixed(0)}`;
      } else {
        return `${result.diffPct.toFixed(2)}%`;
      }
    }
  }
};

// Expose individual functions for convenience
window.money = window.__FORMAT__.money;
window.pct = window.__FORMAT__.pct;
window.int = window.__FORMAT__.int;
window.abbr = window.__FORMAT__.abbr; 