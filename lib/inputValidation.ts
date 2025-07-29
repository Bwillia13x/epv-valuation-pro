// Enhanced Input Validation System - Institutional Grade
// Implements comprehensive bounds checking and data quality validation

export interface ValidationBounds {
  min: number;
  max: number;
  warning?: number; // Threshold for warnings
  typical?: readonly [number, number]; // Typical range for guidance
}

export interface ValidationRule {
  field: string;
  bounds: ValidationBounds;
  context: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  suggestions: string[];
}

// Medical Aesthetic Practice Validation Bounds
export const VALIDATION_BOUNDS = {
  // Revenue and Size Metrics
  totalRevenue: {
    min: 50000, // $50K minimum for viable practice
    max: 500000000, // $500M maximum for system precision
    warning: 1000000, // <$1M practices need special attention
    typical: [800000, 15000000] as const, // $800K-$15M typical range
  },

  locations: {
    min: 1,
    max: 500, // Maximum for computational stability
    warning: 1, // Single location needs risk adjustments
    typical: [1, 10] as const,
  },

  // Profitability Metrics
  grossMargin: {
    min: 0.5, // 50% minimum for viable aesthetic practice
    max: 0.95, // 95% maximum realistic
    warning: 0.75, // <75% may indicate operational issues
    typical: [0.78, 0.88] as const,
  },

  ebitdaMargin: {
    min: -0.2, // -20% for distressed situations
    max: 0.5, // 50% maximum sustainable
    warning: 0.12, // <12% below industry norms
    typical: [0.15, 0.32] as const,
  },

  // Growth and Financial Metrics
  revenueGrowthRate: {
    min: -0.5, // -50% for severe decline
    max: 2.0, // 200% maximum for new practices
    warning: 0.5, // >50% growth needs validation
    typical: [0.05, 0.25] as const,
  },

  // WACC Components
  riskFreeRate: {
    min: 0.01, // 1% minimum
    max: 0.08, // 8% maximum
    warning: 0.06, // >6% indicates high rate environment
    typical: [0.025, 0.055] as const,
  },

  marketRiskPremium: {
    min: 0.04, // 4% minimum
    max: 0.12, // 12% maximum
    warning: 0.1, // >10% indicates distressed markets
    typical: [0.055, 0.085] as const,
  },

  beta: {
    min: 0.5, // 0.5 minimum for defensive businesses
    max: 3.0, // 3.0 maximum for high-risk ventures
    warning: 2.0, // >2.0 indicates high volatility
    typical: [1.2, 1.8] as const,
  },

  // CapEx and Investment Metrics
  capexAsPercentRevenue: {
    min: 0.005, // 0.5% minimum maintenance
    max: 0.1, // 10% maximum for growth scenarios
    warning: 0.05, // >5% indicates major investments
    typical: [0.015, 0.03] as const,
  },

  // Working Capital Metrics
  dso: {
    min: 0, // Same-day payment possible
    max: 90, // 90 days maximum for aesthetic practices
    warning: 30, // >30 days indicates collection issues
    typical: [5, 15] as const,
  },

  // Pricing and Service Metrics
  averageServicePrice: {
    min: 50, // $50 minimum service
    max: 50000, // $50K maximum (e.g., surgical procedures)
    warning: 10000, // >$10K services need validation
    typical: [200, 2500] as const,
  },

  // Operational Metrics
  utilizationRate: {
    min: 0.2, // 20% minimum utilization
    max: 1.0, // 100% maximum utilization
    warning: 0.95, // >95% indicates capacity constraints
    typical: [0.75, 0.9] as const,
  },
};

