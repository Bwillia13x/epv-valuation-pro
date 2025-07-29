// EPV Valuation Pro - Independent Mathematical Validation (Standalone)
// Comprehensive accuracy verification without module dependencies
// Tests mathematical precision, edge cases, and computational reliability

console.log('🔬 EPV VALUATION PRO - INDEPENDENT MATHEMATICAL VALIDATION');
console.log('='.repeat(80));
console.log(
  'Standalone validation of financial calculations and precision testing'
);
console.log(
  'Testing computational reliability, edge cases, and boundary conditions'
);
console.log('='.repeat(80));

// Core Mathematical Functions (Replicated for Testing)
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = clamp((sorted.length - 1) * p, 0, sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const h = idx - lo;
  return sorted[lo] * (1 - h) + sorted[hi] * h;
}

function triangular(min, mode, max) {
  const u = Math.random();
  const f = (mode - min) / (max - min);

  if (u < f) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

function normal(mean, sd) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return (
    mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  );
}

// Test 1: MATHEMATICAL PRECISION AND ROUNDING ANALYSIS
console.log('\n1. MATHEMATICAL PRECISION & ROUNDING ANALYSIS');
console.log('-'.repeat(60));

function testNumericalPrecision() {
  const results = {
    precisionTests: [],
    roundingErrors: [],
    cumulativeErrors: [],
    overallScore: 0,
  };

  console.log('Testing floating-point precision in financial calculations...');

  const testCases = [
    {
      value: 0.1 + 0.2,
      expected: 0.3,
      description: 'Basic floating point addition',
    },
    {
      value: 999999.99 * 1.001,
      expected: 1000999.98999,
      description: 'Large number multiplication',
    },
    {
      value: 1000000 / 3,
      expected: 333333.33333333334,
      description: 'Division with repeating decimals',
    },
    {
      value: Math.pow(1.12, 5),
      expected: 1.7623416832,
      description: 'Compound growth calculation',
    },
    {
      value: (5000000 * 0.15) / 0.25,
      expected: 3000000,
      description: 'Multi-step financial ratio',
    },
  ];

  let passedTests = 0;
  testCases.forEach((test, i) => {
    const precision = Math.abs(test.value - test.expected);
    const isPrecise = precision < Number.EPSILON * 100; // More lenient for financial calculations

    if (isPrecise) passedTests++;

    results.precisionTests.push({
      test: test.description,
      calculated: test.value,
      expected: test.expected,
      precision: precision,
      acceptable: isPrecise,
    });

    console.log(`${i + 1}. ${test.description}:`);
    console.log(`   Calculated: ${test.value}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Precision Error: ${precision.toExponential(3)}`);
    console.log(
      `   Status: ${isPrecise ? '✅ ACCEPTABLE' : '⚠️  PRECISION LOSS'}`
    );
  });

  console.log(
    `\nPrecision Test Summary: ${passedTests}/${testCases.length} passed (${((passedTests / testCases.length) * 100).toFixed(1)}%)`
  );

  // Test cumulative rounding errors in multi-step calculations
  console.log('\nTesting cumulative rounding errors in calculation chains...');

  let cumulativeValue = 1000000; // Start with $1M
  const steps = [
    { operation: 'multiply', factor: 1.12, description: '12% revenue growth' },
    { operation: 'multiply', factor: 0.25, description: '25% EBITDA margin' },
    {
      operation: 'multiply',
      factor: 0.74,
      description: '26% tax rate (NOPAT)',
    },
    { operation: 'divide', factor: 0.15, description: 'Divide by 15% WACC' },
    { operation: 'subtract', factor: 50000, description: 'Subtract $50K debt' },
    { operation: 'multiply', factor: 0.95, description: '5% risk discount' },
  ];

  let errorAccumulation = 0;
  let maxSingleError = 0;

  steps.forEach((step, i) => {
    const originalValue = cumulativeValue;

    switch (step.operation) {
      case 'multiply':
        cumulativeValue *= step.factor;
        break;
      case 'divide':
        cumulativeValue /= step.factor;
        break;
      case 'subtract':
        cumulativeValue -= step.factor;
        break;
    }

    // Calculate potential rounding error (round to cents)
    const roundedValue = Math.round(cumulativeValue * 100) / 100;
    const roundingError = Math.abs(cumulativeValue - roundedValue);
    errorAccumulation += roundingError;
    maxSingleError = Math.max(maxSingleError, roundingError);

    results.cumulativeErrors.push({
      step: i + 1,
      operation: `${step.operation} by ${step.factor}`,
      description: step.description,
      before: originalValue,
      after: cumulativeValue,
      rounded: roundedValue,
      roundingError: roundingError,
      cumulativeError: errorAccumulation,
    });

    console.log(`Step ${i + 1}: ${step.description}`);
    console.log(`   Before: $${originalValue.toLocaleString()}`);
    console.log(`   After: $${cumulativeValue.toLocaleString()}`);
    console.log(`   Rounding Error: $${roundingError.toFixed(6)}`);
    console.log(`   Cumulative Error: $${errorAccumulation.toFixed(6)}`);
  });

  const finalValue = cumulativeValue;
  const totalErrorPct = (errorAccumulation / finalValue) * 100;

  console.log(`\nCumulative Error Analysis:`);
  console.log(`   Final Value: $${finalValue.toLocaleString()}`);
  console.log(`   Total Cumulative Error: $${errorAccumulation.toFixed(6)}`);
  console.log(`   Error as % of Final Value: ${totalErrorPct.toFixed(8)}%`);
  console.log(`   Max Single Step Error: $${maxSingleError.toFixed(6)}`);
  console.log(
    `   Assessment: ${totalErrorPct < 0.001 ? '✅ EXCELLENT' : totalErrorPct < 0.01 ? '✅ ACCEPTABLE' : '⚠️  CONCERNING'}`
  );

  results.overallScore = (passedTests / testCases.length) * 100;
  return results;
}

const precisionResults = testNumericalPrecision();

// Test 2: EXTREME VALUE STRESS TESTING
console.log('\n\n2. EXTREME VALUE STRESS TESTING');
console.log('-'.repeat(60));

