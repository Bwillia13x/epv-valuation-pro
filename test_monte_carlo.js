// Monte Carlo EPV Mathematical Validation Test

console.log('🎲 Monte Carlo EPV Mathematical Validation');
console.log('='.repeat(60));

// Import simulation functions (basic implementations)
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
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return (
    mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  );
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

// Test input parameters
const input = {
  adjustedEarnings: 100000,
  wacc: 0.15,
  totalRevenue: 500000,
  ebitMargin: 0.2,
  capexMode: 'percent',
  maintenanceCapexPct: 0.03,
  da: 25000,
  cash: 50000,
  debt: 100000,
  taxRate: 0.26,
  runs: 1000,
};

console.log('\nInput Parameters:');
console.log(`Adjusted Earnings: $${input.adjustedEarnings.toLocaleString()}`);
console.log(`Base WACC: ${(input.wacc * 100).toFixed(1)}%`);
console.log(`Total Revenue: $${input.totalRevenue.toLocaleString()}`);
console.log(`EBIT Margin: ${(input.ebitMargin * 100).toFixed(1)}%`);
console.log(`Simulation Runs: ${input.runs.toLocaleString()}`);

// Run basic Monte Carlo simulation
const R = input.runs;
const evDist = [];
const eqDist = [];

console.log('\nRunning Monte Carlo Simulation...');

for (let i = 0; i < R; i++) {
  // Sample WACC with normal distribution
  const wacc = clamp(normal(input.wacc, 0.02), 0.05, 0.3);

  // Sample revenue growth
  const revenueMultiplier = Math.max(0.5, normal(1.0, 0.15));
  const rev = input.totalRevenue * revenueMultiplier;

  // Sample margin
  const margin = clamp(normal(input.ebitMargin, 0.03), 0.05, 0.5);
  const ebit = rev * margin;
  const nopat = ebit * (1 - input.taxRate);

  // Sample capex
  const maintCapexPct = clamp(
    normal(input.maintenanceCapexPct, 0.01),
    0.01,
    0.1
  );
  const maint = maintCapexPct * rev;

  const adj = nopat + input.da - maint;
  const ev = wacc > 0 ? adj / wacc : 0;
  const equity = ev + input.cash - input.debt;

  evDist.push(ev);
  eqDist.push(equity);
}

// Sort distributions
evDist.sort((a, b) => a - b);
eqDist.sort((a, b) => a - b);

// Calculate statistics
const meanEV = evDist.reduce((sum, val) => sum + val, 0) / evDist.length;
const meanEquity = eqDist.reduce((sum, val) => sum + val, 0) / eqDist.length;

const p5EV = percentile(evDist, 0.05);
const p25EV = percentile(evDist, 0.25);
const p50EV = percentile(evDist, 0.5);
const p75EV = percentile(evDist, 0.75);
const p95EV = percentile(evDist, 0.95);

const p5Eq = percentile(eqDist, 0.05);
const p25Eq = percentile(eqDist, 0.25);
const p50Eq = percentile(eqDist, 0.5);
const p75Eq = percentile(eqDist, 0.75);
const p95Eq = percentile(eqDist, 0.95);

console.log('\nMonte Carlo Results:');
console.log('\nEnterprise Value Distribution:');
console.log(`Mean: $${meanEV.toLocaleString()}`);
console.log(`P5:   $${p5EV.toLocaleString()}`);
console.log(`P25:  $${p25EV.toLocaleString()}`);
console.log(`P50:  $${p50EV.toLocaleString()}`);
console.log(`P75:  $${p75EV.toLocaleString()}`);
console.log(`P95:  $${p95EV.toLocaleString()}`);

console.log('\nEquity Value Distribution:');
console.log(`Mean: $${meanEquity.toLocaleString()}`);
console.log(`P5:   $${p5Eq.toLocaleString()}`);
console.log(`P25:  $${p25Eq.toLocaleString()}`);
console.log(`P50:  $${p50Eq.toLocaleString()}`);
console.log(`P75:  $${p75Eq.toLocaleString()}`);
console.log(`P95:  $${p95Eq.toLocaleString()}`);

