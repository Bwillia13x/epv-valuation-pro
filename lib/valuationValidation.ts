// Valuation Cross-Validation System
// Implements real-time consistency checks between different valuation methods

import {
  applySmallPracticeSafeguards,
  generateSmallPracticeWarnings,
  validateSmallPracticeInputs,
  calculateSmallPracticeWACC,
} from './smallPracticeSafeguards';
import { validateFinancialInputs, VALIDATION_BOUNDS } from './inputValidation';

export interface ValidationResult {
  isValid: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction?: string;
  values?: {
    calculated: number;
    expected: number;
    variance: number;
  };
}

export interface CrossValidationResults {
  epvConsistency: ValidationResult;
  multipleAlignment: ValidationResult;
  marginChecks: ValidationResult;
  scalingConsistency: ValidationResult;
  methodComparison: ValidationResult;
  smallPracticeChecks: ValidationResult;
  inputValidation: ValidationResult;
  overall: {
    score: number; // 0-100
    status: 'PASS' | 'WARNING' | 'FAIL';
    criticalIssues: number;
  };
}

// Cross-validate EPV calculations between Owner Earnings and NOPAT methods
export function validateEPVConsistency(
  nopatEPV: number,
  ownerEarningsEPV: number,
  capexAsPercentEBITDA: number,
  dnaAsPercentEBITDA: number
): ValidationResult {
  const expectedVariance = Math.abs(capexAsPercentEBITDA - dnaAsPercentEBITDA);
  const actualVariance =
    Math.abs(ownerEarningsEPV - nopatEPV) /
    Math.max(nopatEPV, ownerEarningsEPV);

  if (actualVariance > 0.25) {
    return {
      isValid: false,
      severity: 'critical',
      message: `Extreme EPV variance detected: ${(actualVariance * 100).toFixed(1)}% difference between methods`,
      suggestedAction:
        'Review CapEx and D&A assumptions - variance should not exceed 25%',
      values: {
        calculated: ownerEarningsEPV,
        expected: nopatEPV,
        variance: actualVariance,
      },
    };
  } else if (actualVariance > 0.15) {
    return {
      isValid: false,
      severity: 'high',
      message: `High EPV variance: ${(actualVariance * 100).toFixed(1)}% difference between Owner Earnings and NOPAT methods`,
      suggestedAction:
        'Verify maintenance CapEx calculations and D&A estimates',
      values: {
        calculated: ownerEarningsEPV,
        expected: nopatEPV,
        variance: actualVariance,
      },
    };
  } else if (actualVariance > 0.1) {
    return {
      isValid: true,
      severity: 'medium',
      message: `Moderate EPV variance: ${(actualVariance * 100).toFixed(1)}% difference - within acceptable range`,
      values: {
        calculated: ownerEarningsEPV,
        expected: nopatEPV,
        variance: actualVariance,
      },
    };
  }

  return {
    isValid: true,
    severity: 'low',
    message: `EPV methods are consistent: ${(actualVariance * 100).toFixed(1)}% variance`,
    values: {
      calculated: ownerEarningsEPV,
      expected: nopatEPV,
      variance: actualVariance,
    },
  };
}

