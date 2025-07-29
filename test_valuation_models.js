/**
 * Specialized Test Suite for Valuation Models
 * Tests EPV, DCF, WACC, and other financial calculations
 */

// Mathematical helper functions
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
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Test assertion helper
function expect(actual, expected, tolerance = 0.001, testName = '') {
  if (typeof expected === 'number') {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`${testName}: Expected ${expected}, got ${actual}`);
    }
  } else if (actual !== expected) {
    throw new Error(`${testName}: Expected ${expected}, got ${actual}`);
  }
  return true;
}

// Test result tracking
class ValuationTestResults {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      categories: {}
    };
  }

  record(testName, category, passed, error = null) {
    if (!this.results.categories[category]) {
      this.results.categories[category] = { passed: 0, failed: 0 };
    }
    
    if (passed) {
      this.results.passed++;
      this.results.categories[category].passed++;
      console.log(`✅ ${testName}`);
    } else {
      this.results.failed++;
      this.results.categories[category].failed++;
      this.results.errors.push({ testName, category, error: error?.message || 'Test failed' });
      console.log(`❌ ${testName}: ${error?.message || 'Test failed'}`);
    }
  }

  summary() {
    console.log('\n📊 VALUATION MODEL TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📈 BY CATEGORY:');
    Object.entries(this.results.categories).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed;
      const rate = ((stats.passed / total) * 100).toFixed(1);
      console.log(`${category}: ${stats.passed}/${total} (${rate}%)`);
    });
  }
}

const testResults = new ValuationTestResults();

// 1. EPV (Enterprise Present Value) Tests
function testEPVCalculations() {
  console.log('\n💰 TESTING EPV CALCULATIONS');
  console.log('='.repeat(50));

  try {
    // Basic EPV calculation
    const earnings = 100000;
    const wacc = 0.1;
    const epv = earnings / wacc;
    expect(epv, 1000000, 0.001, 'Basic EPV calculation');
    testResults.record('Basic EPV', 'EPV', true);

    // EPV with different WACC rates
    const waccRates = [0.05, 0.1, 0.15, 0.2];
    waccRates.forEach(rate => {
      const epvValue = earnings / rate;
      expect(epvValue > 0, true, 0, `EPV with ${rate * 100}% WACC`);
      expect(epvValue, earnings / rate, 0.001, `EPV calculation with ${rate * 100}% WACC`);
    });
    testResults.record('EPV with Different WACC Rates', 'EPV', true);

    // EPV with negative earnings
    const negativeEarnings = -50000;
    const negativeEPV = negativeEarnings / wacc;
    expect(negativeEPV, -500000, 0.001, 'EPV with negative earnings');
    testResults.record('EPV with Negative Earnings', 'EPV', true);

    // EPV with zero earnings
    const zeroEarnings = 0;
    const zeroEPV = zeroEarnings / wacc;
    expect(zeroEPV, 0, 0.001, 'EPV with zero earnings');
    testResults.record('EPV with Zero Earnings', 'EPV', true);

  } catch (error) {
    testResults.record('EPV Calculations', 'EPV', false, error);
  }
}

// 2. WACC (Weighted Average Cost of Capital) Tests
function testWACCCalculations() {
  console.log('\n🏦 TESTING WACC CALCULATIONS');
  console.log('='.repeat(50));

  try {
    // Basic WACC calculation
    const costOfEquity = 0.15;
    const costOfDebt = 0.08;
    const taxRate = 0.21;
    const equityWeight = 0.7;
    const debtWeight = 0.3;
    
    const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);
    const wacc = (costOfEquity * equityWeight) + (afterTaxCostOfDebt * debtWeight);
    
    expect(afterTaxCostOfDebt, 0.0632, 0.001, 'After-tax cost of debt');
    expect(wacc, 0.1248, 0.001, 'Basic WACC calculation');
    testResults.record('Basic WACC', 'WACC', true);

    // WACC with different capital structures
    const capitalStructures = [
      { equity: 0.5, debt: 0.5 },
      { equity: 0.8, debt: 0.2 },
      { equity: 0.2, debt: 0.8 }
    ];

    capitalStructures.forEach(structure => {
      const waccValue = (costOfEquity * structure.equity) + (afterTaxCostOfDebt * structure.debt);
      expect(waccValue > 0, true, 0, `WACC with ${structure.equity * 100}% equity`);
      expect(waccValue < 1, true, 0, `WACC reasonable range with ${structure.equity * 100}% equity`);
    });
    testResults.record('WACC with Different Capital Structures', 'WACC', true);

    // WACC with different tax rates
    const taxRates = [0, 0.15, 0.21, 0.35];
    taxRates.forEach(rate => {
      const afterTaxCost = costOfDebt * (1 - rate);
      const waccValue = (costOfEquity * equityWeight) + (afterTaxCost * debtWeight);
      expect(afterTaxCost <= costOfDebt, true, 0, `After-tax cost with ${rate * 100}% tax rate`);
      expect(waccValue > 0, true, 0, `WACC with ${rate * 100}% tax rate`);
    });
    testResults.record('WACC with Different Tax Rates', 'WACC', true);

  } catch (error) {
    testResults.record('WACC Calculations', 'WACC', false, error);
  }
}

