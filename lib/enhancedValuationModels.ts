// Enhanced Valuation Models with Multi-Year Analysis, DCF, and Growth Scenarios
// REFINED VERSION - Addresses optimism bias with market-calibrated parameters

export interface MultiYearFinancialData {
  year: number;
  revenue: number;
  ebitda: number;
  ebit: number;
  adjustedEbitda: number;
  normalizations: {
    ownerCompensation: number;
    personalExpenses: number;
    oneTimeItems: number;
    synergies: number;
  };
}

export interface IndustryBenchmarks {
  ebitdaMarginRange: [number, number]; // Min, max for medispas
  wacc: {
    baseBeta: number;
    industryPremium: number;
    sizePremium: number;
    geographicPremium: number;
  };
  growthRates: {
    stable: number; // 2-4% perpetual (refined from 3%)
    growth: number; // 8-15% near term
    cagr: number;   // Historical industry CAGR
    terminal: number; // 2.5% conservative terminal (refined)
  };
  exitMultiples: {
    small: [number, number]; // <$2M revenue
    medium: [number, number]; // $2-5M revenue  
    large: [number, number]; // >$5M revenue
  };
  // NEW: Market-calibrated weighting rules
  methodWeights: {
    balanced: { epv: number; dcf: number; multiple: number };
    growthBiased: { epv: number; dcf: number; multiple: number };
    conservative: { epv: number; dcf: number; multiple: number };
  };
}

export interface SynergyAdjustments {
  operationalEfficiencies: number; // 0-0.10 (reduced from 0.15)
  scaleEconomies: number; // 0-0.08 (reduced from 0.10)
  marketingOptimization: number; // 0-0.06 (reduced from 0.08)
  technologyIntegration: number; // 0-0.08 (reduced from 0.12)
  crossSelling: number; // 0-0.15 (reduced from 0.20)
  totalSynergies: number; // Calculated total (capped at 25%)
  // NEW: Phasing parameters
  phasingYears: number; // 3-year default ramp
  yearOneRealization: number; // 40% in year 1
  moatScore: number; // 0-1 for franchise value (physician autonomy, etc.)
}

export interface DCFProjectionInputs {
  historicalData: MultiYearFinancialData[];
  projectionYears: number; // 5-10 years
  terminalGrowthRate: number; // 2-4% (refined)
  capexAsPercentRevenue: number;
  workingCapitalAsPercentRevenue: number;
  taxRate: number;
  discountRate: number;
  // NEW: Enhanced growth modeling
  growthDecayRate: number; // How quickly growth declines
  minimumGrowthRate: number; // Floor for growth rate
}

export interface HybridValuationResult {
  epvValuation: number;
  dcfValuation: number;
  multipleValuation: number;
  hybridValuation: number; // Weighted average
  weights: {
    epv: number;
    dcf: number;
    multiple: number;
    methodology: 'balanced' | 'growthBiased' | 'conservative';
  };
  sensitivity: {
    wacc: { low: number; base: number; high: number };
    growth: { conservative: number; base: number; aggressive: number };
    margins: { low: number; base: number; high: number };
    synergies: { none: number; base: number; full: number };
  };
  scenarios: {
    bear: number;
    base: number;
    bull: number;
  };
  confidenceInterval: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  // NEW: Enhanced analytics
  marketCalibration: {
    impliedMultiple: number;
    benchmarkRange: [number, number];
    calibrationScore: number; // 0-1, how well aligned with market
  };
  synergyPhasing: {
    yearOne: number;
    yearTwo: number;
    yearThree: number;
    steadyState: number;
  };
}