// Validate that valuation multiples are within industry benchmarks
export function validateMultipleAlignment(
  enterpriseValue: number,
  adjustedEBITDA: number,
  revenue: number,
  practiceSize: 'small' | 'medium' | 'large'
): ValidationResult {
  const evEBITDAMultiple = enterpriseValue / adjustedEBITDA;
  const evRevenueMultiple = enterpriseValue / revenue;

  // Industry benchmarks for medical aesthetics
  const benchmarks = {
    small: { evEBITDA: [3.5, 5.5], evRevenue: [0.8, 1.4] },
    medium: { evEBITDA: [4.5, 7.0], evRevenue: [1.0, 1.8] },
    large: { evEBITDA: [6.0, 9.0], evRevenue: [1.2, 2.2] },
  };

  const [minEBITDA, maxEBITDA] = benchmarks[practiceSize].evEBITDA;
  const [minRevenue, maxRevenue] = benchmarks[practiceSize].evRevenue;

  // Check EBITDA multiple
  if (
    evEBITDAMultiple < minEBITDA * 0.7 ||
    evEBITDAMultiple > maxEBITDA * 1.3
  ) {
    return {
      isValid: false,
      severity: 'high',
      message: `EV/EBITDA multiple ${evEBITDAMultiple.toFixed(1)}x is outside benchmark range ${minEBITDA.toFixed(1)}x-${maxEBITDA.toFixed(1)}x for ${practiceSize} practices`,
      suggestedAction: 'Review valuation assumptions and EBITDA normalization',
      values: {
        calculated: evEBITDAMultiple,
        expected: (minEBITDA + maxEBITDA) / 2,
        variance:
          Math.abs(evEBITDAMultiple - (minEBITDA + maxEBITDA) / 2) /
          ((minEBITDA + maxEBITDA) / 2),
      },
    };
  }

  // Check Revenue multiple
  if (
    evRevenueMultiple < minRevenue * 0.6 ||
    evRevenueMultiple > maxRevenue * 1.4
  ) {
    return {
      isValid: false,
      severity: 'medium',
      message: `EV/Revenue multiple ${evRevenueMultiple.toFixed(1)}x is outside benchmark range ${minRevenue.toFixed(1)}x-${maxRevenue.toFixed(1)}x`,
      suggestedAction:
        'Consider adjusting valuation or reviewing revenue quality',
      values: {
        calculated: evRevenueMultiple,
        expected: (minRevenue + maxRevenue) / 2,
        variance:
          Math.abs(evRevenueMultiple - (minRevenue + maxRevenue) / 2) /
          ((minRevenue + maxRevenue) / 2),
      },
    };
  }

  return {
    isValid: true,
    severity: 'low',
    message: `Valuation multiples are within industry benchmarks: ${evEBITDAMultiple.toFixed(1)}x EBITDA, ${evRevenueMultiple.toFixed(1)}x Revenue`,
    values: {
      calculated: evEBITDAMultiple,
      expected: (minEBITDA + maxEBITDA) / 2,
      variance: 0,
    },
  };
}

// Validate margin consistency and sustainability
export function validateMarginChecks(
  ebitdaMargin: number,
  grossMargin: number,
  locations: number,
  hasPhysician: boolean
): ValidationResult {
  const expectedEBITDARange = hasPhysician ? [0.15, 0.35] : [0.12, 0.28];
  const expectedGrossRange = [0.75, 0.92];

  // Check EBITDA margin
  if (
    ebitdaMargin < expectedEBITDARange[0] ||
    ebitdaMargin > expectedEBITDARange[1]
  ) {
    return {
      isValid: false,
      severity: ebitdaMargin < 0.08 ? 'critical' : 'high',
      message: `EBITDA margin ${(ebitdaMargin * 100).toFixed(1)}% is ${ebitdaMargin < expectedEBITDARange[0] ? 'below' : 'above'} expected range ${(expectedEBITDARange[0] * 100).toFixed(0)}%-${(expectedEBITDARange[1] * 100).toFixed(0)}%`,
      suggestedAction:
        ebitdaMargin < expectedEBITDARange[0]
          ? 'Review cost structure and operational efficiency'
          : 'Verify margin sustainability and market positioning',
      values: {
        calculated: ebitdaMargin,
        expected: (expectedEBITDARange[0] + expectedEBITDARange[1]) / 2,
        variance: Math.abs(
          ebitdaMargin - (expectedEBITDARange[0] + expectedEBITDARange[1]) / 2
        ),
      },
    };
  }

  // Check gross margin
  if (
    grossMargin < expectedGrossRange[0] ||
    grossMargin > expectedGrossRange[1]
  ) {
    return {
      isValid: false,
      severity: 'medium',
      message: `Gross margin ${(grossMargin * 100).toFixed(1)}% is outside typical range ${(expectedGrossRange[0] * 100).toFixed(0)}%-${(expectedGrossRange[1] * 100).toFixed(0)}%`,
      suggestedAction: 'Review COGS classification and service mix',
      values: {
        calculated: grossMargin,
        expected: (expectedGrossRange[0] + expectedGrossRange[1]) / 2,
        variance: Math.abs(
          grossMargin - (expectedGrossRange[0] + expectedGrossRange[1]) / 2
        ),
      },
    };
  }

  return {
    isValid: true,
    severity: 'low',
    message: `Margins are within expected ranges: ${(ebitdaMargin * 100).toFixed(1)}% EBITDA, ${(grossMargin * 100).toFixed(1)}% Gross`,
  };
}