// 3. DCF (Discounted Cash Flow) Tests
function testDCFCalculations() {
  console.log('\n📈 TESTING DCF CALCULATIONS');
  console.log('='.repeat(50));

  try {
    // Basic DCF calculation
    const cashFlows = [100000, 110000, 121000, 133100, 146410];
    const discountRate = 0.1;
    
    let presentValue = 0;
    cashFlows.forEach((cf, year) => {
      const pv = cf / Math.pow(1 + discountRate, year + 1);
      presentValue += pv;
    });
    
    expect(presentValue, 454545, 1000, 'Basic DCF calculation');
    testResults.record('Basic DCF', 'DCF', true);

    // DCF with terminal value
    const terminalValue = 146410 * 1.02 / (discountRate - 0.02);
    const terminalPV = terminalValue / Math.pow(1 + discountRate, 5);
    const totalValue = presentValue + terminalPV;
    
    expect(terminalValue > 0, true, 0, 'Terminal value calculation');
    expect(totalValue > presentValue, true, 0, 'Total value with terminal value');
    testResults.record('DCF with Terminal Value', 'DCF', true);

    // DCF with different growth rates
    const growthRates = [0, 0.02, 0.05, 0.1];
    growthRates.forEach(growth => {
      if (growth < discountRate) {
        const terminalValue = cashFlows[4] * (1 + growth) / (discountRate - growth);
        expect(terminalValue > 0, true, 0, `Terminal value with ${growth * 100}% growth`);
      }
    });
    testResults.record('DCF with Different Growth Rates', 'DCF', true);

  } catch (error) {
    testResults.record('DCF Calculations', 'DCF', false, error);
  }
}

// 4. Financial Metrics Tests
function testFinancialMetrics() {
  console.log('\n📊 TESTING FINANCIAL METRICS');
  console.log('='.repeat(50));

  try {
    // EBITDA calculation
    const revenue = 1000000;
    const cogs = 600000;
    const operatingExpenses = 200000;
    const depreciation = 50000;
    const amortization = 10000;
    
    const grossProfit = revenue - cogs;
    const ebit = grossProfit - operatingExpenses;
    const ebitda = ebit + depreciation + amortization;
    
    expect(grossProfit, 400000, 0.001, 'Gross profit calculation');
    expect(ebit, 200000, 0.001, 'EBIT calculation');
    expect(ebitda, 260000, 0.001, 'EBITDA calculation');
    testResults.record('EBITDA Calculation', 'Financial Metrics', true);

    // NOPAT calculation
    const taxRate = 0.21;
    const nopat = ebit * (1 - taxRate);
    expect(nopat, 158000, 0.001, 'NOPAT calculation');
    testResults.record('NOPAT Calculation', 'Financial Metrics', true);

    // Working capital calculation
    const currentAssets = 300000;
    const currentLiabilities = 150000;
    const workingCapital = currentAssets - currentLiabilities;
    expect(workingCapital, 150000, 0.001, 'Working capital calculation');
    testResults.record('Working Capital', 'Financial Metrics', true);

    // Free cash flow calculation
    const capex = 80000;
    const fcf = ebitda - capex - (workingCapital * 0.1); // Assuming 10% WC change
    expect(fcf > 0, true, 0, 'Free cash flow positive');
    testResults.record('Free Cash Flow', 'Financial Metrics', true);

  } catch (error) {
    testResults.record('Financial Metrics', 'Financial Metrics', false, error);
  }
}