// Comprehensive Input Validation Function
export function validateFinancialInputs(inputs: {
  totalRevenue?: number;
  locations?: number;
  grossMargin?: number;
  ebitdaMargin?: number;
  revenueGrowthRate?: number;
  riskFreeRate?: number;
  marketRiskPremium?: number;
  beta?: number;
  capexAsPercentRevenue?: number;
  dso?: number;
  averageServicePrice?: number;
  utilizationRate?: number;
  [key: string]: any;
}): ValidationResult {
  const errors: ValidationRule[] = [];
  const warnings: ValidationRule[] = [];
  const suggestions: string[] = [];

  // Validate each input against bounds
  Object.entries(inputs).forEach(([field, value]) => {
    if (value === undefined || value === null) return;

    const bounds = VALIDATION_BOUNDS[field as keyof typeof VALIDATION_BOUNDS];
    if (!bounds) return;

    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push({
        field,
        bounds,
        context: 'Data Type',
        severity: 'error',
        message: `${field} must be a valid number`,
      });
      return;
    }

    // Check minimum bounds
    if (numValue < bounds.min) {
      errors.push({
        field,
        bounds,
        context: 'Minimum Bound',
        severity: 'error',
        message: `${field} (${numValue.toLocaleString()}) below minimum allowed (${bounds.min.toLocaleString()})`,
      });
    }

    // Check maximum bounds
    if (numValue > bounds.max) {
      errors.push({
        field,
        bounds,
        context: 'Maximum Bound',
        severity: 'error',
        message: `${field} (${numValue.toLocaleString()}) exceeds maximum allowed (${bounds.max.toLocaleString()})`,
      });
    }

    // Check warning thresholds
    if (bounds.warning !== undefined) {
      if (field === 'totalRevenue' && numValue < bounds.warning) {
        warnings.push({
          field,
          bounds,
          context: 'Small Practice Warning',
          severity: 'warning',
          message: `Small practice (<$1M revenue) - apply enhanced risk adjustments`,
        });
        suggestions.push(
          `Consider asset-based valuation as alternative for ${field}`
        );
      } else if (field === 'ebitdaMargin' && numValue < bounds.warning) {
        warnings.push({
          field,
          bounds,
          context: 'Low Profitability',
          severity: 'warning',
          message: `EBITDA margin ${(numValue * 100).toFixed(1)}% below industry norms`,
        });
        suggestions.push('Review cost structure and operational efficiency');
      } else if (field === 'utilizationRate' && numValue > bounds.warning) {
        warnings.push({
          field,
          bounds,
          context: 'Capacity Constraint',
          severity: 'warning',
          message: `Utilization ${(numValue * 100).toFixed(1)}% indicates potential capacity constraints`,
        });
        suggestions.push(
          'Consider expansion opportunities to capture additional demand'
        );
      }
    }

    // Check typical ranges for guidance
    if (bounds.typical) {
      const [typicalMin, typicalMax] = bounds.typical;
      if (numValue < typicalMin || numValue > typicalMax) {
        warnings.push({
          field,
          bounds,
          context: 'Atypical Value',
          severity: 'info',
          message: `${field} outside typical range (${typicalMin.toLocaleString()}-${typicalMax.toLocaleString()})`,
        });
        suggestions.push(`Verify ${field} against industry benchmarks`);
      }
    }
  });

  // Cross-field validation
  if (inputs.totalRevenue && inputs.ebitdaMargin) {
    const ebitda = inputs.totalRevenue * inputs.ebitdaMargin;
    if (ebitda < 0 && inputs.totalRevenue > 1000000) {
      errors.push({
        field: 'ebitdaMargin',
        bounds: VALIDATION_BOUNDS.ebitdaMargin,
        context: 'Consistency Check',
        severity: 'error',
        message:
          'Large practice with negative EBITDA indicates fundamental issues',
      });
    }
  }

  // Practice size validation
  if (inputs.totalRevenue && inputs.locations) {
    const revenuePerLocation = inputs.totalRevenue / inputs.locations;
    if (revenuePerLocation < 300000) {
      warnings.push({
        field: 'totalRevenue',
        bounds: VALIDATION_BOUNDS.totalRevenue,
        context: 'Location Economics',
        severity: 'warning',
        message: `Revenue per location $${(revenuePerLocation / 1000).toFixed(0)}K below viable threshold`,
      });
      suggestions.push(
        'Consider location consolidation or performance improvement plans'
      );
    }
  }

  // WACC reasonableness check
  if (inputs.riskFreeRate && inputs.marketRiskPremium && inputs.beta) {
    const impliedWACC =
      inputs.riskFreeRate + inputs.beta * inputs.marketRiskPremium;
    if (impliedWACC > 0.25) {
      warnings.push({
        field: 'beta',
        bounds: VALIDATION_BOUNDS.beta,
        context: 'WACC Reasonableness',
        severity: 'warning',
        message: `Implied WACC ${(impliedWACC * 100).toFixed(1)}% extremely high`,
      });
      suggestions.push('Review beta and risk premium assumptions');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

// Specialized validation for small practices
export function validateSmallPracticeInputs(
  revenue: number,
  ebitda: number,
  locations: number
): ValidationResult {
  const errors: ValidationRule[] = [];
  const warnings: ValidationRule[] = [];
  const suggestions: string[] = [];

  if (revenue < 1000000) {
    // Enhanced validation for small practices
    const margin = ebitda / revenue;

    if (margin > 0.4) {
      warnings.push({
        field: 'ebitdaMargin',
        bounds: VALIDATION_BOUNDS.ebitdaMargin,
        context: 'Small Practice Sustainability',
        severity: 'warning',
        message: `EBITDA margin ${(margin * 100).toFixed(1)}% appears unsustainably high for small practice`,
      });
      suggestions.push(
        'Verify normalization adjustments and earnings sustainability'
      );
    }

    if (margin < 0.08) {
      errors.push({
        field: 'ebitdaMargin',
        bounds: VALIDATION_BOUNDS.ebitdaMargin,
        context: 'Viability Concern',
        severity: 'error',
        message: 'EBITDA margin below viable threshold for ongoing operations',
      });
      suggestions.push(
        'Consider asset-based valuation or liquidation analysis'
      );
    }

    const revenuePerLocation = revenue / locations;
    if (revenuePerLocation < 250000) {
      errors.push({
        field: 'totalRevenue',
        bounds: VALIDATION_BOUNDS.totalRevenue,
        context: 'Economic Viability',
        severity: 'error',
        message: 'Revenue per location below economic viability threshold',
      });
      suggestions.push(
        'Review business model sustainability and market position'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

// Real-time validation hook for forms
export function validateInputChange(
  field: string,
  value: any,
  context: Record<string, any> = {}
): {
  isValid: boolean;
  message?: string;
  severity?: 'error' | 'warning' | 'info';
} {
  const bounds = VALIDATION_BOUNDS[field as keyof typeof VALIDATION_BOUNDS];
  if (!bounds) return { isValid: true };

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return {
      isValid: false,
      message: 'Must be a valid number',
      severity: 'error',
    };
  }

  if (numValue < bounds.min) {
    return {
      isValid: false,
      message: `Minimum: ${bounds.min.toLocaleString()}`,
      severity: 'error',
    };
  }

  if (numValue > bounds.max) {
    return {
      isValid: false,
      message: `Maximum: ${bounds.max.toLocaleString()}`,
      severity: 'error',
    };
  }

  if (bounds.warning !== undefined && numValue < bounds.warning) {
    return {
      isValid: true,
      message: 'Below typical range - verify assumptions',
      severity: 'warning',
    };
  }

  return { isValid: true };
}