// Validate scaling assumptions for multi-location practices
export function validateScalingConsistency(
  locations: number,
  totalRevenue: number,
  totalEBITDA: number,
  synergyPercentage: number
): ValidationResult {
  const revenuePerLocation = totalRevenue / locations;
  const ebitdaPerLocation = totalEBITDA / locations;

  // Expected ranges per location
  const expectedRevenueRange = [800000, 4000000]; // $800K - $4M per location
  const expectedEBITDARange = [120000, 1200000]; // $120K - $1.2M per location

  if (
    revenuePerLocation < expectedRevenueRange[0] ||
    revenuePerLocation > expectedRevenueRange[1]
  ) {
    return {
      isValid: false,
      severity: 'high',
      message: `Revenue per location $${(revenuePerLocation / 1000).toFixed(0)}K is outside expected range $${expectedRevenueRange[0] / 1000}K-$${expectedRevenueRange[1] / 1000}K`,
      suggestedAction: 'Review location-level performance assumptions',
      values: {
        calculated: revenuePerLocation,
        expected: (expectedRevenueRange[0] + expectedRevenueRange[1]) / 2,
        variance:
          Math.abs(
            revenuePerLocation -
              (expectedRevenueRange[0] + expectedRevenueRange[1]) / 2
          ) /
          ((expectedRevenueRange[0] + expectedRevenueRange[1]) / 2),
      },
    };
  }

  // Check synergy reasonableness for multi-location
  if (locations > 1 && synergyPercentage > 0.15) {
    return {
      isValid: false,
      severity: 'medium',
      message: `Synergy percentage ${(synergyPercentage * 100).toFixed(1)}% appears aggressive for ${locations} locations`,
      suggestedAction: 'Consider more conservative synergy assumptions',
      values: {
        calculated: synergyPercentage,
        expected: 0.1,
        variance: Math.abs(synergyPercentage - 0.1) / 0.1,
      },
    };
  }

  return {
    isValid: true,
    severity: 'low',
    message: `Scaling assumptions are reasonable: $${(revenuePerLocation / 1000).toFixed(0)}K revenue per location`,
  };
}

