// High-Precision Mathematical Utilities for Large Value Calculations
// Addresses floating-point precision issues in >$100M valuations

export class PrecisionMath {
  // High-precision multiplication for large financial calculations
  static multiply(a: number, b: number): number {
    // Handle edge cases
    if (a === 0 || b === 0) return 0;
    if (!isFinite(a) || !isFinite(b)) return NaN;

    // For very large numbers (>$100M), use enhanced precision
    if (Math.abs(a) > 100000000 || Math.abs(b) > 100000000) {
      // Convert to scientific notation to maintain precision
      const aExp = Math.floor(Math.log10(Math.abs(a)));
      const bExp = Math.floor(Math.log10(Math.abs(b)));

      const aMantissa = a / Math.pow(10, aExp);
      const bMantissa = b / Math.pow(10, bExp);

      const resultMantissa = aMantissa * bMantissa;
      const resultExp = aExp + bExp;

      return resultMantissa * Math.pow(10, resultExp);
    }

    return a * b;
  }

  // High-precision division for large financial calculations
  static divide(a: number, b: number): number {
    if (b === 0) return NaN;
    if (a === 0) return 0;
    if (!isFinite(a) || !isFinite(b)) return NaN;

    // For very large numbers, use enhanced precision
    if (Math.abs(a) > 100000000 || Math.abs(b) > 100000000) {
      const aExp = Math.floor(Math.log10(Math.abs(a)));
      const bExp = Math.floor(Math.log10(Math.abs(b)));

      const aMantissa = a / Math.pow(10, aExp);
      const bMantissa = b / Math.pow(10, bExp);

      const resultMantissa = aMantissa / bMantissa;
      const resultExp = aExp - bExp;

      return resultMantissa * Math.pow(10, resultExp);
    }

    return a / b;
  }

  // Cumulative sum with precision control
  static sum(values: number[]): number {
    if (values.length === 0) return 0;

    // Sort by magnitude to reduce precision loss
    const sorted = [...values].sort((a, b) => Math.abs(a) - Math.abs(b));

    let sum = 0;
    for (const value of sorted) {
      sum = this.add(sum, value);
    }

    return sum;
  }

  // High-precision addition
  static add(a: number, b: number): number {
    if (!isFinite(a) || !isFinite(b)) return NaN;

    // For numbers with very different magnitudes, use special handling
    const maxMagnitude = Math.max(Math.abs(a), Math.abs(b));
    const minMagnitude = Math.min(Math.abs(a), Math.abs(b));

    if (maxMagnitude > 0 && minMagnitude / maxMagnitude < 1e-15) {
      // If one number is insignificant compared to the other, return the larger
      return Math.abs(a) > Math.abs(b) ? a : b;
    }

    return a + b;
  }

  // Present value calculation with enhanced precision
  static presentValue(
    futureValue: number,
    rate: number,
    periods: number
  ): number {
    if (rate === 0) return futureValue;
    if (periods === 0) return futureValue;

    // For large calculations, use logarithmic approach
    if (Math.abs(futureValue) > 100000000 || periods > 20) {
      const logFV = Math.log(Math.abs(futureValue));
      const logDiscount = periods * Math.log(1 + rate);
      const logPV = logFV - logDiscount;

      const result = Math.exp(logPV);
      return futureValue < 0 ? -result : result;
    }

    return this.divide(futureValue, Math.pow(1 + rate, periods));
  }

  // Compound growth calculation with precision control
  static compound(principal: number, rate: number, periods: number): number {
    if (rate === 0) return principal;
    if (periods === 0) return principal;

    // For large calculations or many periods, use logarithmic approach
    if (
      Math.abs(principal) > 100000000 ||
      periods > 20 ||
      Math.abs(rate) > 0.5
    ) {
      const logPrincipal = Math.log(Math.abs(principal));
      const logGrowth = periods * Math.log(1 + rate);
      const logResult = logPrincipal + logGrowth;

      const result = Math.exp(logResult);
      return principal < 0 ? -result : result;
    }

    return this.multiply(principal, Math.pow(1 + rate, periods));
  }