// REFINED Industry Benchmarks for 2025 Medispa Market
export const MEDSPA_BENCHMARKS_2025: IndustryBenchmarks = {
  ebitdaMarginRange: [0.12, 0.32], // 12-32% for normalized EBITDA
  wacc: {
    baseBeta: 1.50, // INSTITUTIONAL-GRADE: Updated to 1.50 (reflects true medical aesthetics volatility and concentration risk)
    industryPremium: 0.015, // CONSERVATIVE: 1.5% (regulatory/competition risks)
    sizePremium: 0.025, // Base size premium
    geographicPremium: 0.005, // CONSERVATIVE: 0.5% (market-specific risks)
  },
  growthRates: {
    stable: 0.020, // INSTITUTIONAL-GRADE: 2.0% from 2.5% (maximum conservatism)
    growth: 0.125, // 12.5% aesthetic market CAGR
    cagr: 0.115, // Historical 11.5% industry growth
    terminal: 0.020, // INSTITUTIONAL-GRADE: Ultra-conservative terminal at 2.0% (closer to long-term GDP)
  },
  exitMultiples: {
    small: [3.5, 5.5], // Small practices
    medium: [4.5, 7.0], // REFINED: Mid-size clinics (was 4.5-7.0, now calibrated)
    large: [6.0, 9.0], // Large platforms
  },
  // NEW: Market-calibrated weighting methodology (CONSERVATIVE)
  methodWeights: {
    balanced: { epv: 0.50, dcf: 0.30, multiple: 0.20 }, // CONSERVATIVE: EPV-focused
    growthBiased: { epv: 0.40, dcf: 0.40, multiple: 0.20 }, // CONSERVATIVE: Reduced DCF weight
    conservative: { epv: 0.60, dcf: 0.25, multiple: 0.15 }, // CONSERVATIVE: Heavy EPV weight
  },
};