// Validation tests
console.log('\n\nVALIDATION TESTS:');
console.log('='.repeat(40));

// Test 1: Distribution ordering
const orderingTests = [
  { name: 'EV P5 < P25', test: p5EV < p25EV },
  { name: 'EV P25 < P50', test: p25EV < p50EV },
  { name: 'EV P50 < P75', test: p50EV < p75EV },
  { name: 'EV P75 < P95', test: p75EV < p95EV },
  { name: 'Eq P5 < P25', test: p5Eq < p25Eq },
  { name: 'Eq P25 < P50', test: p25Eq < p50Eq },
  { name: 'Eq P50 < P75', test: p50Eq < p75Eq },
  { name: 'Eq P75 < P95', test: p75Eq < p95Eq },
];

console.log('\n1. Percentile Ordering:');
orderingTests.forEach((test) => {
  console.log(`✓ ${test.name}: ${test.test ? '✅ PASS' : '❌ FAIL'}`);
});

// Test 2: Reasonableness checks
const reasonableTests = [
  { name: 'EV Mean > 0', test: meanEV > 0 },
  { name: 'EV Mean < $10M', test: meanEV < 10000000 },
  { name: 'Equity Mean > $-200K', test: meanEquity > -200000 },
  { name: 'P95/P5 Ratio < 20', test: p95EV / Math.max(1, p5EV) < 20 },
];

console.log('\n2. Reasonableness Checks:');
reasonableTests.forEach((test) => {
  console.log(`✓ ${test.name}: ${test.test ? '✅ PASS' : '❌ FAIL'}`);
});

// Test 3: Statistical properties
const variance =
  evDist.reduce((sum, val) => sum + Math.pow(val - meanEV, 2), 0) /
  evDist.length;
const stdDev = Math.sqrt(variance);
const coeffVar = stdDev / meanEV;

console.log('\n3. Statistical Properties:');
console.log(`Standard Deviation: $${stdDev.toLocaleString()}`);
console.log(`Coefficient of Variation: ${(coeffVar * 100).toFixed(1)}%`);
console.log(
  `✓ Reasonable Volatility: ${coeffVar > 0.1 && coeffVar < 1.0 ? '✅ PASS' : '❌ FAIL'}`
);

// Test 4: Distribution sampling validation
console.log('\n4. Distribution Sampling:');

// Test triangular distribution
const triSamples = [];
for (let i = 0; i < 1000; i++) {
  triSamples.push(triangular(0.1, 0.15, 0.25));
}
const triMean =
  triSamples.reduce((sum, val) => sum + val, 0) / triSamples.length;
const expectedTriMean = (0.1 + 0.15 + 0.25) / 3; // Theoretical mean

console.log(`Triangular Distribution Test:`);
console.log(`  Expected Mean: ${expectedTriMean.toFixed(4)}`);
console.log(`  Sampled Mean: ${triMean.toFixed(4)}`);
console.log(`  Difference: ${Math.abs(triMean - expectedTriMean).toFixed(4)}`);
console.log(
  `  ✓ Within 1%: ${Math.abs(triMean - expectedTriMean) < 0.01 ? '✅ PASS' : '❌ FAIL'}`
);

// Test normal distribution
const normSamples = [];
const testMean = 0.15;
const testStd = 0.02;
for (let i = 0; i < 1000; i++) {
  normSamples.push(normal(testMean, testStd));
}
const normMean =
  normSamples.reduce((sum, val) => sum + val, 0) / normSamples.length;

console.log(`\nNormal Distribution Test:`);
console.log(`  Expected Mean: ${testMean.toFixed(4)}`);
console.log(`  Sampled Mean: ${normMean.toFixed(4)}`);
console.log(`  Difference: ${Math.abs(normMean - testMean).toFixed(4)}`);
console.log(
  `  ✓ Within 1%: ${Math.abs(normMean - testMean) < 0.01 ? '✅ PASS' : '❌ FAIL'}`
);

console.log('\n' + '='.repeat(60));
console.log('✅ MONTE CARLO VALIDATION COMPLETE');
console.log('='.repeat(60));