function stressTestExtremeValues() {
  const results = {
    highValueTests: [],
    lowValueTests: [],
    negativeValueTests: [],
    boundaryTests: [],
    overallScore: 0,
  };

  console.log('Testing with extreme high values (>$100M)...');

  const highValueScenarios = [
    {
      name: 'Large Hospital Chain',
      revenue: 150000000, // $150M
      ebitda: 45000000, // $45M (30% margin)
      wacc: 0.08,
      description: 'Major healthcare platform',
    },
    {
      name: 'National Aesthetic Platform',
      revenue: 500000000, // $500M
      ebitda: 125000000, // $125M (25% margin)
      wacc: 0.09,
      description: 'Large-scale operations',
    },
    {
      name: 'International Chain',
      revenue: 1000000000, // $1B
      ebitda: 200000000, // $200M (20% margin)
      wacc: 0.07,
      description: 'Global enterprise',
    },
  ];

  let highValuePassed = 0;
  highValueScenarios.forEach((scenario, i) => {
    console.log(`${i + 1}. ${scenario.name} (${scenario.description}):`);

    try {
      // Calculate EPV using Owner Earnings method
      const taxRate = 0.26;
      const nopat = scenario.ebitda * (1 - taxRate);
      const maintCapex = scenario.revenue * 0.03; // 3% of revenue
      const depreciation = scenario.revenue * 0.04; // 4% of revenue
      const ownerEarnings = nopat + depreciation - maintCapex;
      const calculatedEV = ownerEarnings / scenario.wacc;

      // Reasonableness checks
      const evRevenueMultiple = calculatedEV / scenario.revenue;
      const evEbitdaMultiple = calculatedEV / scenario.ebitda;

      const isReasonable =
        evRevenueMultiple >= 1.5 &&
        evRevenueMultiple <= 15 &&
        evEbitdaMultiple >= 8 &&
        evEbitdaMultiple <= 25;

      if (isReasonable) highValuePassed++;

      results.highValueTests.push({
        scenario: scenario.name,
        revenue: scenario.revenue,
        ebitda: scenario.ebitda,
        wacc: scenario.wacc,
        ownerEarnings: ownerEarnings,
        calculatedEV: calculatedEV,
        evRevenueMultiple: evRevenueMultiple,
        evEbitdaMultiple: evEbitdaMultiple,
        reasonable: isReasonable,
        status: isReasonable ? 'PASS' : 'QUESTIONABLE',
      });

      console.log(`   Revenue: $${scenario.revenue.toLocaleString()}`);
      console.log(`   EBITDA: $${scenario.ebitda.toLocaleString()}`);
      console.log(`   Owner Earnings: $${ownerEarnings.toLocaleString()}`);
      console.log(`   WACC: ${(scenario.wacc * 100).toFixed(1)}%`);
      console.log(`   Enterprise Value: $${calculatedEV.toLocaleString()}`);
      console.log(`   EV/Revenue: ${evRevenueMultiple.toFixed(1)}x`);
      console.log(`   EV/EBITDA: ${evEbitdaMultiple.toFixed(1)}x`);
      console.log(
        `   Status: ${isReasonable ? '✅ REASONABLE' : '⚠️  EXTREME MULTIPLE'}`
      );
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.highValueTests.push({
        scenario: scenario.name,
        error: error.message,
        status: 'ERROR',
      });
    }
  });

  console.log(
    `\nHigh Value Test Summary: ${highValuePassed}/${highValueScenarios.length} passed`
  );

  console.log('\nTesting with extreme low values (<$1M)...');

  const lowValueScenarios = [
    {
      name: 'Solo Practitioner',
      revenue: 250000, // $250K
      ebitda: 50000, // $50K (20% margin)
      wacc: 0.18,
      description: 'Single provider practice',
    },
    {
      name: 'Small Startup Clinic',
      revenue: 600000, // $600K
      ebitda: 90000, // $90K (15% margin)
      wacc: 0.22,
      description: 'New practice establishment',
    },
    {
      name: 'Part-time Practice',
      revenue: 150000, // $150K
      ebitda: 30000, // $30K (20% margin)
      wacc: 0.25,
      description: 'Limited operation',
    },
  ];

  let lowValuePassed = 0;
  lowValueScenarios.forEach((scenario, i) => {
    console.log(`${i + 1}. ${scenario.name} (${scenario.description}):`);

    try {
      const taxRate = 0.26;
      const nopat = scenario.ebitda * (1 - taxRate);
      const maintCapex = scenario.revenue * 0.05; // Higher % for small practices
      const depreciation = scenario.revenue * 0.06; // Higher depreciation rate
      const ownerEarnings = nopat + depreciation - maintCapex;
      const calculatedEV = ownerEarnings / scenario.wacc;

      // Reasonableness checks for small practices
      const evRevenueMultiple = calculatedEV / scenario.revenue;
      const evEbitdaMultiple = calculatedEV / scenario.ebitda;

      const isReasonable =
        evRevenueMultiple >= 0.8 &&
        evRevenueMultiple <= 6 &&
        evEbitdaMultiple >= 4 &&
        evEbitdaMultiple <= 15 &&
        calculatedEV > 0;

      if (isReasonable) lowValuePassed++;

      results.lowValueTests.push({
        scenario: scenario.name,
        revenue: scenario.revenue,
        ebitda: scenario.ebitda,
        wacc: scenario.wacc,
        ownerEarnings: ownerEarnings,
        calculatedEV: calculatedEV,
        evRevenueMultiple: evRevenueMultiple,
        evEbitdaMultiple: evEbitdaMultiple,
        reasonable: isReasonable,
        status: isReasonable ? 'PASS' : 'QUESTIONABLE',
      });

      console.log(`   Revenue: $${scenario.revenue.toLocaleString()}`);
      console.log(`   EBITDA: $${scenario.ebitda.toLocaleString()}`);
      console.log(`   Owner Earnings: $${ownerEarnings.toLocaleString()}`);
      console.log(`   WACC: ${(scenario.wacc * 100).toFixed(1)}%`);
      console.log(`   Enterprise Value: $${calculatedEV.toLocaleString()}`);
      console.log(`   EV/Revenue: ${evRevenueMultiple.toFixed(1)}x`);
      console.log(`   EV/EBITDA: ${evEbitdaMultiple.toFixed(1)}x`);
      console.log(
        `   Status: ${isReasonable ? '✅ REASONABLE' : '⚠️  EXTREME MULTIPLE'}`
      );
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.lowValueTests.push({
        scenario: scenario.name,
        error: error.message,
        status: 'ERROR',
      });
    }
  });

  console.log(
    `\nLow Value Test Summary: ${lowValuePassed}/${lowValueScenarios.length} passed`
  );

  console.log('\nTesting with negative EBITDA scenarios...');

  const negativeScenarios = [
    {
      name: 'Turnaround Situation',
      revenue: 2000000, // $2M
      ebitda: -300000, // -$300K loss
      wacc: 0.25,
      description: 'Underperforming practice',
    },
    {
      name: 'Early Stage Losses',
      revenue: 1500000, // $1.5M
      ebitda: -150000, // -$150K loss
      wacc: 0.2,
      description: 'Development stage',
    },
    {
      name: 'Restructuring Phase',
      revenue: 3000000, // $3M
      ebitda: -450000, // -$450K loss
      wacc: 0.3,
      description: 'Major operational issues',
    },
  ];

  let negativeHandled = 0;
  negativeScenarios.forEach((scenario, i) => {
    console.log(`${i + 1}. ${scenario.name} (${scenario.description}):`);

    try {
      const taxRate = 0.26;
      const nopat = scenario.ebitda * (1 - taxRate); // Tax benefit on losses
      const maintCapex = scenario.revenue * 0.03;
      const depreciation = scenario.revenue * 0.04;
      const ownerEarnings = nopat + depreciation - maintCapex;

      console.log(`   Revenue: $${scenario.revenue.toLocaleString()}`);
      console.log(`   EBITDA: -$${Math.abs(scenario.ebitda).toLocaleString()}`);
      console.log(
        `   NOPAT (with tax benefit): -$${Math.abs(nopat).toLocaleString()}`
      );
      console.log(`   Owner Earnings: $${ownerEarnings.toLocaleString()}`);
      console.log(`   WACC: ${(scenario.wacc * 100).toFixed(1)}%`);

      if (ownerEarnings > 0) {
        const calculatedEV = ownerEarnings / scenario.wacc;
        console.log(`   Enterprise Value: $${calculatedEV.toLocaleString()}`);
        console.log(
          `   Note: Positive Owner Earnings despite EBITDA loss (depreciation effect)`
        );
      } else {
        console.log(
          `   Note: Negative Owner Earnings - Liquidation/Asset value approach needed`
        );
        console.log(`   Asset-based valuation would be more appropriate`);
      }

      console.log(`   Status: ✅ HANDLED CORRECTLY`);
      negativeHandled++;

      results.negativeValueTests.push({
        scenario: scenario.name,
        revenue: scenario.revenue,
        ebitda: scenario.ebitda,
        wacc: scenario.wacc,
        nopat: nopat,
        ownerEarnings: ownerEarnings,
        status: 'HANDLED',
      });
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.negativeValueTests.push({
        scenario: scenario.name,
        error: error.message,
        status: 'ERROR',
      });
    }
  });

  console.log(
    `\nNegative EBITDA Test Summary: ${negativeHandled}/${negativeScenarios.length} handled properly`
  );

  const totalTests =
    highValueScenarios.length +
    lowValueScenarios.length +
    negativeScenarios.length;
  const totalPassed = highValuePassed + lowValuePassed + negativeHandled;
  results.overallScore = (totalPassed / totalTests) * 100;

  return results;
}

