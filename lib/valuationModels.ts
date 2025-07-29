// Enhanced valuation helpers with professional risk modeling
// Pure TS (no React / browser refs) so it can run on server or client.

import { PrecisionMath, calculateEPVWithPrecision } from './precisionUtils';

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = clamp((sorted.length - 1) * p, 0, sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const h = idx - lo;
  return sorted[lo] * (1 - h) + sorted[hi] * h;
}

function normal(mean: number, sd: number) {
  // Box-Muller transform
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return (
    mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  );
}

// Enhanced distribution functions
export function triangular(min: number, mode: number, max: number): number {
  // Triangular distribution sampling
  const u = Math.random();
  const f = (mode - min) / (max - min);

  if (u < f) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

// Simple trend-based forecasting with moving average (not true ARIMA)
export function forecastTrendMA(
  values: number[],
  periods: number = 5,
  volatilityScale: number = 0.3
): number[] {
  if (values.length < 2) {
    // Fallback to last value if insufficient data
    return Array(periods).fill(values[values.length - 1] || 0);
  }

  if (values.length < 4) {
    // Simple CAGR for short series
    const cagr =
      Math.pow(values[values.length - 1] / values[0], 1 / (values.length - 1)) -
      1;
    const forecasts = [];
    let lastValue = values[values.length - 1];
    for (let i = 0; i < periods; i++) {
      lastValue *= 1 + cagr;
      forecasts.push(lastValue);
    }
    return forecasts;
  }

  // Enhanced trend analysis with seasonal adjustment
  const n = values.length;
  const weights = values.map((_, i) => i + 1); // Linear weights favoring recent data
  const weightSum = weights.reduce((sum, w) => sum + w, 0);

  // Weighted moving average
  const weightedAvg =
    values.reduce((sum, val, i) => sum + val * weights[i], 0) / weightSum;

  // Trend calculation using linear regression
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }

  const trend = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - trend * xMean;

  // Generate forecasts with trend and variance adjustment
  const forecasts = [];
  const residuals = values.map((val, i) => val - (intercept + trend * i));
  const residualVariance =
    residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2);
  const volatility = Math.sqrt(residualVariance);

  for (let i = 0; i < periods; i++) {
    const trendForecast = intercept + trend * (n + i);
    // Add controlled noise based on historical volatility
    const noise = normal(0, volatility * volatilityScale);
    forecasts.push(Math.max(0, trendForecast + noise));
  }

  return forecasts;
}

// Synergy calculation utilities
export interface SynergyParams {
  method: 'margin_uplift' | 'absolute_savings' | 'hybrid';
  value: number; // Percentage for margin_uplift, dollar amount for absolute_savings
  phaseInMonths?: number; // Optional phase-in period
  locations?: number; // For scaling calculations
}

export function calculateSynergies(
  baseRevenue: number,
  baseEBITDA: number,
  params: SynergyParams
): number {
  let synergy = 0;

  switch (params.method) {
    case 'margin_uplift':
      // Apply margin uplift to revenue
      synergy = baseRevenue * params.value;
      break;
    case 'absolute_savings':
      // Direct cost savings
      synergy = params.value * (params.locations || 1);
      break;
    case 'hybrid':
      // Combination approach: margin uplift + fixed savings
      const marginComponent = baseRevenue * (params.value * 0.6); // 60% from margin
      const fixedComponent = params.value * 0.4 * (params.locations || 1); // 40% fixed
      synergy = marginComponent + fixedComponent;
      break;
  }

  // Apply phase-in adjustment if specified
  if (params.phaseInMonths && params.phaseInMonths < 12) {
    const phaseInFactor = params.phaseInMonths / 12;
    synergy *= phaseInFactor;
  }

  return synergy;
}

export interface MonteCarloEPVInput {
  adjustedEarnings: number; // steady-state Owner Earnings or NOPAT
  wacc: number; // base WACC (decimal)
  totalRevenue: number; // used to scale capex % shocks
  ebitMargin: number; // current margin (for shock sd)
  capexMode: 'percent' | 'amount';
  maintenanceCapexPct: number;
  maintCapex: number; // absolute capex if mode === amount
  da: number; // depreciation & amortisation
  cash: number; // non-operating cash
  debt: number; // interest-bearing debt
  taxRate: number; // decimal
  runs?: number; // default 500
}

// Enhanced Monte Carlo parameters
export interface EnhancedMonteCarloParams {
  // Distribution parameters (min, mode, max) for triangular distributions
  waccTriangular?: [number, number, number];
  exitMultipleTriangular?: [number, number, number];
  revenueGrowthTriangular?: [number, number, number];
  marginTriangular?: [number, number, number];
  // Traditional normal distribution fallbacks
  waccMean?: number;
  waccStd?: number;
  revenueGrowthMean?: number;
  revenueGrowthStd?: number;
  // Valuation approach control
  valuationApproach?: 'perpetuity' | 'multiple';
}

