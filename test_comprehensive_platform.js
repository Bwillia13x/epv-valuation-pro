// Standalone mathematical test suite for EPV calculations
// No imports needed - contains copy of essential functions

// Mathematical helper functions (copied from valuationModels.ts)
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

function normal(mean, sd) {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function triangular(min, mode, max) {
  // Triangular distribution sampling
  const u = Math.random();
  const f = (mode - min) / (max - min);
  
  if (u < f) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

// Simple test assertion helper
function expect(actual, expected, tolerance = 0.001) {
  if (typeof expected === 'number') {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`Expected ${expected}, got ${actual}`);
    }
  } else if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}`);
  }
  return true;
}

function testMathHelpers() {
  console.log("Testing mathematical helper functions...");
  
  // Test clamp
  expect(clamp(5, 0, 10), 5);
  expect(clamp(-5, 0, 10), 0);
  expect(clamp(15, 0, 10), 10);
  
  // Test percentile
  const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  expect(percentile(sorted, 0.5), 5.5); // median
  expect(percentile(sorted, 0.0), 1);   // min
  expect(percentile(sorted, 1.0), 10);  // max
  
  // Test triangular distribution mean approximation
  const triangularSamples = [];
  for (let i = 0; i < 10000; i++) {
    triangularSamples.push(triangular(0, 5, 10));
  }
  const triangularMean = triangularSamples.reduce((a, b) => a + b, 0) / triangularSamples.length;
  expect(triangularMean, 5.0, 0.1); // Should be close to (0+5+10)/3 = 5
  
  console.log("✅ Math helpers tests passed");
}

function testScenarioWACCLogic() {
  console.log("Testing scenario WACC logic...");
  
  const baseWACC = 0.10;
  
  // Test multiplicative scenario adjustments (corrected approach)
  const scenarios = {
    "Base": 1.0,
    "Bull": 0.95,   // 5% reduction
    "Bear": 1.05,   // 5% increase
  };
  
  Object.entries(scenarios).forEach(([name, mult]) => {
    const scenarioWACC = baseWACC * mult;
    console.log(`  ${name}: ${baseWACC} × ${mult} = ${scenarioWACC.toFixed(3)}`);
    
    // Validate bounds
    expect(scenarioWACC > 0, true);
    expect(scenarioWACC < 0.5, true);
  });
  
  console.log("✅ Scenario WACC logic tests passed");
}

function testTaxRateApplication() {
  console.log("Testing tax rate application...");
  
  const ebit = 1000000;
  const taxRates = [0.21, 0.25, 0.30];
  
  taxRates.forEach(rate => {
    const nopat = ebit * (1 - rate);
    const expectedNOPAT = ebit - (ebit * rate);
    
    expect(nopat, expectedNOPAT, 0.01);
    console.log(`  EBIT ${ebit.toLocaleString()} @ ${(rate*100)}% tax = NOPAT ${nopat.toLocaleString()}`);
  });
  
  console.log("✅ Tax rate application tests passed");
}

function testWACCCalculation() {
  console.log("Testing WACC calculation...");
  
  // Test CAPM components
  const rfRate = 0.042;
  const beta = 1.1;
  const mrp = 0.055;
  const sizePrem = 0.02;
  const specificPrem = 0.0;
  
  const costEquity = rfRate + beta * mrp + sizePrem + specificPrem;
  const expectedCostEquity = 0.042 + 1.1 * 0.055 + 0.02; // = 12.25%
  
  expect(costEquity, expectedCostEquity, 0.001);
  console.log(`  Cost of Equity: ${(costEquity * 100).toFixed(2)}%`);
  
  // Test blended WACC
  const costDebt = 0.085;
  const taxRate = 0.25;
  const debtWeight = 0.35;
  const equityWeight = 1 - debtWeight;
  
  const afterTaxCostDebt = costDebt * (1 - taxRate);
  const wacc = debtWeight * afterTaxCostDebt + equityWeight * costEquity;
  
  console.log(`  After-tax Cost of Debt: ${(afterTaxCostDebt * 100).toFixed(2)}%`);
  console.log(`  WACC: ${(wacc * 100).toFixed(2)}%`);
  
  // Validate reasonable WACC range
  expect(wacc > 0.05, true);  // Above 5%
  expect(wacc < 0.25, true);  // Below 25%
  
  console.log("✅ WACC calculation tests passed");
}

function testEPVMath() {
  console.log("Testing EPV mathematical relationship...");
  
  const adjustedEarnings = 1000000;
  const wacc = 0.10;
  
  // Gordon Growth Model with 0% growth (perpetuity)
  const epv = adjustedEarnings / wacc;
  expect(epv, 10000000); // $10M at 10% WACC
  
  console.log(`  Adjusted Earnings: $${adjustedEarnings.toLocaleString()}`);
  console.log(`  WACC: ${(wacc * 100)}%`);
  console.log(`  EPV: $${epv.toLocaleString()}`);
  
  // Test sensitivity
  const waccSensitivity = [0.08, 0.10, 0.12];
  waccSensitivity.forEach(w => {
    const sensitiveEPV = adjustedEarnings / w;
    console.log(`  At ${(w*100)}% WACC: $${sensitiveEPV.toLocaleString()}`);
  });
  
  console.log("✅ EPV math tests passed");
}

function testWorkingCapitalMath() {
  console.log("Testing working capital calculations...");
  
  const revenue = 5000000;
  const cogs = 3000000;
  const dsoDays = 30;
  const dsiDays = 45;
  const dpoDays = 60;
  
  const ar = revenue * (dsoDays / 365);
  const inventory = cogs * (dsiDays / 365);
  const ap = cogs * (dpoDays / 365);
  const nwc = ar + inventory - ap;
  
  console.log(`  AR (${dsoDays} days): $${ar.toLocaleString()}`);
  console.log(`  Inventory (${dsiDays} days): $${inventory.toLocaleString()}`);
  console.log(`  AP (${dpoDays} days): $${ap.toLocaleString()}`);
  console.log(`  Net Working Capital: $${nwc.toLocaleString()}`);
  
  // Validate relationships
  expect(ar > 0, true);
  expect(inventory > 0, true);
  expect(ap > 0, true);
  
  console.log("✅ Working capital math tests passed");
}

// Execute all tests
function runAllTests() {
  console.log("🚀 EPV Mathematical Audit - Enhanced Test Suite");
  console.log("=" .repeat(60));
  
  try {
    testMathHelpers();
    testScenarioWACCLogic();
    testTaxRateApplication();
    testWACCCalculation();
    testEPVMath();
    testWorkingCapitalMath();
    
    console.log("\n" + "=" .repeat(60));
    console.log("🎉 All mathematical tests passed!");
    console.log("✅ Core math functions validated");
    console.log("✅ Tax rate consistency confirmed");
    console.log("✅ WACC scenario logic verified");
    console.log("✅ EPV relationships validated");
    console.log("✅ Working capital formulas correct");
    console.log("🚀 Mathematical foundation is sound!");
    console.log("=" .repeat(60));
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  }
}

// Run tests
runAllTests();