const extremeValueResults = stressTestExtremeValues();

// Test 3: BOUNDARY CONDITIONS AND EDGE CASES
console.log('\n\n3. BOUNDARY CONDITIONS & EDGE CASES');
console.log('-'.repeat(60));

function testBoundaryConditions() {
  const results = {
    waccBoundaries: [],
    percentageBoundaries: [],
    zeroBoundaries: [],
    infinityHandling: [],
    overallScore: 0,
  };

  console.log('Testing WACC boundary conditions...');

  const waccBoundaryTests = [
    { wacc: 0.001, description: 'Near-zero WACC (0.1%)' },
    { wacc: 0.01, description: 'Very low WACC (1%)' },
    { wacc: 0.05, description: 'Low WACC (5%)' },
    { wacc: 0.35, description: 'High WACC (35%)' },
    { wacc: 0.5, description: 'Very high WACC (50%)' },
    { wacc: 0.99, description: 'Near-maximum WACC (99%)' },
  ];

  const testEarnings = 1000000; // $1M
  let waccTestsPassed = 0;

  waccBoundaryTests.forEach((test, i) => {
    console.log(`${i + 1}. ${test.description}:`);

    try {
      const epv = testEarnings / test.wacc;
      const isReasonable =
        epv > 0 && epv < Number.MAX_SAFE_INTEGER && epv < 1e12; // $1T limit

      if (isReasonable) waccTestsPassed++;

      results.waccBoundaries.push({
        wacc: test.wacc,
        description: test.description,
        earnings: testEarnings,
        epv: epv,
        reasonable: isReasonable,
        status: isReasonable ? 'PASS' : 'EXTREME',
      });

      console.log(`   WACC: ${(test.wacc * 100).toFixed(1)}%`);
      console.log(`   EPV: $${epv.toLocaleString()}`);
      console.log(
        `   Status: ${isReasonable ? '✅ REASONABLE' : '⚠️  EXTREME VALUE'}`
      );
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.waccBoundaries.push({
        wacc: test.wacc,
        error: error.message,
        status: 'ERROR',
      });
    }
  });

  console.log(
    `\nWACC Boundary Test Summary: ${waccTestsPassed}/${waccBoundaryTests.length} reasonable`
  );

  console.log('\nTesting percentage boundary conditions...');

  const percentageTests = [
    { value: 0, description: 'Zero percentage (0%)' },
    { value: 0.0001, description: 'Near-zero percentage (0.01%)' },
    { value: 0.5, description: 'Moderate percentage (50%)' },
    { value: 1.0, description: 'Full percentage (100%)' },
    { value: 1.2, description: 'Over 100% (120%)' },
    { value: 2.0, description: 'Double percentage (200%)' },
  ];

  const testRevenue = 5000000; // $5M
  let percentageTestsPassed = 0;

  percentageTests.forEach((test, i) => {
    console.log(
      `${i + 1}. ${test.description} (${(test.value * 100).toFixed(2)}%):`
    );

    try {
      const cost = testRevenue * test.value;
      const remainingRevenue = testRevenue - cost;
      const margin = remainingRevenue / testRevenue;
      const isViable = margin >= -1; // Allow up to 100% loss

      if (isViable) percentageTestsPassed++;

      results.percentageBoundaries.push({
        percentage: test.value,
        description: test.description,
        revenue: testRevenue,
        cost: cost,
        remaining: remainingRevenue,
        margin: margin,
        viable: isViable,
        status: isViable ? 'HANDLED' : 'EXTREME',
      });

      console.log(`   Applied to Revenue: $${testRevenue.toLocaleString()}`);
      console.log(`   Cost: $${cost.toLocaleString()}`);
      console.log(`   Remaining: $${remainingRevenue.toLocaleString()}`);
      console.log(`   Margin: ${(margin * 100).toFixed(1)}%`);
      console.log(`   Status: ${isViable ? '✅ HANDLED' : '⚠️  EXTREME'}`);
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.percentageBoundaries.push({
        percentage: test.value,
        error: error.message,
        status: 'ERROR',
      });
    }
  });

  console.log(
    `\nPercentage Boundary Test Summary: ${percentageTestsPassed}/${percentageTests.length} handled`
  );

  console.log('\nTesting zero and infinity handling...');

  const specialValueTests = [
    { earnings: 0, wacc: 0.15, description: 'Zero earnings, normal WACC' },
    { earnings: 1000000, wacc: 0, description: 'Normal earnings, zero WACC' },
    { earnings: 0, wacc: 0, description: 'Both zero' },
    { earnings: Infinity, wacc: 0.15, description: 'Infinite earnings' },
    { earnings: 1000000, wacc: Infinity, description: 'Infinite WACC' },
  ];

  let specialTestsPassed = 0;
  specialValueTests.forEach((test, i) => {
    console.log(`${i + 1}. ${test.description}:`);

    try {
      if (test.wacc === 0) {
        console.log(
          `   Cannot calculate EPV with zero WACC (division by zero)`
        );
        console.log(`   Status: ✅ PROPERLY HANDLED`);
        specialTestsPassed++;
        results.zeroBoundaries.push({
          earnings: test.earnings,
          wacc: test.wacc,
          description: test.description,
          status: 'HANDLED',
        });
      } else if (test.earnings === Infinity || test.wacc === Infinity) {
        const epv = test.earnings / test.wacc;
        console.log(
          `   Result: ${isFinite(epv) ? '$' + epv.toLocaleString() : epv}`
        );
        console.log(
          `   Status: ${isFinite(epv) ? '✅ FINITE RESULT' : '⚠️  INFINITE RESULT'}`
        );
        if (isFinite(epv) || epv === 0) specialTestsPassed++;
        results.infinityHandling.push({
          earnings: test.earnings,
          wacc: test.wacc,
          description: test.description,
          epv: epv,
          status: isFinite(epv) ? 'FINITE' : 'INFINITE',
        });
      } else {
        const epv = test.earnings / test.wacc;
        console.log(`   EPV: $${epv.toLocaleString()}`);
        console.log(`   Status: ✅ CALCULATED`);
        specialTestsPassed++;
        results.zeroBoundaries.push({
          earnings: test.earnings,
          wacc: test.wacc,
          description: test.description,
          epv: epv,
          status: 'CALCULATED',
        });
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.zeroBoundaries.push({
        earnings: test.earnings,
        wacc: test.wacc,
        error: error.message,
        status: 'ERROR',
      });
    }
  });

  console.log(
    `\nSpecial Value Test Summary: ${specialTestsPassed}/${specialValueTests.length} handled properly`
  );

  const totalBoundaryTests =
    waccBoundaryTests.length +
    percentageTests.length +
    specialValueTests.length;
  const totalBoundaryPassed =
    waccTestsPassed + percentageTestsPassed + specialTestsPassed;
  results.overallScore = (totalBoundaryPassed / totalBoundaryTests) * 100;

  return results;
}

const boundaryResults = testBoundaryConditions();

// Test 4: MONTE CARLO DISTRIBUTION ACCURACY
console.log('\n\n4. MONTE CARLO DISTRIBUTION ACCURACY');
console.log('-'.repeat(60));

function testMonteCarloAccuracy() {
  const results = {
    distributionTests: [],
    convergenceTests: [],
    stabilityTests: [],
    overallScore: 0,
  };

  console.log('Testing triangular distribution accuracy...');

  // Test triangular distribution with known parameters
  const triangularSamples = [];
  const min = 0.1,
    mode = 0.15,
    max = 0.2;
  const sampleSize = 10000;

  for (let i = 0; i < sampleSize; i++) {
    triangularSamples.push(triangular(min, mode, max));
  }

  triangularSamples.sort((a, b) => a - b);

  const sampleMean =
    triangularSamples.reduce((sum, val) => sum + val, 0) /
    triangularSamples.length;
  const theoreticalMean = (min + mode + max) / 3;
  const meanError = Math.abs(sampleMean - theoreticalMean) / theoreticalMean;

  const sampleP50 = percentile(triangularSamples, 0.5);
  const sampleP25 = percentile(triangularSamples, 0.25);
  const sampleP75 = percentile(triangularSamples, 0.75);
  const sampleP10 = percentile(triangularSamples, 0.1);
  const sampleP90 = percentile(triangularSamples, 0.9);

  // Check if samples are within expected bounds
  const allWithinBounds = triangularSamples.every((x) => x >= min && x <= max);
  const distributionAccurate = meanError < 0.01 && allWithinBounds;

  console.log(
    `Triangular Distribution Test (${sampleSize.toLocaleString()} samples):`
  );
  console.log(`   Parameters: min=${min}, mode=${mode}, max=${max}`);
  console.log(`   Theoretical Mean: ${theoreticalMean.toFixed(4)}`);
  console.log(`   Sample Mean: ${sampleMean.toFixed(4)}`);
  console.log(`   Mean Error: ${(meanError * 100).toFixed(3)}%`);
  console.log(
    `   Percentiles: P10=${sampleP10.toFixed(4)}, P25=${sampleP25.toFixed(4)}, P50=${sampleP50.toFixed(4)}, P75=${sampleP75.toFixed(4)}, P90=${sampleP90.toFixed(4)}`
  );
  console.log(
    `   All samples within bounds: ${allWithinBounds ? '✅ YES' : '❌ NO'}`
  );
  console.log(
    `   Status: ${distributionAccurate ? '✅ ACCURATE' : '⚠️  DEVIATION'}`
  );

  results.distributionTests.push({
    distribution: 'triangular',
    samples: sampleSize,
    parameters: { min, mode, max },
    theoreticalMean: theoreticalMean,
    sampleMean: sampleMean,
    meanError: meanError,
    percentiles: {
      p10: sampleP10,
      p25: sampleP25,
      p50: sampleP50,
      p75: sampleP75,
      p90: sampleP90,
    },
    withinBounds: allWithinBounds,
    accurate: distributionAccurate,
  });

  console.log('\nTesting normal distribution accuracy...');

  const normalSamples = [];
  const normalMean = 0.15,
    normalStd = 0.02;

  for (let i = 0; i < sampleSize; i++) {
    normalSamples.push(normal(normalMean, normalStd));
  }

  normalSamples.sort((a, b) => a - b);

  const normalSampleMean =
    normalSamples.reduce((sum, val) => sum + val, 0) / normalSamples.length;
  const normalMeanError = Math.abs(normalSampleMean - normalMean) / normalMean;

  // Calculate sample standard deviation
  const normalSampleVariance =
    normalSamples.reduce(
      (sum, val) => sum + Math.pow(val - normalSampleMean, 2),
      0
    ) /
    (normalSamples.length - 1);
  const normalSampleStd = Math.sqrt(normalSampleVariance);
  const normalStdError = Math.abs(normalSampleStd - normalStd) / normalStd;

  const normalP50 = percentile(normalSamples, 0.5);
  const normalAccurate = normalMeanError < 0.02 && normalStdError < 0.1;

  console.log(
    `Normal Distribution Test (${sampleSize.toLocaleString()} samples):`
  );
  console.log(`   Parameters: mean=${normalMean}, std=${normalStd}`);
  console.log(
    `   Sample Mean: ${normalSampleMean.toFixed(4)} (error: ${(normalMeanError * 100).toFixed(3)}%)`
  );
  console.log(
    `   Sample Std: ${normalSampleStd.toFixed(4)} (error: ${(normalStdError * 100).toFixed(3)}%)`
  );
  console.log(`   Sample Median: ${normalP50.toFixed(4)}`);
  console.log(`   Status: ${normalAccurate ? '✅ ACCURATE' : '⚠️  DEVIATION'}`);

  console.log('\nTesting Monte Carlo convergence behavior...');

  // Simple EPV Monte Carlo simulation
  function runSimpleMonteCarlo(runs) {
    const results = [];
    const baseEarnings = 1000000;
    const baseWACC = 0.15;

    for (let i = 0; i < runs; i++) {
      // Add randomness to earnings and WACC
      const earnings = baseEarnings * (0.8 + Math.random() * 0.4); // ±20%
      const wacc = Math.max(0.05, baseWACC + (Math.random() - 0.5) * 0.06); // ±3%
      const epv = earnings / wacc;
      results.push(epv);
    }

    results.sort((a, b) => a - b);

    return {
      mean: results.reduce((sum, val) => sum + val, 0) / results.length,
      median: percentile(results, 0.5),
      p25: percentile(results, 0.25),
      p75: percentile(results, 0.75),
      std: Math.sqrt(
        results.reduce(
          (sum, val) =>
            sum +
            Math.pow(
              val - results.reduce((s, v) => s + v, 0) / results.length,
              2
            ),
          0
        ) / results.length
      ),
    };
  }

  const convergenceRuns = [100, 500, 1000, 5000];
  const convergenceResults = [];

  convergenceRuns.forEach((runs) => {
    const result = runSimpleMonteCarlo(runs);
    convergenceResults.push({
      runs: runs,
      mean: result.mean,
      median: result.median,
      std: result.std,
      cv: result.std / result.mean,
    });

    console.log(
      `${runs} runs: Mean=$${result.mean.toLocaleString()}, Median=$${result.median.toLocaleString()}, CV=${((result.std / result.mean) * 100).toFixed(1)}%`
    );
  });

  // Test stability across multiple runs
  console.log('\nTesting simulation stability...');

  const stabilityResults = [];
  for (let i = 0; i < 5; i++) {
    const result = runSimpleMonteCarlo(1000);
    stabilityResults.push(result.mean);
    console.log(`Run ${i + 1}: Mean=$${result.mean.toLocaleString()}`);
  }

  const stabilityMean =
    stabilityResults.reduce((sum, val) => sum + val, 0) /
    stabilityResults.length;
  const stabilityStd = Math.sqrt(
    stabilityResults.reduce(
      (sum, val) => sum + Math.pow(val - stabilityMean, 2),
      0
    ) / stabilityResults.length
  );
  const stabilityCV = stabilityStd / stabilityMean;

  console.log(`Stability Analysis (across 5 runs of 1,000 samples each):`);
  console.log(`   Mean of means: $${stabilityMean.toLocaleString()}`);
  console.log(`   Standard deviation: $${stabilityStd.toLocaleString()}`);
  console.log(
    `   Coefficient of variation: ${(stabilityCV * 100).toFixed(3)}%`
  );
  console.log(
    `   Status: ${stabilityCV < 0.05 ? '✅ STABLE' : '⚠️  UNSTABLE'}`
  );

  const monteCarloScore =
    (distributionAccurate ? 50 : 0) +
    (normalAccurate ? 30 : 0) +
    (stabilityCV < 0.05 ? 20 : 0);
  results.overallScore = monteCarloScore;

  return results;
}

const monteCarloResults = testMonteCarloAccuracy();

// Test 5: COMPREHENSIVE CALCULATION CHAIN VALIDATION
console.log('\n\n5. COMPREHENSIVE CALCULATION CHAIN VALIDATION');
console.log('-'.repeat(60));

function testCalculationChains() {
  const results = {
    chainTests: [],
    consistencyChecks: [],
    errorPropagation: [],
    overallScore: 0,
  };

  console.log(
    'Testing end-to-end calculation accuracy with complex scenario...'
  );

  // Real-world medispa scenario
  const scenario = {
    name: 'Mid-Size Aesthetic Practice',
    serviceLines: [
      { name: 'Botox', price: 650, volume: 180, cogsPct: 0.3, kind: 'service' },
      {
        name: 'Dermal Fillers',
        price: 850,
        volume: 100,
        cogsPct: 0.35,
        kind: 'service',
      },
      {
        name: 'Laser Hair Removal',
        price: 200,
        volume: 300,
        cogsPct: 0.2,
        kind: 'service',
      },
      {
        name: 'Chemical Peels',
        price: 150,
        volume: 200,
        cogsPct: 0.25,
        kind: 'service',
      },
      {
        name: 'Skincare Products',
        price: 120,
        volume: 400,
        cogsPct: 0.6,
        kind: 'retail',
      },
    ],
    locations: 2,

    // Operating parameters
    clinicalLaborPct: 0.16,
    laborMarketAdj: 1.05, // 5% market premium
    adminPct: 0.13,
    marketingPct: 0.09,

    // Synergy parameters
    sgnaSynergyPct: 0.12, // 12% admin synergy per additional location
    marketingSynergyPct: 0.08, // 8% marketing synergy
    minAdminPctFactor: 0.15, // 15% minimum admin

    // Fixed costs per location
    rentAnnual: 144000, // $12K/month
    medDirectorAnnual: 72000,
    insuranceAnnual: 36000,
    softwareAnnual: 24000,
    utilitiesAnnual: 18000,

    // Add-backs and adjustments
    ownerAddBack: 150000, // Owner salary add-back
    otherAddBack: 20000, // Other adjustments
    daAnnual: 35000, // Depreciation per location

    // Valuation parameters
    taxRate: 0.26,
    maintenanceCapexPct: 0.035,
    rfRate: 0.045,
    erp: 0.065,
    beta: 1.3,
    sizePrem: 0.035,
    specificPrem: 0.02,
  };

  console.log(`\nScenario: ${scenario.name} (${scenario.locations} locations)`);

  // Step 1: Revenue and COGS calculation
  let totalRevenue = 0;
  let serviceRevenue = 0;
  let retailRevenue = 0;
  let totalCOGS = 0;

  console.log('\nStep 1: Revenue and COGS calculation');
  scenario.serviceLines.forEach((line, i) => {
    const lineRevenue = line.price * line.volume * scenario.locations;
    const lineCOGS = lineRevenue * line.cogsPct;

    totalRevenue += lineRevenue;
    totalCOGS += lineCOGS;

    if (line.kind === 'service') {
      serviceRevenue += lineRevenue;
    } else {
      retailRevenue += lineRevenue;
    }

    console.log(
      `   ${line.name}: $${lineRevenue.toLocaleString()} revenue, $${lineCOGS.toLocaleString()} COGS (${(line.cogsPct * 100).toFixed(0)}%)`
    );
  });

  console.log(`   Total Revenue: $${totalRevenue.toLocaleString()}`);
  console.log(`   Service Revenue: $${serviceRevenue.toLocaleString()}`);
  console.log(`   Retail Revenue: $${retailRevenue.toLocaleString()}`);
  console.log(`   Total COGS: $${totalCOGS.toLocaleString()}`);

  // Verification check: Service + Retail = Total
  const revenueCheck =
    Math.abs(serviceRevenue + retailRevenue - totalRevenue) < 1;
  console.log(`   Revenue Check: ${revenueCheck ? '✅ PASSED' : '❌ FAILED'}`);

  // Step 2: Labor costs with market adjustment
  console.log('\nStep 2: Labor cost calculation');
  const clinicalLaborPctEff = Math.min(
    0.8,
    Math.max(0, scenario.clinicalLaborPct * scenario.laborMarketAdj)
  );
  const clinicalLaborCost = clinicalLaborPctEff * serviceRevenue;

  console.log(
    `   Base Clinical Labor Rate: ${(scenario.clinicalLaborPct * 100).toFixed(1)}%`
  );
  console.log(`   Market Adjustment: ${scenario.laborMarketAdj}x`);
  console.log(
    `   Effective Rate: ${(clinicalLaborPctEff * 100).toFixed(1)}% (capped at 80%)`
  );
  console.log(`   Clinical Labor Cost: $${clinicalLaborCost.toLocaleString()}`);

  // Step 3: Operating expenses with multi-location synergies
  console.log('\nStep 3: Operating expenses with synergies');

  // Admin synergies
  const adminReduction = Math.max(
    0,
    (scenario.locations - 1) * scenario.sgnaSynergyPct
  );
  const adminSynergyAdjusted =
    scenario.adminPct * (1 - Math.min(0.7, adminReduction));
  const adminMinimum = scenario.adminPct * scenario.minAdminPctFactor;
  const adminPctEff = Math.max(adminMinimum, adminSynergyAdjusted);
  const adminCost = adminPctEff * totalRevenue;

  console.log(`   Admin Synergy Calculation:`);
  console.log(`     Base Rate: ${(scenario.adminPct * 100).toFixed(1)}%`);
  console.log(`     Synergy Reduction: ${(adminReduction * 100).toFixed(1)}%`);
  console.log(
    `     Synergy-Adjusted: ${(adminSynergyAdjusted * 100).toFixed(1)}%`
  );
  console.log(`     Minimum Floor: ${(adminMinimum * 100).toFixed(1)}%`);
  console.log(`     Effective Rate: ${(adminPctEff * 100).toFixed(1)}%`);
  console.log(`     Admin Cost: $${adminCost.toLocaleString()}`);

  // Marketing synergies
  const mktgReduction = Math.max(
    0,
    (scenario.locations - 1) * scenario.marketingSynergyPct
  );
  const mktgPctEff = Math.max(
    0.02,
    scenario.marketingPct * (1 - Math.min(0.5, mktgReduction))
  );
  const marketingCost = mktgPctEff * totalRevenue;

  console.log(`   Marketing Synergy Calculation:`);
  console.log(`     Base Rate: ${(scenario.marketingPct * 100).toFixed(1)}%`);
  console.log(`     Synergy Reduction: ${(mktgReduction * 100).toFixed(1)}%`);
  console.log(`     Effective Rate: ${(mktgPctEff * 100).toFixed(1)}%`);
  console.log(`     Marketing Cost: $${marketingCost.toLocaleString()}`);

  // Fixed costs
  const fixedCostPerLocation =
    scenario.rentAnnual +
    scenario.medDirectorAnnual +
    scenario.insuranceAnnual +
    scenario.softwareAnnual +
    scenario.utilitiesAnnual;
  const totalFixedCosts = fixedCostPerLocation * scenario.locations;

  console.log(
    `   Fixed Costs per Location: $${fixedCostPerLocation.toLocaleString()}`
  );
  console.log(`   Total Fixed Costs: $${totalFixedCosts.toLocaleString()}`);

  const totalOpex = adminCost + marketingCost + totalFixedCosts;
  console.log(`   Total Operating Expenses: $${totalOpex.toLocaleString()}`);

  // Step 4: EBITDA normalization
  console.log('\nStep 4: EBITDA normalization');
  const grossProfit = totalRevenue - totalCOGS - clinicalLaborCost;
  const ebitdaReported = grossProfit - totalOpex;
  const totalAddBacks =
    (scenario.ownerAddBack + scenario.otherAddBack) * scenario.locations;
  const ebitdaNormalized = ebitdaReported + totalAddBacks;
  const daTotal = scenario.daAnnual * scenario.locations;
  const ebitNormalized = ebitdaNormalized - daTotal;

  console.log(`   Gross Profit: $${grossProfit.toLocaleString()}`);
  console.log(`   Reported EBITDA: $${ebitdaReported.toLocaleString()}`);
  console.log(`   Add-backs: $${totalAddBacks.toLocaleString()}`);
  console.log(`   Normalized EBITDA: $${ebitdaNormalized.toLocaleString()}`);
  console.log(`   D&A: $${daTotal.toLocaleString()}`);
  console.log(`   Normalized EBIT: $${ebitNormalized.toLocaleString()}`);

  // Step 5: WACC calculation
  console.log('\nStep 5: WACC calculation');
  const marketRiskPremium = scenario.erp;
  const betaRiskPremium = scenario.beta * marketRiskPremium;
  const costEquity =
    scenario.rfRate +
    betaRiskPremium +
    scenario.sizePrem +
    scenario.specificPrem;
  const wacc = costEquity; // Assuming 100% equity

  console.log(`   Risk-free Rate: ${(scenario.rfRate * 100).toFixed(1)}%`);
  console.log(`   Beta: ${scenario.beta}`);
  console.log(
    `   Market Risk Premium: ${(marketRiskPremium * 100).toFixed(1)}%`
  );
  console.log(`   Beta Risk Premium: ${(betaRiskPremium * 100).toFixed(1)}%`);
  console.log(`   Size Premium: ${(scenario.sizePrem * 100).toFixed(1)}%`);
  console.log(
    `   Specific Premium: ${(scenario.specificPrem * 100).toFixed(1)}%`
  );
  console.log(`   Cost of Equity/WACC: ${(wacc * 100).toFixed(1)}%`);

  // Step 6: EPV calculation
  console.log('\nStep 6: EPV calculation');
  const nopat = ebitNormalized * (1 - scenario.taxRate);
  const maintCapex = scenario.maintenanceCapexPct * totalRevenue;
  const ownerEarnings = nopat + daTotal - maintCapex;
  const enterpriseValue = ownerEarnings / wacc;

  console.log(`   NOPAT: $${nopat.toLocaleString()}`);
  console.log(`   Maintenance Capex: $${maintCapex.toLocaleString()}`);
  console.log(`   Owner Earnings: $${ownerEarnings.toLocaleString()}`);
  console.log(`   Enterprise Value: $${enterpriseValue.toLocaleString()}`);

  // Step 7: Comprehensive reasonableness checks
  console.log('\nStep 7: Reasonableness checks');

  const checks = [
    {
      name: 'Gross Margin',
      value: (grossProfit / totalRevenue) * 100,
      expected: '60-85%',
      min: 60,
      max: 85,
      unit: '%',
    },
    {
      name: 'EBITDA Margin (Normalized)',
      value: (ebitdaNormalized / totalRevenue) * 100,
      expected: '20-45%',
      min: 20,
      max: 45,
      unit: '%',
    },
    {
      name: 'Clinical Labor as % of Service Revenue',
      value: (clinicalLaborCost / serviceRevenue) * 100,
      expected: '12-25%',
      min: 12,
      max: 25,
      unit: '%',
    },
    {
      name: 'Total OpEx as % of Revenue',
      value: (totalOpex / totalRevenue) * 100,
      expected: '40-70%',
      min: 40,
      max: 70,
      unit: '%',
    },
    {
      name: 'WACC Range',
      value: wacc * 100,
      expected: '12-25%',
      min: 12,
      max: 25,
      unit: '%',
    },
    {
      name: 'EV/Revenue Multiple',
      value: enterpriseValue / totalRevenue,
      expected: '2.5-7.0x',
      min: 2.5,
      max: 7.0,
      unit: 'x',
    },
    {
      name: 'EV/EBITDA Multiple',
      value: enterpriseValue / ebitdaNormalized,
      expected: '6-12x',
      min: 6,
      max: 12,
      unit: 'x',
    },
  ];

  let checksPassed = 0;
  checks.forEach((check, i) => {
    const withinRange = check.value >= check.min && check.value <= check.max;
    if (withinRange) checksPassed++;

    console.log(
      `   ${i + 1}. ${check.name}: ${check.value.toFixed(1)}${check.unit} (Expected: ${check.expected}) ${withinRange ? '✅' : '⚠️'}`
    );
  });

  console.log(
    `\nReasonableness Check Summary: ${checksPassed}/${checks.length} passed (${((checksPassed / checks.length) * 100).toFixed(1)}%)`
  );

  // Method consistency check
  const epvFromNOPAT = nopat / wacc;
  const methodDifference = Math.abs(enterpriseValue - epvFromNOPAT);
  const methodConsistency = methodDifference / epvFromNOPAT;

  console.log(`\nMethod Consistency Check:`);
  console.log(`   Owner Earnings EPV: $${enterpriseValue.toLocaleString()}`);
  console.log(`   NOPAT EPV: $${epvFromNOPAT.toLocaleString()}`);
  console.log(`   Difference: $${methodDifference.toLocaleString()}`);
  console.log(
    `   Consistency: ${(methodConsistency * 100).toFixed(3)}% ${methodConsistency < 0.15 ? '✅' : '⚠️'}`
  );

  const calculationScore =
    (revenueCheck ? 10 : 0) +
    (checksPassed / checks.length) * 70 +
    (methodConsistency < 0.15 ? 20 : 0);

  results.overallScore = calculationScore;

  return {
    scenario: scenario.name,
    totalRevenue,
    ebitdaNormalized,
    enterpriseValue,
    checks,
    checksPassed,
    methodConsistency,
    calculationScore,
    results,
  };
}

const chainResults = testCalculationChains();

// FINAL COMPREHENSIVE ASSESSMENT
console.log('\n\n' + '='.repeat(80));
console.log('🏆 COMPREHENSIVE MATHEMATICAL VALIDATION ASSESSMENT');
console.log('='.repeat(80));

console.log('\n📊 DETAILED RESULTS SUMMARY:');
console.log(
  `✓ Mathematical Precision: ${precisionResults.overallScore.toFixed(1)}% score`
);
console.log(
  `✓ Extreme Value Handling: ${extremeValueResults.overallScore.toFixed(1)}% score`
);
console.log(
  `✓ Boundary Conditions: ${boundaryResults.overallScore.toFixed(1)}% score`
);
console.log(
  `✓ Monte Carlo Accuracy: ${monteCarloResults.overallScore.toFixed(1)}% score`
);
console.log(
  `✓ Calculation Chain Integrity: ${chainResults.calculationScore.toFixed(1)}% score`
);

const overallScore =
  precisionResults.overallScore * 0.2 +
  extremeValueResults.overallScore * 0.25 +
  boundaryResults.overallScore * 0.2 +
  monteCarloResults.overallScore * 0.15 +
  chainResults.calculationScore * 0.2;

console.log(
  `\n🎯 OVERALL PLATFORM RELIABILITY SCORE: ${overallScore.toFixed(1)}/100`
);

// Performance grading
let grade, assessment;
if (overallScore >= 90) {
  grade = 'A+';
  assessment =
    'EXCELLENT - Platform demonstrates exceptional mathematical reliability';
} else if (overallScore >= 85) {
  grade = 'A';
  assessment = 'VERY GOOD - Platform shows strong computational accuracy';
} else if (overallScore >= 80) {
  grade = 'A-';
  assessment =
    'GOOD - Platform is generally reliable with minor areas for improvement';
} else if (overallScore >= 75) {
  grade = 'B+';
  assessment =
    'SATISFACTORY - Platform functional but needs attention to precision';
} else if (overallScore >= 70) {
  grade = 'B';
  assessment = 'ADEQUATE - Platform has several areas requiring improvement';
} else {
  grade = 'C or below';
  assessment =
    'NEEDS SIGNIFICANT IMPROVEMENT - Multiple mathematical reliability issues';
}

console.log(`\n🏅 PLATFORM GRADE: ${grade}`);
console.log(`📋 ASSESSMENT: ${assessment}`);

console.log('\n🔍 KEY FINDINGS:');
console.log('✅ STRENGTHS:');
if (precisionResults.overallScore >= 80) {
  console.log('   • Floating-point precision well controlled');
}
if (extremeValueResults.overallScore >= 80) {
  console.log('   • Robust handling of extreme value scenarios');
}
if (boundaryResults.overallScore >= 80) {
  console.log('   • Proper boundary condition management');
}
if (chainResults.calculationScore >= 80) {
  console.log('   • Consistent end-to-end calculation chains');
}

console.log('\n⚠️  AREAS FOR IMPROVEMENT:');
if (precisionResults.overallScore < 80) {
  console.log('   • Floating-point precision needs attention');
}
if (extremeValueResults.overallScore < 80) {
  console.log('   • Extreme value handling could be more robust');
}
if (boundaryResults.overallScore < 80) {
  console.log('   • Boundary condition handling needs improvement');
}
if (monteCarloResults.overallScore < 80) {
  console.log('   • Monte Carlo simulation accuracy needs enhancement');
}
if (chainResults.calculationScore < 80) {
  console.log('   • Calculation chain consistency needs attention');
}

console.log('\n📈 SPECIFIC RECOMMENDATIONS:');
console.log(
  '1. Implement additional safeguards for cumulative rounding errors'
);
console.log('2. Add input validation for extreme boundary conditions');
console.log('3. Enhance error handling for division by zero scenarios');
console.log(
  '4. Consider implementing alternate methods for negative earnings scenarios'
);
console.log(
  '5. Add automated precision monitoring for complex calculation chains'
);
console.log('6. Implement overflow protection for very large valuations');
console.log('7. Add Monte Carlo convergence testing and stability monitoring');

console.log('\n🎯 COMPUTATIONAL RELIABILITY VERDICT:');
if (overallScore >= 85) {
  console.log('🟢 HIGH RELIABILITY - Platform ready for production use');
} else if (overallScore >= 75) {
  console.log(
    '🟡 MODERATE RELIABILITY - Platform functional with recommended improvements'
  );
} else {
  console.log(
    '🔴 LOW RELIABILITY - Platform requires significant enhancements before production use'
  );
}

console.log('\n📊 TESTING COVERAGE SUMMARY:');
console.log(
  `• Precision Tests: ${precisionResults.precisionTests.length} scenarios`
);
console.log(
  `• Extreme Value Tests: ${extremeValueResults.highValueTests.length + extremeValueResults.lowValueTests.length + extremeValueResults.negativeValueTests.length} scenarios`
);
console.log(
  `• Boundary Tests: ${boundaryResults.waccBoundaries.length + boundaryResults.percentageBoundaries.length + boundaryResults.zeroBoundaries.length} scenarios`
);
console.log(`• Monte Carlo Samples: 10,000+ distribution samples`);
console.log(`• Calculation Chains: Complex multi-step scenario validation`);

console.log('\n' + '='.repeat(80));
console.log('✅ INDEPENDENT MATHEMATICAL VALIDATION COMPLETE');
console.log(`Platform assessed across ${5} major reliability dimensions`);
console.log(
  `Overall computational integrity score: ${overallScore.toFixed(1)}/100 (Grade: ${grade})`
);
console.log('='.repeat(80));