// Compare different valuation methods for consistency
export function validateMethodComparison(
  epvValuation: number,
  dcfValuation: number,
  multipleValuation: number
): ValidationResult {
  const values = [epvValuation, dcfValuation, multipleValuation].filter(
    (v) => v > 0
  );
  if (values.length < 2) {
    return {
      isValid: true,
      severity: 'low',
      message: 'Insufficient methods to compare',
    };
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const variance = (maxVal - minVal) / minVal;

  if (variance > 0.5) {
    return {
      isValid: false,
      severity: 'critical',
      message: `Extreme variance between valuation methods: ${(variance * 100).toFixed(0)}% spread`,
      suggestedAction:
        'Review fundamental assumptions - methods should not diverge by more than 50%',
      values: {
        calculated: maxVal,
        expected: minVal,
        variance: variance,
      },
    };
  } else if (variance > 0.3) {
    return {
      isValid: false,
      severity: 'high',
      message: `High variance between valuation methods: ${(variance * 100).toFixed(0)}% spread`,
      suggestedAction:
        'Investigate assumptions driving differences between methods',
      values: {
        calculated: maxVal,
        expected: minVal,
        variance: variance,
      },
    };
  }

  return {
    isValid: true,
    severity: 'low',
    message: `Valuation methods are reasonably consistent: ${(variance * 100).toFixed(0)}% variance`,
    values: {
      calculated: maxVal,
      expected: minVal,
      variance: variance,
    },
  };
}

// Validate small practice specific risks and apply safeguards
export function validateSmallPracticeRisks(
  revenue: number,
  ebitda: number,
  enterpriseValue: number,
  locations: number,
  hasPhysician: boolean
): ValidationResult {
  if (revenue >= 1000000) {
    return {
      isValid: true,
      severity: 'low',
      message: 'Not a small practice - no additional safeguards required',
    };
  }

  const inputValidation = validateSmallPracticeInputs(
    revenue,
    ebitda,
    locations
  );
  const safeguards = applySmallPracticeSafeguards(
    revenue,
    ebitda,
    enterpriseValue,
    locations,
    hasPhysician,
    true
  );

  const evRevenue = enterpriseValue / revenue;
  const evEBITDA = ebitda > 0 ? enterpriseValue / ebitda : 0;

  // Critical issues for small practices
  if (revenue < 250000) {
    return {
      isValid: false,
      severity: 'critical',
      message: `Micro practice ($${(revenue / 1000).toFixed(0)}K revenue) - high valuation uncertainty`,
      suggestedAction:
        'Consider asset-based valuation as primary method. DCF/EPV may not be appropriate.',
      values: {
        calculated: enterpriseValue,
        expected: safeguards.adjustedValuation,
        variance: safeguards.adjustmentMagnitude,
      },
    };
  }

  // High risk for very small practices
  if (revenue < 500000) {
    return {
      isValid: false,
      severity: 'high',
      message: `Very small practice ($${(revenue / 1000).toFixed(0)}K revenue) - significant risk adjustments required`,
      suggestedAction: `Apply ${(safeguards.adjustmentMagnitude * 100).toFixed(0)}% discount for size, marketability, and key person risks`,
      values: {
        calculated: enterpriseValue,
        expected: safeguards.adjustedValuation,
        variance: safeguards.adjustmentMagnitude,
      },
    };
  }

  // Medium risk for small practices
  if (evRevenue > 1.5 || evEBITDA > 5.0) {
    return {
      isValid: false,
      severity: 'medium',
      message: `Small practice with elevated multiples (${evRevenue.toFixed(1)}x revenue, ${evEBITDA.toFixed(1)}x EBITDA)`,
      suggestedAction:
        'Apply small practice discounts and verify earnings sustainability',
      values: {
        calculated: enterpriseValue,
        expected: safeguards.adjustedValuation,
        variance: safeguards.adjustmentMagnitude,
      },
    };
  }

  // General small practice warnings
  if (safeguards.warningFlags.length > 0) {
    return {
      isValid: true,
      severity: 'medium',
      message: `Small practice risks identified: ${safeguards.warningFlags.length} warning(s)`,
      suggestedAction:
        safeguards.recommendedActions[0] ||
        'Review small practice risk factors',
      values: {
        calculated: enterpriseValue,
        expected: safeguards.adjustedValuation,
        variance: safeguards.adjustmentMagnitude,
      },
    };
  }

  return {
    isValid: true,
    severity: 'low',
    message: `Small practice safeguards applied successfully`,
    values: {
      calculated: enterpriseValue,
      expected: safeguards.adjustedValuation,
      variance: safeguards.adjustmentMagnitude,
    },
  };
}

// Enhanced input validation for professional use
export function validateInputBounds(
  revenue: number,
  ebitda: number,
  locations: number,
  grossMargin: number,
  beta: number,
  riskFreeRate: number,
  marketRiskPremium: number
): ValidationResult {
  const validationInputs = {
    totalRevenue: revenue,
    ebitdaMargin: ebitda / revenue,
    locations,
    grossMargin,
    beta,
    riskFreeRate,
    marketRiskPremium,
  };

  const result = validateFinancialInputs(validationInputs);

  if (!result.isValid) {
    return {
      isValid: false,
      severity: 'critical',
      message: `Input validation failed: ${result.errors.length} error(s) found`,
      suggestedAction: result.errors[0]?.message || 'Review input parameters',
      values: {
        calculated: 0,
        expected: 0,
        variance: 0,
      },
    };
  }

  if (result.warnings.length > 0) {
    const criticalWarnings = result.warnings.filter(
      (w) => w.severity === 'warning'
    ).length;

    if (criticalWarnings > 2) {
      return {
        isValid: false,
        severity: 'high',
        message: `Multiple input concerns: ${criticalWarnings} warning(s) require attention`,
        suggestedAction:
          result.suggestions[0] || 'Review highlighted input parameters',
        values: {
          calculated: criticalWarnings,
          expected: 0,
          variance: criticalWarnings / 10,
        },
      };
    } else if (criticalWarnings > 0) {
      return {
        isValid: true,
        severity: 'medium',
        message: `Input validation passed with ${criticalWarnings} warning(s)`,
        suggestedAction:
          result.suggestions[0] || 'Monitor highlighted parameters',
        values: {
          calculated: criticalWarnings,
          expected: 0,
          variance: criticalWarnings / 10,
        },
      };
    }
  }

  return {
    isValid: true,
    severity: 'low',
    message: 'All input parameters within institutional-grade bounds',
  };
}

// Main cross-validation function
export function performCrossValidation(params: {
  // EPV inputs
  nopatEPV: number;
  ownerEarningsEPV: number;
  capexAsPercentEBITDA: number;
  dnaAsPercentEBITDA: number;

  // Valuation inputs
  enterpriseValue: number;
  adjustedEBITDA: number;
  revenue: number;
  practiceSize: 'small' | 'medium' | 'large';

  // Margin inputs
  ebitdaMargin: number;
  grossMargin: number;
  locations: number;
  hasPhysician: boolean;

  // Scaling inputs
  synergyPercentage: number;

  // Method comparison
  epvValuation: number;
  dcfValuation?: number;
  multipleValuation?: number;
}): CrossValidationResults {
  const epvConsistency = validateEPVConsistency(
    params.nopatEPV,
    params.ownerEarningsEPV,
    params.capexAsPercentEBITDA,
    params.dnaAsPercentEBITDA
  );

  const multipleAlignment = validateMultipleAlignment(
    params.enterpriseValue,
    params.adjustedEBITDA,
    params.revenue,
    params.practiceSize
  );

  const marginChecks = validateMarginChecks(
    params.ebitdaMargin,
    params.grossMargin,
    params.locations,
    params.hasPhysician
  );

  const scalingConsistency = validateScalingConsistency(
    params.locations,
    params.revenue,
    params.adjustedEBITDA,
    params.synergyPercentage
  );

  const methodComparison = validateMethodComparison(
    params.epvValuation,
    params.dcfValuation || 0,
    params.multipleValuation || 0
  );

  const smallPracticeChecks = validateSmallPracticeRisks(
    params.revenue,
    params.adjustedEBITDA,
    params.enterpriseValue,
    params.locations,
    params.hasPhysician
  );

  const inputValidation = validateInputBounds(
    params.revenue,
    params.adjustedEBITDA,
    params.locations,
    params.grossMargin,
    1.5, // Use benchmark beta
    0.045, // Use benchmark risk-free rate
    0.065 // Use benchmark market risk premium
  );

  // Calculate overall score
  const checks = [
    epvConsistency,
    multipleAlignment,
    marginChecks,
    scalingConsistency,
    methodComparison,
    smallPracticeChecks,
    inputValidation,
  ];
  const criticalIssues = checks.filter((c) => c.severity === 'critical').length;
  const highIssues = checks.filter((c) => c.severity === 'high').length;
  const mediumIssues = checks.filter((c) => c.severity === 'medium').length;

  let score = 100;
  score -= criticalIssues * 30;
  score -= highIssues * 20;
  score -= mediumIssues * 10;
  score = Math.max(0, score);

  let status: 'PASS' | 'WARNING' | 'FAIL';
  if (criticalIssues > 0 || score < 50) {
    status = 'FAIL';
  } else if (highIssues > 0 || score < 80) {
    status = 'WARNING';
  } else {
    status = 'PASS';
  }

  return {
    epvConsistency,
    multipleAlignment,
    marginChecks,
    scalingConsistency,
    methodComparison,
    smallPracticeChecks,
    inputValidation,
    overall: {
      score,
      status,
      criticalIssues,
    },
  };
}