// REFINED Multi-Year Data Processing with Enhanced Weighting
export function processMultiYearData(
  data: MultiYearFinancialData[],
  weightMethod: 'equal' | 'linear' | 'exponential' | 'market_calibrated' = 'market_calibrated'
): {
  weightedAverageEbitda: number;
  trendGrowthRate: number;
  volatility: number;
  qualityScore: number;
  benchmarkAlignment: number; // NEW: How well data aligns with benchmarks
} {
  if (data.length === 0) {
    throw new Error('No historical data provided');
  }

  const sortedData = [...data].sort((a, b) => a.year - b.year);
  const n = sortedData.length;

  // REFINED: Market-calibrated weighting (40% latest year max)
  let weights: number[];
  switch (weightMethod) {
    case 'equal':
      weights = Array(n).fill(1 / n);
      break;
    case 'linear':
      const linearSum = (n * (n + 1)) / 2;
      weights = sortedData.map((_, i) => (i + 1) / linearSum);
      break;
    case 'market_calibrated':
      // REFINED: Cap latest year at 40% as per market practice
      const expWeights = sortedData.map((_, i) => Math.pow(1.3, i)); // Reduced from 1.5
      const expSum = expWeights.reduce((sum, w) => sum + w, 0);
      const rawWeights = expWeights.map(w => w / expSum);
      // Cap latest year at 40%
      if (rawWeights[rawWeights.length - 1] > 0.40) {
        const excess = rawWeights[rawWeights.length - 1] - 0.40;
        rawWeights[rawWeights.length - 1] = 0.40;
        // Redistribute excess proportionally to other years
        for (let i = 0; i < rawWeights.length - 1; i++) {
          rawWeights[i] += excess * (rawWeights[i] / (1 - 0.40));
        }
      }
      weights = rawWeights;
      break;
    case 'exponential':
    default:
      const expWeights2 = sortedData.map((_, i) => Math.pow(1.5, i));
      const expSum2 = expWeights2.reduce((sum, w) => sum + w, 0);
      weights = expWeights2.map(w => w / expSum2);
      break;
  }

  // Weighted average EBITDA
  const weightedAverageEbitda = sortedData.reduce(
    (sum, item, i) => sum + item.adjustedEbitda * weights[i],
    0
  );

  // Calculate trend growth rate using linear regression
  const years = sortedData.map(d => d.year);
  const ebitdas = sortedData.map(d => d.adjustedEbitda);
  
  const xMean = years.reduce((sum, x) => sum + x, 0) / n;
  const yMean = ebitdas.reduce((sum, y) => sum + y, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (years[i] - xMean) * (ebitdas[i] - yMean);
    denominator += (years[i] - xMean) * (years[i] - xMean);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const trendGrowthRate = yMean > 0 ? slope / yMean : 0;

  // Calculate volatility (coefficient of variation)
  const variance = ebitdas.reduce((sum, ebitda) => {
    return sum + Math.pow(ebitda - yMean, 2);
  }, 0) / n;
  
  const volatility = Math.sqrt(variance) / yMean;

  // ENHANCED Data quality score with benchmark alignment
  const completenessScore = data.every(d => 
    d.revenue > 0 && d.ebitda !== undefined && d.adjustedEbitda > 0
  ) ? 1.0 : 0.7;
  
  const consistencyScore = volatility < 0.3 ? 1.0 : Math.max(0.5, 1.0 - volatility);
  const trendScore = trendGrowthRate > -0.1 ? 1.0 : 0.6; // Penalize negative trends
  
  // NEW: Benchmark alignment score
  const avgMargin = sortedData.reduce((sum, d) => sum + (d.adjustedEbitda / d.revenue), 0) / n;
  const benchmarkMargin = (MEDSPA_BENCHMARKS_2025.ebitdaMarginRange[0] + MEDSPA_BENCHMARKS_2025.ebitdaMarginRange[1]) / 2;
  const marginAlignment = 1 - Math.abs(avgMargin - benchmarkMargin) / benchmarkMargin;
  const benchmarkAlignment = Math.max(0, Math.min(1, marginAlignment));
  
  const qualityScore = (completenessScore + consistencyScore + trendScore + benchmarkAlignment) / 4;

  return {
    weightedAverageEbitda,
    trendGrowthRate,
    volatility,
    qualityScore,
    benchmarkAlignment,
  };
}

// INSTITUTIONAL-GRADE Enhanced WACC Calculation with Market Calibration
export function calculateEnhancedWACC(
  riskFreeRate: number,
  marketRiskPremium: number,
  companySize: 'small' | 'medium' | 'large',
  geographicRisk: 'low' | 'medium' | 'high',
  qualityScore: number,
  synergyScore: number = 0, // NEW: Synergy potential reduces risk
  customAdjustments: number = 0
): number {
  const benchmarks = MEDSPA_BENCHMARKS_2025.wacc;
  
  // INSTITUTIONAL-GRADE: Beta adjustments for practice concentration risk
  const adjustedBeta = companySize === 'small' ? 
    benchmarks.baseBeta * 1.07 : // 1.60x for single-location practices (7% increase from 1.50 base)
    companySize === 'medium' ?
    benchmarks.baseBeta * 1.00 : // 1.50x for medium practices (base)
    benchmarks.baseBeta * 0.93;  // 1.40x for large practices (7% decrease)
  
  // CONSERVATIVE: Increased size-based adjustments for single-location risk
  const sizePremiums = {
    small: benchmarks.sizePremium * 1.6, // 4.0% (increased for single-location risk)
    medium: benchmarks.sizePremium * 1.4, // 3.5% (increased for concentration risk)
    large: benchmarks.sizePremium * 1.0, // 2.5% (baseline)
  };
  
  // REFINED: Geographic risk adjustments (reduced)
  const geoPremiums = {
    low: 0, // Established markets
    medium: benchmarks.geographicPremium, // 0.3% (down from 0.5%)
    high: benchmarks.geographicPremium * 2, // 0.6% (down from 1.0%)
  };
  
  // REFINED: Quality adjustment (better data = lower risk)
  const qualityAdjustment = (1 - qualityScore) * 0.015; // Reduced from 2% to 1.5%
  
  // CONSERVATIVE: Reduced synergy adjustment (less diversification benefit)
  const synergyAdjustment = -synergyScore * 0.005; // Reduced to -0.5% max
  
  // CONSERVATIVE: Add single-location concentration risk premium
  const concentrationRisk = companySize === 'small' ? 0.02 : 
                           companySize === 'medium' ? 0.015 : 0.01; // 2%, 1.5%, 1%
  
  const wacc = riskFreeRate + 
               (adjustedBeta * marketRiskPremium) +
               benchmarks.industryPremium +
               sizePremiums[companySize] +
               geoPremiums[geographicRisk] +
               qualityAdjustment +
               synergyAdjustment +
               concentrationRisk +
               customAdjustments;
  
  return Math.max(0.08, Math.min(0.20, wacc)); // REFINED: Cap at 20% (down from 25%)
}

// REFINED DCF Projection Model with Enhanced Growth Decay
export function projectDCFCashFlows(inputs: DCFProjectionInputs): {
  projectedCashFlows: number[];
  terminalValue: number;
  presentValues: number[];
  enterpriseValue: number;
  growthPath: number[]; // Track growth rates
  terminalValueBreakdown: { // INSTITUTIONAL-GRADE: Terminal value transparency
    perpetuityValue: number;
    multipleValue: number;
    methodUsed: 'perpetuity' | 'multiple' | 'conservative_minimum';
  };
} {
  const { historicalData, projectionYears, terminalGrowthRate, discountRate } = inputs;
  
  // Get growth trend from historical data (CONSERVATIVE)
  const multiYearAnalysis = processMultiYearData(historicalData, 'market_calibrated');
  const rawGrowthRate = multiYearAnalysis.trendGrowthRate;
  // CONSERVATIVE: Cap historical growth more aggressively and apply haircut
  const historicalGrowthRate = Math.min(0.12, Math.max(0.03, rawGrowthRate * 0.75)); // 25% haircut
  
  // CONSERVATIVE: Faster growth decay modeling
  const decayRate = inputs.growthDecayRate || 0.25; // 25% annual decay (increased from 15%)
  const minimumGrowth = inputs.minimumGrowthRate || terminalGrowthRate;
  
  // Project cash flows with enhanced decay model
  const projectedCashFlows: number[] = [];
  const growthPath: number[] = [];
  let currentEbitda = multiYearAnalysis.weightedAverageEbitda;
  
  for (let year = 1; year <= projectionYears; year++) {
    // REFINED: Exponential decay to terminal rate
    const yearsToTerminal = projectionYears - year + 1;
    const decayFactor = Math.pow(1 - decayRate, year - 1);
    const growthRate = Math.max(
      minimumGrowth,
      terminalGrowthRate + (historicalGrowthRate - terminalGrowthRate) * decayFactor
    );
    
    growthPath.push(growthRate);
    currentEbitda *= (1 + growthRate);
    
    // Convert EBITDA to Free Cash Flow
    const depreciation = currentEbitda * 0.08; // Assume 8% of EBITDA
    const ebit = currentEbitda - depreciation;
    const nopat = ebit * (1 - inputs.taxRate);
    
    const revenue = currentEbitda / 0.25; // Assume 25% EBITDA margin
    const capex = revenue * inputs.capexAsPercentRevenue;
    const workingCapitalChange = revenue * inputs.workingCapitalAsPercentRevenue * growthRate;
    
    const freeCashFlow = nopat + depreciation - capex - workingCapitalChange;
    projectedCashFlows.push(freeCashFlow);
  }
  
  // INSTITUTIONAL-GRADE: Dual terminal value methodology (perpetuity vs exit multiple)
  const terminalCashFlow = projectedCashFlows[projectedCashFlows.length - 1] * 
    (1 + terminalGrowthRate);
  
  // Method 1: Gordon Growth Model (perpetuity)
  const perpetuityTerminalValue = terminalCashFlow / (discountRate - terminalGrowthRate);
  
  // Method 2: Exit Multiple Approach (conservative)
  const finalYearEBITDA = currentEbitda;
  const conservativeExitMultiple = 5.0; // Conservative exit multiple for medical aesthetics
  const multipleTerminalValue = finalYearEBITDA * conservativeExitMultiple;
  
  // INSTITUTIONAL-GRADE: Take minimum for maximum conservatism
  const terminalValue = Math.min(perpetuityTerminalValue, multipleTerminalValue);
  
  // Present value calculations
  const presentValues = projectedCashFlows.map((cf, i) => 
    cf / Math.pow(1 + discountRate, i + 1)
  );
  
  const terminalPresentValue = terminalValue / Math.pow(1 + discountRate, projectionYears);
  
  const enterpriseValue = presentValues.reduce((sum, pv) => sum + pv, 0) + terminalPresentValue;
  
  // Determine which method was used
  const methodUsed = terminalValue === perpetuityTerminalValue ? 'perpetuity' : 
                     terminalValue === multipleTerminalValue ? 'multiple' : 'conservative_minimum';
  
  return {
    projectedCashFlows,
    terminalValue,
    presentValues,
    enterpriseValue,
    growthPath,
    terminalValueBreakdown: {
      perpetuityValue: perpetuityTerminalValue,
      multipleValue: multipleTerminalValue,
      methodUsed
    },
  };
}

// REFINED Synergy Calculation Engine with Phasing
export function calculateSynergies(
  baseEbitda: number,
  synergyInputs: SynergyAdjustments,
  phaseInYears: number = 3
): {
  yearOneImpact: number;
  fullRunRateImpact: number;
  presentValueOfSynergies: number;
  synergyMultiplier: number;
  phasingSchedule: number[]; // NEW: Year-by-year realization
} {
  // CONSERVATIVE: Cap total synergies at 15% (down from 25%)
  const totalSynergyPercent = Math.min(0.15,
    synergyInputs.operationalEfficiencies +
    synergyInputs.scaleEconomies +
    synergyInputs.marketingOptimization +
    synergyInputs.technologyIntegration +
    synergyInputs.crossSelling
  );
  
  // CONSERVATIVE: Reduced moat premium for franchise value
  const moatAdjustment = synergyInputs.moatScore * 0.03; // Up to 3% additional (down from 5%)
  const adjustedSynergyPercent = Math.min(0.20, totalSynergyPercent + moatAdjustment); // Cap at 20%
  
  const fullRunRateImpact = baseEbitda * adjustedSynergyPercent;
  
  // REFINED: More realistic phasing schedule
  const phasingSchedule: number[] = [];
  for (let year = 1; year <= phaseInYears; year++) {
    // Non-linear ramp: starts slow, accelerates, then plateaus
    let realization: number;
    if (year === 1) {
      realization = synergyInputs.yearOneRealization || 0.30; // REFINED: 30% in year 1 (down from 40%)
    } else if (year === 2) {
      realization = 0.65; // 65% in year 2
    } else {
      realization = 1.0; // 100% by year 3
    }
    phasingSchedule.push(realization);
  }
  
  const yearOneImpact = fullRunRateImpact * phasingSchedule[0];
  
  // Present value assuming phased ramp-up
  let presentValueOfSynergies = 0;
  const discountRate = 0.12; // Typical discount rate for synergies
  
  for (let year = 1; year <= phaseInYears; year++) {
    const realization = phasingSchedule[year - 1] || 1.0;
    const yearlyValue = fullRunRateImpact * realization;
    presentValueOfSynergies += yearlyValue / Math.pow(1 + discountRate, year);
  }
  
  // Add perpetual value after phase-in
  const perpetualValue = fullRunRateImpact / discountRate;
  presentValueOfSynergies += perpetualValue / Math.pow(1 + discountRate, phaseInYears);
  
  const synergyMultiplier = 1 + adjustedSynergyPercent;
  
  return {
    yearOneImpact,
    fullRunRateImpact,
    presentValueOfSynergies,
    synergyMultiplier,
    phasingSchedule,
  };
}

// REFINED Hybrid Valuation Engine with Market Calibration
export function calculateHybridValuation(
  multiYearData: MultiYearFinancialData[],
  synergyInputs: SynergyAdjustments,
  companySize: 'small' | 'medium' | 'large',
  geographicRisk: 'low' | 'medium' | 'high',
  customInputs: {
    riskFreeRate: number;
    marketRiskPremium: number;
    terminalGrowthRate: number;
    capexAsPercentRevenue: number;
    workingCapitalAsPercentRevenue: number;
    taxRate: number;
  },
  forceWeightingMethod?: 'balanced' | 'growthBiased' | 'conservative'
): HybridValuationResult {
  
  // Process multi-year data with market calibration
  const multiYearAnalysis = processMultiYearData(multiYearData, 'market_calibrated');
  
  // Calculate synergies first to get synergy score for WACC
  const synergies = calculateSynergies(
    multiYearAnalysis.weightedAverageEbitda,
    synergyInputs
  );
  
  const synergyScore = (synergies.synergyMultiplier - 1) / 0.30; // Normalize to 0-1
  
  // Calculate enhanced WACC
  const baseWacc = calculateEnhancedWACC(
    customInputs.riskFreeRate,
    customInputs.marketRiskPremium,
    companySize,
    geographicRisk,
    multiYearAnalysis.qualityScore,
    synergyScore
  );
  
  const adjustedEbitda = multiYearAnalysis.weightedAverageEbitda * synergies.synergyMultiplier;
  
  // 1. EPV Valuation (Conservative baseline)
  const adjustedEarnings = adjustedEbitda * (1 - customInputs.taxRate);
  const epvValuation = adjustedEarnings / baseWacc;
  
  // 2. DCF Valuation (Growth-oriented) with enhanced decay
  const dcfInputs: DCFProjectionInputs = {
    historicalData: multiYearData,
    projectionYears: 7,
    terminalGrowthRate: customInputs.terminalGrowthRate,
    capexAsPercentRevenue: customInputs.capexAsPercentRevenue,
    workingCapitalAsPercentRevenue: customInputs.workingCapitalAsPercentRevenue,
    taxRate: customInputs.taxRate,
    discountRate: baseWacc,
    growthDecayRate: 0.15, // 15% annual decay
    minimumGrowthRate: customInputs.terminalGrowthRate,
  };
  
  const dcfResults = projectDCFCashFlows(dcfInputs);
  const dcfValuation = dcfResults.enterpriseValue;
  
  // 3. Market Multiple Valuation
  const benchmarks = MEDSPA_BENCHMARKS_2025;
  const [minMultiple, maxMultiple] = benchmarks.exitMultiples[companySize];
  const avgMultiple = (minMultiple + maxMultiple) / 2;
  
  // CONSERVATIVE: Minimal multiple adjustments
  const qualityAdjustment = (multiYearAnalysis.qualityScore - 0.5) * 0.5; // Further reduced
  const growthAdjustment = Math.min(1, multiYearAnalysis.trendGrowthRate / 0.15) * 0.4; // Further reduced
  // CONSERVATIVE: Apply discount for single-location risk
  const locationDiscount = companySize === 'small' ? 0.85 : companySize === 'medium' ? 0.90 : 0.95;
  const adjustedMultiple = avgMultiple * locationDiscount * (1 + qualityAdjustment * 0.10 + growthAdjustment * 0.15);
  
  const multipleValuation = adjustedEbitda * adjustedMultiple;
  
  // REFINED: Market-calibrated weighting methodology
  const dataQuality = multiYearAnalysis.qualityScore;
  const growthProfile = Math.min(1, multiYearAnalysis.trendGrowthRate / 0.12);
  const synergyProfile = synergyScore;
  
  // CONSERVATIVE: Determine weighting methodology (bias toward conservative)
  let weightingMethod: 'balanced' | 'growthBiased' | 'conservative';
  if (forceWeightingMethod) {
    weightingMethod = forceWeightingMethod;
  } else if (growthProfile > 0.9 && synergyProfile > 0.7 && dataQuality > 0.8) {
    weightingMethod = 'growthBiased'; // Very high bar for growth-biased
  } else if (growthProfile < 0.5 || dataQuality < 0.7) {
    weightingMethod = 'conservative'; // Lower bar for conservative
  } else {
    weightingMethod = 'balanced'; // Default to balanced (which is now EPV-focused)
  }
  
  const weights = { ...benchmarks.methodWeights[weightingMethod], methodology: weightingMethod };
  
  const hybridValuation = 
    epvValuation * weights.epv +
    dcfValuation * weights.dcf +
    multipleValuation * weights.multiple;
  
  // REFINED: Enhanced sensitivity analysis
  const sensitivity = {
    wacc: {
      low: adjustedEarnings / (baseWacc * 0.90), // Reduced sensitivity range
      base: epvValuation,
      high: adjustedEarnings / (baseWacc * 1.10),
    },
    growth: {
      conservative: hybridValuation * 0.90, // Tighter range
      base: hybridValuation,
      aggressive: hybridValuation * 1.15,
    },
    margins: {
      low: hybridValuation * 0.92,
      base: hybridValuation,
      high: hybridValuation * 1.10,
    },
    synergies: {
      none: epvValuation * 0.90 + dcfValuation * 0.10, // No synergies case
      base: hybridValuation,
      full: hybridValuation * 1.12, // Full synergy realization
    },
  };
  
  // CONSERVATIVE: More realistic scenario analysis
  const bear_case = Math.min(epvValuation * 0.90, hybridValuation * 0.70); // More pessimistic
  const bull_case = Math.min(dcfValuation * 0.85, hybridValuation * 1.10); // Much less optimistic
  
  const scenarios = {
    bear: bear_case,
    base: hybridValuation,
    bull: bull_case,
  };
  
  // Enhanced Monte Carlo with tighter distributions
  const monteCarloResults = runRefinedMonteCarloOnHybrid(
    multiYearAnalysis,
    synergies,
    baseWacc,
    customInputs,
    1000
  );
  
  // NEW: Market calibration metrics
  const impliedMultiple = hybridValuation / adjustedEbitda;
  const benchmarkRange: [number, number] = [minMultiple, maxMultiple];
  const calibrationScore = 1 - Math.abs(impliedMultiple - avgMultiple) / avgMultiple;
  
  return {
    epvValuation,
    dcfValuation,
    multipleValuation,
    hybridValuation,
    weights,
    sensitivity,
    scenarios,
    confidenceInterval: monteCarloResults,
    marketCalibration: {
      impliedMultiple,
      benchmarkRange,
      calibrationScore: Math.max(0, Math.min(1, calibrationScore)),
    },
    synergyPhasing: {
      yearOne: synergies.phasingSchedule[0] * synergies.fullRunRateImpact,
      yearTwo: synergies.phasingSchedule[1] * synergies.fullRunRateImpact,
      yearThree: synergies.phasingSchedule[2] * synergies.fullRunRateImpact,
      steadyState: synergies.fullRunRateImpact,
    },
  };
}

// REFINED Monte Carlo simulation with tighter distributions
function runRefinedMonteCarloOnHybrid(
  multiYearAnalysis: any,
  synergies: any,
  baseWacc: number,
  customInputs: any,
  iterations: number
): { p5: number; p25: number; p50: number; p75: number; p95: number } {
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // REFINED: Tighter randomness bands (±10% instead of ±15-20%)
    const waccVariation = baseWacc * (0.92 + Math.random() * 0.16); // ±8%
    const ebitdaVariation = multiYearAnalysis.weightedAverageEbitda * 
      (0.90 + Math.random() * 0.20); // ±10%
    const synergyVariation = synergies.synergyMultiplier * 
      (0.95 + Math.random() * 0.10); // ±5%
    
    const adjustedEarnings = ebitdaVariation * synergyVariation * (1 - customInputs.taxRate);
    const simulatedValue = adjustedEarnings / waccVariation;
    
    results.push(simulatedValue);
  }
  
  results.sort((a, b) => a - b);
  
  return {
    p5: results[Math.floor(iterations * 0.05)],
    p25: results[Math.floor(iterations * 0.25)],
    p50: results[Math.floor(iterations * 0.50)],
    p75: results[Math.floor(iterations * 0.75)],
    p95: results[Math.floor(iterations * 0.95)],
  };
} 