// Small Practice Valuation Safeguards
// Implements specific validation and adjustment rules for practices <$1M revenue

export interface SmallPracticeAdjustments {
  originalValuation: number;
  adjustedValuation: number;
  adjustmentReason: string;
  adjustmentMagnitude: number;
  warningFlags: string[];
  recommendedActions: string[];
}

export interface SmallPracticeWarnings {
  isSmallPractice: boolean;
  riskFactors: {
    keyPersonRisk: boolean;
    locationConcentration: boolean;
    limitedDiversification: boolean;
    scalingChallenges: boolean;
    marketabilityRisk: boolean;
  };
  adjustments: {
    valuation: number;
    multiple: number;
    discount: number;
  };
}

// Apply small practice safeguards and adjustments
export function applySmallPracticeSafeguards(
  revenue: number,
  ebitda: number,
  enterpriseValue: number,
  locations: number = 1,
  hasPhysician: boolean = true,
  isDoctorOwned: boolean = true
): SmallPracticeAdjustments {
  
  const isSmallPractice = revenue < 1000000; // <$1M revenue
  const isVerySmall = revenue < 500000;      // <$500K revenue
  
  if (!isSmallPractice) {
    return {
      originalValuation: enterpriseValue,
      adjustedValuation: enterpriseValue,
      adjustmentReason: "No small practice adjustments required",
      adjustmentMagnitude: 0,
      warningFlags: [],
      recommendedActions: []
    };
  }
  
  const evRevenue = enterpriseValue / revenue;
  const evEBITDA = ebitda > 0 ? enterpriseValue / ebitda : 0;
  
  let adjustmentFactor = 1.0;
  let adjustmentReason = "";
  const warningFlags: string[] = [];
  const recommendedActions: string[] = [];
  
  // 1. Revenue-based adjustments
  if (isVerySmall) {
    adjustmentFactor *= 0.75; // 25% discount for very small practices
    warningFlags.push("Very small practice (<$500K revenue) - significant marketability discount applied");
    recommendedActions.push("Consider asset-based valuation approach as alternative");
  } else {
    adjustmentFactor *= 0.85; // 15% discount for small practices
    warningFlags.push("Small practice (<$1M revenue) - marketability discount applied");
  }
  
  // 2. EV/Revenue multiple caps for small practices
  const maxRevenueMultiple = isVerySmall ? 1.2 : 1.5;
  if (evRevenue > maxRevenueMultiple) {
    const cappedEV = revenue * maxRevenueMultiple;
    adjustmentFactor = Math.min(adjustmentFactor, cappedEV / enterpriseValue);
    warningFlags.push(`EV/Revenue multiple capped at ${maxRevenueMultiple}x for small practice`);
    recommendedActions.push("Review and validate earnings sustainability");
  }
  
  // 3. EV/EBITDA multiple caps
  const maxEBITDAMultiple = isVerySmall ? 4.0 : 5.0;
  if (evEBITDA > maxEBITDAMultiple && ebitda > 0) {
    const cappedEV = ebitda * maxEBITDAMultiple;
    adjustmentFactor = Math.min(adjustmentFactor, cappedEV / enterpriseValue);
    warningFlags.push(`EV/EBITDA multiple capped at ${maxEBITDAMultiple}x for small practice`);
    recommendedActions.push("Consider comparable transaction analysis");
  }
  
  // 4. Key person risk (especially for doctor-owned practices)
  if (isDoctorOwned && hasPhysician) {
    adjustmentFactor *= 0.975; // 2.5% discount for key person risk (INSTITUTIONAL-GRADE: increased from 1.0%)
    warningFlags.push("Key person risk discount applied for doctor-dependent practice");
    recommendedActions.push("Develop succession planning and management transition strategy");
  }
  
  // 5. Limited diversification risk
  if (locations === 1) {
    adjustmentFactor *= 0.95; // 5% discount for single location
    warningFlags.push("Single location concentration risk discount applied");
    recommendedActions.push("Consider expansion opportunities to reduce location risk");
  }
  
  // 6. Market liquidity constraints
  if (isVerySmall) {
    adjustmentFactor *= 0.90; // Additional 10% for very limited buyer pool
    warningFlags.push("Limited buyer pool discount for very small practice");
    recommendedActions.push("Target strategic buyers rather than financial buyers");
  }
  
  // Build adjustment reason
  const discountPercent = Math.round((1 - adjustmentFactor) * 100);
  adjustmentReason = `Small practice discount: ${discountPercent}% total adjustment`;
  
  // Apply floor valuation (asset-based minimum)
  const assetFloor = Math.max(revenue * 0.3, ebitda * 2.5); // Conservative asset-based floor
  const adjustedValuation = Math.max(enterpriseValue * adjustmentFactor, assetFloor);
  
  if (adjustedValuation === assetFloor) {
    warningFlags.push("Valuation floored at estimated asset replacement value");
    recommendedActions.push("Consider asset-based valuation as primary method");
  }
  
  return {
    originalValuation: enterpriseValue,
    adjustedValuation,
    adjustmentReason,
    adjustmentMagnitude: (enterpriseValue - adjustedValuation) / enterpriseValue,
    warningFlags,
    recommendedActions
  };
}