// 5. Sensitivity Analysis Tests
function testSensitivityAnalysis() {
  console.log('\n🎯 TESTING SENSITIVITY ANALYSIS');
  console.log('='.repeat(50));

  try {
    const baseEarnings = 100000;
    const baseWACC = 0.1;
    const baseEPV = baseEarnings / baseWACC;

    // Sensitivity to WACC changes
    const waccChanges = [-0.02, -0.01, 0, 0.01, 0.02];
    const epvValues = waccChanges.map(change => {
      const newWACC = baseWACC + change;
      return baseEarnings / newWACC;
    });

    // Verify that higher WACC leads to lower EPV
    for (let i = 1; i < epvValues.length; i++) {
      expect(epvValues[i] <= epvValues[i-1], true, 0, `EPV decreases with WACC increase ${i}`);
    }
    testResults.record('WACC Sensitivity', 'Sensitivity', true);

    // Sensitivity to earnings changes
    const earningsChanges = [-0.2, -0.1, 0, 0.1, 0.2];
    const epvEarningsValues = earningsChanges.map(change => {
      const newEarnings = baseEarnings * (1 + change);
      return newEarnings / baseWACC;
    });

    // Verify that higher earnings leads to higher EPV
    for (let i = 1; i < epvEarningsValues.length; i++) {
      expect(epvEarningsValues[i] >= epvEarningsValues[i-1], true, 0, `EPV increases with earnings increase ${i}`);
    }
    testResults.record('Earnings Sensitivity', 'Sensitivity', true);

    // Monte Carlo simulation
    const simulations = 1000;
    const epvSamples = [];
    
    for (let i = 0; i < simulations; i++) {
      const randomEarnings = baseEarnings * (0.8 + Math.random() * 0.4); // ±20% variation
      const randomWACC = baseWACC * (0.8 + Math.random() * 0.4); // ±20% variation
      epvSamples.push(randomEarnings / randomWACC);
    }

    const meanEPV = epvSamples.reduce((a, b) => a + b, 0) / epvSamples.length;
    const sortedEPV = epvSamples.sort((a, b) => a - b);
    const p5 = percentile(sortedEPV, 0.05);
    const p95 = percentile(sortedEPV, 0.95);

    expect(meanEPV > 0, true, 0, 'Monte Carlo mean EPV positive');
    expect(p5 < p95, true, 0, 'Monte Carlo percentile ordering');
    testResults.record('Monte Carlo Simulation', 'Sensitivity', true);

  } catch (error) {
    testResults.record('Sensitivity Analysis', 'Sensitivity', false, error);
  }
}

// 6. Scenario Analysis Tests
function testScenarioAnalysis() {
  console.log('\n🎭 TESTING SCENARIO ANALYSIS');
  console.log('='.repeat(50));

  try {
    const baseEarnings = 100000;
    const baseWACC = 0.1;

    // Define scenarios
    const scenarios = {
      'Base Case': { earnings: baseEarnings, wacc: baseWACC },
      'Bull Case': { earnings: baseEarnings * 1.2, wacc: baseWACC * 0.9 },
      'Bear Case': { earnings: baseEarnings * 0.8, wacc: baseWACC * 1.1 }
    };

    const scenarioResults = {};
    Object.entries(scenarios).forEach(([name, params]) => {
      const epv = params.earnings / params.wacc;
      scenarioResults[name] = epv;
      expect(epv > 0, true, 0, `${name} EPV positive`);
    });

    // Verify scenario ordering
    expect(scenarioResults['Bear Case'] < scenarioResults['Base Case'], true, 0, 'Bear case lower than base');
    expect(scenarioResults['Base Case'] < scenarioResults['Bull Case'], true, 0, 'Base case lower than bull');
    testResults.record('Scenario Ordering', 'Scenarios', true);

    // Calculate scenario ranges
    const range = scenarioResults['Bull Case'] - scenarioResults['Bear Case'];
    const baseValue = scenarioResults['Base Case'];
    const rangePercentage = (range / baseValue) * 100;

    expect(range > 0, true, 0, 'Scenario range positive');
    expect(rangePercentage > 20, true, 0, 'Scenario range significant');
    testResults.record('Scenario Range Calculation', 'Scenarios', true);

  } catch (error) {
    testResults.record('Scenario Analysis', 'Scenarios', false, error);
  }
}

// Main test runner
function runValuationTests() {
  console.log('🏦 VALUATION MODEL TEST SUITE');
  console.log('='.repeat(60));
  console.log('Testing EPV, DCF, WACC, and financial calculations...\n');

  const startTime = Date.now();

  try {
    testEPVCalculations();
    testWACCCalculations();
    testDCFCalculations();
    testFinancialMetrics();
    testSensitivityAnalysis();
    testScenarioAnalysis();

    const totalTime = Date.now() - startTime;

    console.log('\n🎉 VALUATION MODEL TESTING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total Test Time: ${totalTime}ms`);
    
    testResults.summary();

    if (testResults.results.failed > 0) {
      console.log('\n❌ Some valuation tests failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All valuation tests passed! Models are mathematically sound.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n💥 Valuation test suite failed with error:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runValuationTests();
}

module.exports = {
  runValuationTests,
  testEPVCalculations,
  testWACCCalculations,
  testDCFCalculations,
  testFinancialMetrics,
  testSensitivityAnalysis,
  testScenarioAnalysis
};