export function runMonteCarloEPV(
  input: MonteCarloEPVInput & { runs?: number } & EnhancedMonteCarloParams
) {
  const R = clamp(input.runs ?? 500, 100, 5000);
  const evDist: number[] = [];
  const eqDist: number[] = [];
  const detailedResults: Array<{
    wacc: number;
    revenue: number;
    margin: number;
    exitMultiple?: number;
    ev: number;
    equity: number;
  }> = [];

  // Pre-compute mean for volatility calculation to avoid O(n²)
  let sumEV = 0;

  for (let i = 0; i < R; i++) {
    // Enhanced WACC sampling with triangular distribution
    let wacc: number;
    if (input.waccTriangular) {
      const [min, mode, max] = input.waccTriangular;
      wacc = clamp(triangular(min, mode, max), 0.03, 0.5);
    } else {
      wacc = clamp(
        normal(input.waccMean || input.wacc, input.waccStd || 0.01),
        0.03,
        0.5
      );
    }

    // Enhanced revenue growth sampling
    let revenueMultiplier: number;
    if (input.revenueGrowthTriangular) {
      const [min, mode, max] = input.revenueGrowthTriangular;
      revenueMultiplier = Math.max(0.3, triangular(min, mode, max));
    } else {
      const growthMean = input.revenueGrowthMean || 1.0;
      const growthStd = input.revenueGrowthStd || 0.15;
      revenueMultiplier = Math.max(0.3, normal(growthMean, growthStd));
    }

    // Enhanced margin sampling
    let margin: number;
    if (input.marginTriangular) {
      const [min, mode, max] = input.marginTriangular;
      margin = clamp(triangular(min, mode, max), 0.05, 0.6);
    } else {
      margin = clamp(normal(input.ebitMargin, 0.02), 0.05, 0.6);
    }

    const rev = input.totalRevenue * revenueMultiplier;
    const ebit = rev * margin;
    const nopat = ebit * (1 - input.taxRate);

    // Enhanced capex modeling - only sample if in percent mode
    const maintCapexPct =
      input.capexMode === 'percent'
        ? clamp(normal(input.maintenanceCapexPct, 0.01), 0.005, 0.2)
        : input.maintenanceCapexPct;

    const maint =
      input.capexMode === 'percent' ? maintCapexPct * rev : input.maintCapex;

    const adj = nopat + input.da - maint;

    // INSTITUTIONAL-GRADE: Enhanced precision valuation approach
    let ev: number;
    const useExitMultiple =
      input.valuationApproach === 'multiple' ||
      (input.valuationApproach === undefined && input.exitMultipleTriangular);

    if (useExitMultiple && input.exitMultipleTriangular) {
      const [min, mode, max] = input.exitMultipleTriangular;
      const exitMultiple = triangular(min, mode, max);
      // Exit multiple on after-tax EBITDA for proper tax treatment
      const finalEBITDA = PrecisionMath.multiply(rev, margin);
      const afterTaxEBITDA = PrecisionMath.multiply(
        finalEBITDA,
        1 - input.taxRate
      );
      ev = PrecisionMath.multiply(afterTaxEBITDA, exitMultiple);
      detailedResults.push({
        wacc,
        revenue: rev,
        margin,
        exitMultiple,
        ev,
        equity: ev + input.cash - input.debt,
      });
    } else {
      // Traditional DCF approach with enhanced precision
      if (wacc > 0) {
        const epvResult = calculateEPVWithPrecision(adj, wacc);
        ev = epvResult.epv;

        // Log precision warnings for large valuations
        if (
          epvResult.precisionMetrics.warnings.length > 0 &&
          Math.abs(adj) > 100000000
        ) {
          console.warn(
            'Large valuation precision warning:',
            epvResult.precisionMetrics.warnings
          );
        }
      } else {
        ev = 0;
      }

      detailedResults.push({
        wacc,
        revenue: rev,
        margin,
        ev,
        equity: ev + input.cash - input.debt,
      });
    }

    const equity = ev + input.cash - input.debt;

    evDist.push(ev);
    eqDist.push(equity);
    sumEV += ev;
  }

  evDist.sort((a, b) => a - b);
  eqDist.sort((a, b) => a - b);

  // INSTITUTIONAL-GRADE: Compute statistics with enhanced precision
  const meanEV = PrecisionMath.divide(sumEV, evDist.length);
  const variance = PrecisionMath.divide(
    PrecisionMath.sum(evDist.map((val) => Math.pow(val - meanEV, 2))),
    evDist.length
  );
  const volatility = Math.sqrt(variance);

  return {
    mean: meanEV,
    median: percentile(evDist, 0.5),
    p5: percentile(evDist, 0.05),
    p10: percentile(evDist, 0.1),
    p25: percentile(evDist, 0.25),
    p75: percentile(evDist, 0.75),
    p90: percentile(evDist, 0.9),
    p95: percentile(evDist, 0.95),
    meanEquity: eqDist.reduce((a, b) => a + b, 0) / eqDist.length,
    p5Equity: percentile(eqDist, 0.05),
    p10Equity: percentile(eqDist, 0.1),
    p25Equity: percentile(eqDist, 0.25),
    p75Equity: percentile(eqDist, 0.75),
    p90Equity: percentile(eqDist, 0.9),
    p95Equity: percentile(eqDist, 0.95),
    // Enhanced analytics
    volatility,
    detailedResults: detailedResults.slice(0, 100), // Sample for analysis
    rawResults: { evDist, eqDist },
  };
}