// Generate comprehensive warning report for small practices
export function generateSmallPracticeWarnings(
  revenue: number,
  ebitda: number,
  enterpriseValue: number,
  locations: number = 1,
  hasPhysician: boolean = true
): SmallPracticeWarnings {
  
  const isSmallPractice = revenue < 1000000;
  const evRevenue = enterpriseValue / revenue;
  const evEBITDA = ebitda > 0 ? enterpriseValue / ebitda : 0;
  
  if (!isSmallPractice) {
    return {
      isSmallPractice: false,
      riskFactors: {
        keyPersonRisk: false,
        locationConcentration: false,
        limitedDiversification: false,
        scalingChallenges: false,
        marketabilityRisk: false
      },
      adjustments: {
        valuation: enterpriseValue,
        multiple: evEBITDA,
        discount: 0
      }
    };
  }
  
  // Assess risk factors
  const riskFactors = {
    keyPersonRisk: hasPhysician && locations === 1, // Doctor-dependent single location
    locationConcentration: locations === 1,
    limitedDiversification: revenue < 750000, // Very limited service offering likely
    scalingChallenges: revenue < 500000, // Difficulty achieving economies of scale
    marketabilityRisk: revenue < 1000000 // Limited buyer pool
  };
  
  // Calculate appropriate adjustments
  const safeguards = applySmallPracticeSafeguards(
    revenue,
    ebitda,
    enterpriseValue,
    locations,
    hasPhysician,
    true
  );
  
  return {
    isSmallPractice: true,
    riskFactors,
    adjustments: {
      valuation: safeguards.adjustedValuation,
      multiple: safeguards.adjustedValuation / Math.max(ebitda, 1),
      discount: safeguards.adjustmentMagnitude
    }
  };
}

// Small practice input validation
export function validateSmallPracticeInputs(
  revenue: number,
  ebitda: number,
  locations: number
): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  if (revenue < 1000000) {
    
    // Margin validation for small practices
    const margin = ebitda / revenue;
    if (margin > 0.35) {
      warnings.push(`EBITDA margin ${(margin * 100).toFixed(1)}% appears high for small practice`);
      suggestions.push("Verify EBITDA normalization and sustainable earnings");
    }
    
    if (margin < 0.10) {
      warnings.push(`EBITDA margin ${(margin * 100).toFixed(1)}% appears low - may indicate operational issues`);
      suggestions.push("Review cost structure and operational efficiency");
    }
    
    // Revenue per location checks
    const revenuePerLocation = revenue / locations;
    if (revenuePerLocation < 300000) {
      warnings.push(`Revenue per location $${(revenuePerLocation / 1000).toFixed(0)}K is below typical minimum`);
      suggestions.push("Consider location consolidation or performance improvement");
    }
    
    // Very small practice specific warnings
    if (revenue < 500000) {
      warnings.push("Very small practice - consider asset-based valuation as primary method");
      suggestions.push("Focus on strategic value to specific buyer types");
    }
    
    if (revenue < 250000) {
      warnings.push("Micro practice - valuation may be primarily asset-based");
      suggestions.push("Consider sale to existing practice group or employee transition");
    }
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}

// Risk-adjusted WACC for small practices
export function calculateSmallPracticeWACC(
  baseWACC: number,
  revenue: number,
  locations: number,
  hasPhysician: boolean
): {
  adjustedWACC: number;
  riskPremium: number;
  adjustmentReasons: string[];
} {
  
  let riskPremium = 0;
  const adjustmentReasons: string[] = [];
  
  if (revenue < 1000000) {
    // Size premium for small practices
    if (revenue < 500000) {
      riskPremium += 0.04; // 400 bps for very small
      adjustmentReasons.push("Very small practice size premium: +400 bps");
    } else {
      riskPremium += 0.025; // 250 bps for small
      adjustmentReasons.push("Small practice size premium: +250 bps");
    }
    
    // Single location risk
    if (locations === 1) {
      riskPremium += 0.015; // 150 bps
      adjustmentReasons.push("Single location concentration risk: +150 bps");
    }
    
    // Key person risk (INSTITUTIONAL-GRADE: Enhanced for physician dependency)
    if (hasPhysician && locations === 1) {
      riskPremium += 0.025; // 250 bps (increased from 200 bps)
      adjustmentReasons.push("Key person dependency risk: +250 bps");
    }
    
    // Marketability risk
    if (revenue < 750000) {
      riskPremium += 0.015; // 150 bps
      adjustmentReasons.push("Limited marketability: +150 bps");
    }
  }
  
  const adjustedWACC = Math.min(baseWACC + riskPremium, 0.25); // Cap at 25%
  
  return {
    adjustedWACC,
    riskPremium,
    adjustmentReasons
  };
}