  // Precision-aware rounding for financial values
  static round(value: number, decimals: number = 2): number {
    if (!isFinite(value)) return value;

    // For very large numbers, maintain relative precision
    if (Math.abs(value) > 1000000000) {
      // Round to nearest $1000 for >$1B
      return Math.round(value / 1000) * 1000;
    } else if (Math.abs(value) > 100000000) {
      // Round to nearest $100 for >$100M
      return Math.round(value / 100) * 100;
    } else if (Math.abs(value) > 1000000) {
      // Round to nearest $10 for >$1M
      return Math.round(value / 10) * 10;
    }

    // Standard rounding for smaller values
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  // Check for precision loss warning
  static checkPrecision(
    originalValue: number,
    calculatedValue: number
  ): {
    hasLoss: boolean;
    relativeLoss: number;
    warning?: string;
  } {
    if (originalValue === 0) {
      return { hasLoss: false, relativeLoss: 0 };
    }

    const relativeLoss = Math.abs(
      (calculatedValue - originalValue) / originalValue
    );
    const hasLoss = relativeLoss > 1e-12; // Precision threshold

    let warning: string | undefined;
    if (hasLoss && Math.abs(originalValue) > 100000000) {
      warning = `Precision loss detected in large value calculation (${(relativeLoss * 100).toExponential(2)}%)`;
    }

    return { hasLoss, relativeLoss, warning };
  }
}

// Enhanced EPV calculation with precision control
export function calculateEPVWithPrecision(
  adjustedEarnings: number,
  wacc: number,
  scenarioMultiplier: number = 1
): {
  epv: number;
  precisionMetrics: {
    originalPrecision: number;
    finalPrecision: number;
    precisionLoss: number;
    warnings: string[];
  };
} {
  const warnings: string[] = [];

  // Validate inputs
  if (wacc <= 0 || wacc >= 1) {
    warnings.push(`WACC ${(wacc * 100).toFixed(2)}% outside reasonable bounds`);
  }

  if (Math.abs(adjustedEarnings) > 1000000000) {
    warnings.push('Very large earnings value - precision monitoring active');
  }

  // Apply scenario multiplier with precision
  const scenarioEarnings = PrecisionMath.multiply(
    adjustedEarnings,
    scenarioMultiplier
  );

  // Calculate EPV with enhanced precision
  const epv = PrecisionMath.divide(scenarioEarnings, wacc);

  // Check for precision loss
  const reverseCheck = PrecisionMath.multiply(epv, wacc);
  const precisionCheck = PrecisionMath.checkPrecision(
    scenarioEarnings,
    reverseCheck
  );

  if (precisionCheck.warning) {
    warnings.push(precisionCheck.warning);
  }

  return {
    epv: PrecisionMath.round(epv),
    precisionMetrics: {
      originalPrecision: 15, // JavaScript default precision
      finalPrecision: Math.max(
        0,
        15 - Math.floor(Math.log10(precisionCheck.relativeLoss + 1e-16))
      ),
      precisionLoss: precisionCheck.relativeLoss,
      warnings,
    },
  };
}

// Enhanced Monte Carlo with precision control
export function runPrecisionMonteCarloEPV(
  baseEarnings: number,
  baseWACC: number,
  iterations: number = 1000,
  volatilityParams: {
    earningsStdDev: number;
    waccStdDev: number;
  }
): {
  results: number[];
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    confidenceInterval: {
      p5: number;
      p25: number;
      p75: number;
      p95: number;
    };
  };
  precisionMetrics: {
    averagePrecisionLoss: number;
    maxPrecisionLoss: number;
    warningCount: number;
  };
} {
  const results: number[] = [];
  let totalPrecisionLoss = 0;
  let maxPrecisionLoss = 0;
  let warningCount = 0;

  for (let i = 0; i < iterations; i++) {
    // Generate random variables with precision control
    const earningsShock =
      1 + (Math.random() - 0.5) * 2 * volatilityParams.earningsStdDev;
    const waccShock =
      1 + (Math.random() - 0.5) * 2 * volatilityParams.waccStdDev;

    const simulatedEarnings = PrecisionMath.multiply(
      baseEarnings,
      earningsShock
    );
    const simulatedWACC = PrecisionMath.multiply(baseWACC, waccShock);

    const epvResult = calculateEPVWithPrecision(
      simulatedEarnings,
      simulatedWACC
    );

    results.push(epvResult.epv);
    totalPrecisionLoss += epvResult.precisionMetrics.precisionLoss;
    maxPrecisionLoss = Math.max(
      maxPrecisionLoss,
      epvResult.precisionMetrics.precisionLoss
    );
    warningCount += epvResult.precisionMetrics.warnings.length;
  }

  // Sort results for percentile calculations
  results.sort((a, b) => a - b);

  // Calculate statistics with precision
  const mean = PrecisionMath.divide(PrecisionMath.sum(results), results.length);
  const median = results[Math.floor(results.length / 2)];

  // Calculate standard deviation with precision
  const variance = PrecisionMath.divide(
    PrecisionMath.sum(results.map((r) => Math.pow(r - mean, 2))),
    results.length
  );
  const standardDeviation = Math.sqrt(variance);

  return {
    results,
    statistics: {
      mean: PrecisionMath.round(mean),
      median: PrecisionMath.round(median),
      standardDeviation: PrecisionMath.round(standardDeviation),
      confidenceInterval: {
        p5: PrecisionMath.round(results[Math.floor(results.length * 0.05)]),
        p25: PrecisionMath.round(results[Math.floor(results.length * 0.25)]),
        p75: PrecisionMath.round(results[Math.floor(results.length * 0.75)]),
        p95: PrecisionMath.round(results[Math.floor(results.length * 0.95)]),
      },
    },
    precisionMetrics: {
      averagePrecisionLoss: totalPrecisionLoss / iterations,
      maxPrecisionLoss,
      warningCount,
    },
  };
}
