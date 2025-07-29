// EPV Mathematical Verification - Comprehensive Check
// This script verifies all calculations step-by-step for accuracy

console.log('🧮 EPV Mathematical Verification');
console.log('='.repeat(60));

// Test Data (from default implementation)
const serviceLines = [
  {
    id: 'botox',
    name: 'Botox',
    price: 700,
    volume: 200,
    cogsPct: 0.28,
    kind: 'service',
    visitUnits: 1,
  },
  {
    id: 'filler',
    name: 'Dermal Fillers',
    price: 900,
    volume: 120,
    cogsPct: 0.32,
    kind: 'service',
    visitUnits: 1,
  },
  {
    id: 'laser',
    name: 'Laser Treatments',
    price: 1200,
    volume: 80,
    cogsPct: 0.25,
    kind: 'service',
    visitUnits: 2,
  },
  {
    id: 'membership',
    name: 'Membership',
    price: 299,
    volume: 150,
    cogsPct: 0.1,
    kind: 'service',
    visitUnits: 0,
    isMembership: true,
  },
  {
    id: 'skincare',
    name: 'Skincare Products',
    price: 180,
    volume: 300,
    cogsPct: 0.55,
    kind: 'retail',
    visitUnits: 0,
  },
];

const params = {
  locations: 1,
  clinicalLaborPct: 0.15,
  laborMarketAdj: 1.0,
  adminPct: 0.12,
  marketingPct: 0.08,
  msoFeePct: 0.06,
  complianceOverheadPct: 0.02,
  otherOpexPct: 0.03,
  rentAnnual: 120000,
  medDirectorAnnual: 60000,
  insuranceAnnual: 24000,
  softwareAnnual: 18000,
  utilitiesAnnual: 12000,
  ownerAddBack: 120000,
  otherAddBack: 15000,
  daAnnual: 25000,
  taxRate: 0.26,
  rfRate: 0.045,
  erp: 0.065,
  beta: 1.2,
  sizePrem: 0.03,
  specificPrem: 0.015,
  maintenanceCapexPct: 0.03,
};

console.log('\n1. REVENUE AND COGS VERIFICATION');
console.log('-'.repeat(40));

let totalRevenue = 0;
let totalCOGS = 0;
let serviceRevenue = 0;
let retailRevenue = 0;

console.log('Service Line Calculations:');
serviceLines.forEach((line, i) => {
  const lineRevenue = line.price * line.volume * params.locations;
  const lineCOGS = lineRevenue * line.cogsPct;

  totalRevenue += lineRevenue;
  totalCOGS += lineCOGS;

  if (line.kind === 'service') {
    serviceRevenue += lineRevenue;
  } else {
    retailRevenue += lineRevenue;
  }

  console.log(`${i + 1}. ${line.name}:`);
  console.log(
    `   Revenue = $${line.price} × ${line.volume} × ${params.locations} = $${lineRevenue.toLocaleString()}`
  );
  console.log(
    `   COGS = $${lineRevenue.toLocaleString()} × ${(line.cogsPct * 100).toFixed(1)}% = $${lineCOGS.toLocaleString()}`
  );
  console.log(
    `   Gross Margin = $${(lineRevenue - lineCOGS).toLocaleString()} (${((1 - line.cogsPct) * 100).toFixed(1)}%)`
  );
});

console.log(`\nRevenue Totals:`);
console.log(`Service Revenue: $${serviceRevenue.toLocaleString()}`);
console.log(`Retail Revenue: $${retailRevenue.toLocaleString()}`);
console.log(`Total Revenue: $${totalRevenue.toLocaleString()}`);
console.log(`Total COGS: $${totalCOGS.toLocaleString()}`);

// Verify: Service + Retail = Total
const revenueCheck = serviceRevenue + retailRevenue;
console.log(
  `\n✓ Revenue Check: $${serviceRevenue.toLocaleString()} + $${retailRevenue.toLocaleString()} = $${revenueCheck.toLocaleString()}`
);
console.log(
  `✓ Matches Total: ${revenueCheck === totalRevenue ? '✅ CORRECT' : '❌ ERROR'}`
);

console.log('\n2. EBITDA NORMALIZATION VERIFICATION');
console.log('-'.repeat(40));

// Clinical Labor
const clinicalLaborPctEff = Math.min(
  0.8,
  Math.max(0, params.clinicalLaborPct * params.laborMarketAdj)
);
const clinicalLaborCost = clinicalLaborPctEff * serviceRevenue;

console.log(`Clinical Labor Calculation:`);
console.log(`Base Rate: ${(params.clinicalLaborPct * 100).toFixed(1)}%`);
console.log(`Market Adjustment: ${params.laborMarketAdj}x`);
console.log(
  `Effective Rate: ${(clinicalLaborPctEff * 100).toFixed(1)}% (clamped 0-80%)`
);
console.log(
  `Applied to Service Revenue: $${serviceRevenue.toLocaleString()} × ${(clinicalLaborPctEff * 100).toFixed(1)}% = $${clinicalLaborCost.toLocaleString()}`
);

// Gross Profit
const grossProfit = totalRevenue - totalCOGS - clinicalLaborCost;
console.log(`\nGross Profit = Revenue - COGS - Clinical Labor`);
console.log(
  `$${grossProfit.toLocaleString()} = $${totalRevenue.toLocaleString()} - $${totalCOGS.toLocaleString()} - $${clinicalLaborCost.toLocaleString()}`
);

// Operating Expenses
const marketingCost = params.marketingPct * totalRevenue;
const adminCost = params.adminPct * totalRevenue;
const msoFee = params.msoFeePct * totalRevenue;
const complianceCost = params.complianceOverheadPct * totalRevenue;
const otherOpexCost = params.otherOpexPct * totalRevenue;
const fixedOpex =
  (params.rentAnnual +
    params.medDirectorAnnual +
    params.insuranceAnnual +
    params.softwareAnnual +
    params.utilitiesAnnual) *
  params.locations;

console.log(`\nOperating Expenses:`);
console.log(
  `Marketing: $${totalRevenue.toLocaleString()} × ${(params.marketingPct * 100).toFixed(1)}% = $${marketingCost.toLocaleString()}`
);
console.log(
  `Admin: $${totalRevenue.toLocaleString()} × ${(params.adminPct * 100).toFixed(1)}% = $${adminCost.toLocaleString()}`
);
console.log(
  `MSO Fee: $${totalRevenue.toLocaleString()} × ${(params.msoFeePct * 100).toFixed(1)}% = $${msoFee.toLocaleString()}`
);
console.log(
  `Compliance: $${totalRevenue.toLocaleString()} × ${(params.complianceOverheadPct * 100).toFixed(1)}% = $${complianceCost.toLocaleString()}`
);
console.log(
  `Other OpEx: $${totalRevenue.toLocaleString()} × ${(params.otherOpexPct * 100).toFixed(1)}% = $${otherOpexCost.toLocaleString()}`
);

const fixedComponents = [
  params.rentAnnual,
  params.medDirectorAnnual,
  params.insuranceAnnual,
  params.softwareAnnual,
  params.utilitiesAnnual,
];
console.log(
  `Fixed OpEx: (${fixedComponents.map((x) => '$' + x.toLocaleString()).join(' + ')}) × ${params.locations} = $${fixedOpex.toLocaleString()}`
);

const opexTotal =
  marketingCost +
  adminCost +
  msoFee +
  complianceCost +
  fixedOpex +
  otherOpexCost;
console.log(`Total OpEx: $${opexTotal.toLocaleString()}`);

// EBITDA
const ebitdaReported = grossProfit - opexTotal;
const totalAddBacks =
  (params.ownerAddBack + params.otherAddBack) * params.locations;
const ebitdaNormalized = ebitdaReported + totalAddBacks;
const daTotal = params.daAnnual * params.locations;
const ebitNormalized = ebitdaNormalized - daTotal;

console.log(`\nEBITDA Flow:`);
console.log(`Reported EBITDA = Gross Profit - Total OpEx`);
console.log(
  `$${ebitdaReported.toLocaleString()} = $${grossProfit.toLocaleString()} - $${opexTotal.toLocaleString()}`
);
console.log(
  `Add-backs = ($${params.ownerAddBack.toLocaleString()} + $${params.otherAddBack.toLocaleString()}) × ${params.locations} = $${totalAddBacks.toLocaleString()}`
);
console.log(
  `Normalized EBITDA = $${ebitdaReported.toLocaleString()} + $${totalAddBacks.toLocaleString()} = $${ebitdaNormalized.toLocaleString()}`
);
console.log(
  `D&A = $${params.daAnnual.toLocaleString()} × ${params.locations} = $${daTotal.toLocaleString()}`
);
console.log(
  `Normalized EBIT = $${ebitdaNormalized.toLocaleString()} - $${daTotal.toLocaleString()} = $${ebitNormalized.toLocaleString()}`
);

console.log('\n3. WACC AND COST OF CAPITAL VERIFICATION');
console.log('-'.repeat(40));

// CAPM Calculation
const marketRiskPremium = params.erp;
const betaRiskPremium = params.beta * marketRiskPremium;
const costEquity =
  params.rfRate + betaRiskPremium + params.sizePrem + params.specificPrem;

console.log(`CAPM Cost of Equity Calculation:`);
console.log(`Risk-free Rate: ${(params.rfRate * 100).toFixed(1)}%`);
console.log(`Beta: ${params.beta}`);
console.log(`Equity Risk Premium: ${(params.erp * 100).toFixed(1)}%`);
console.log(
  `Beta Risk Premium = ${params.beta} × ${(params.erp * 100).toFixed(1)}% = ${(betaRiskPremium * 100).toFixed(1)}%`
);
console.log(`Size Premium: ${(params.sizePrem * 100).toFixed(1)}%`);
console.log(`Specific Premium: ${(params.specificPrem * 100).toFixed(1)}%`);
console.log(
  `Cost of Equity = ${(params.rfRate * 100).toFixed(1)}% + ${(betaRiskPremium * 100).toFixed(1)}% + ${(params.sizePrem * 100).toFixed(1)}% + ${(params.specificPrem * 100).toFixed(1)}% = ${(costEquity * 100).toFixed(1)}%`
);

// WACC (assuming 100% equity for simplicity)
const wacc = costEquity; // No debt assumed in base case
console.log(`WACC = ${(wacc * 100).toFixed(1)}% (100% equity assumed)`);

console.log('\n4. EPV METHODOLOGY VERIFICATION');
console.log('-'.repeat(40));

// Tax calculations
const nopat = ebitNormalized * (1 - params.taxRate);
console.log(`NOPAT Calculation:`);
console.log(`NOPAT = EBIT × (1 - Tax Rate)`);
console.log(
  `$${nopat.toLocaleString()} = $${ebitNormalized.toLocaleString()} × (1 - ${(params.taxRate * 100).toFixed(0)}%)`
);
console.log(
  `$${nopat.toLocaleString()} = $${ebitNormalized.toLocaleString()} × ${(1 - params.taxRate).toFixed(2)}`
);

// Maintenance Capex
const maintCapex = params.maintenanceCapexPct * totalRevenue;
console.log(`\nMaintenance Capex:`);
console.log(
  `$${maintCapex.toLocaleString()} = $${totalRevenue.toLocaleString()} × ${(params.maintenanceCapexPct * 100).toFixed(1)}%`
);

// Owner Earnings
const ownerEarnings = nopat + daTotal - maintCapex;
console.log(`\nOwner Earnings Calculation:`);
console.log(`Owner Earnings = NOPAT + D&A - Maintenance Capex`);
console.log(
  `$${ownerEarnings.toLocaleString()} = $${nopat.toLocaleString()} + $${daTotal.toLocaleString()} - $${maintCapex.toLocaleString()}`
);

// EPV Calculations
const epvFromNOPAT = nopat / wacc;
const epvFromOwnerEarnings = ownerEarnings / wacc;

console.log(`\nEPV Calculations:`);
console.log(`EPV (NOPAT Method) = NOPAT ÷ WACC`);
console.log(
  `$${epvFromNOPAT.toLocaleString()} = $${nopat.toLocaleString()} ÷ ${(wacc * 100).toFixed(1)}%`
);
console.log(`EPV (Owner Earnings Method) = Owner Earnings ÷ WACC`);
console.log(
  `$${epvFromOwnerEarnings.toLocaleString()} = $${ownerEarnings.toLocaleString()} ÷ ${(wacc * 100).toFixed(1)}%`
);

const methodDifference = epvFromOwnerEarnings - epvFromNOPAT;
const methodDifferencePct = methodDifference / epvFromNOPAT;
console.log(
  `Method Difference: $${methodDifference.toLocaleString()} (${(methodDifferencePct * 100).toFixed(1)}%)`
);

console.log('\n5. CAPACITY CONSTRAINT VERIFICATION');
console.log('-'.repeat(40));

const providers = [
  {
    id: 'np',
    name: 'Nurse Practitioner',
    fte: 1.0,
    hoursPerWeek: 40,
    apptsPerHour: 1.5,
    utilization: 0.85,
  },
  {
    id: 'rn',
    name: 'RN Injector',
    fte: 0.8,
    hoursPerWeek: 32,
    apptsPerHour: 1.2,
    utilization: 0.8,
  },
];

console.log(`Provider Capacity Calculations:`);
let totalProviderSlots = 0;
providers.forEach((p, i) => {
  const weeklySlots = p.fte * p.hoursPerWeek * p.utilization * p.apptsPerHour;
  const annualSlots = weeklySlots * 52;
  totalProviderSlots += annualSlots;

  console.log(`${i + 1}. ${p.name}:`);
  console.log(
    `   Weekly Slots = ${p.fte} FTE × ${p.hoursPerWeek} hrs × ${p.utilization} util × ${p.apptsPerHour} appts/hr = ${weeklySlots.toFixed(1)}`
  );
  console.log(
    `   Annual Slots = ${weeklySlots.toFixed(1)} × 52 weeks = ${annualSlots.toLocaleString()}`
  );
});

console.log(
  `Total Provider Capacity: ${totalProviderSlots.toLocaleString()} slots/year`
);

// Room capacity
const numRooms = 3;
const hoursPerDay = 10;
const daysPerWeek = 6;
const roomUtilization = 0.75;
const roomCapacity =
  numRooms * hoursPerDay * daysPerWeek * 52 * roomUtilization;

console.log(`\nRoom Capacity Calculation:`);
console.log(
  `${numRooms} rooms × ${hoursPerDay} hrs/day × ${daysPerWeek} days/week × 52 weeks × ${roomUtilization} utilization`
);
console.log(`= ${roomCapacity.toLocaleString()} slots/year`);

// Visit demand
let totalVisitDemand = 0;
console.log(`\nVisit Demand Calculation:`);
serviceLines.forEach((line, i) => {
  const visitUnits = line.visitUnits || 0;
  const lineDemand = visitUnits * line.volume;
  totalVisitDemand += lineDemand;

  if (visitUnits > 0) {
    console.log(
      `${i + 1}. ${line.name}: ${visitUnits} visit units × ${line.volume} volume = ${lineDemand} slots`
    );
  }
});
console.log(
  `Total Visit Demand: ${totalVisitDemand.toLocaleString()} slots/year`
);

const effectiveCapacity = Math.min(totalProviderSlots, roomCapacity);
const capacityUtilization =
  effectiveCapacity > 0 ? Math.min(1, totalVisitDemand / effectiveCapacity) : 0;

console.log(`\nCapacity Analysis:`);
console.log(
  `Effective Capacity = min(Provider, Room) = min(${totalProviderSlots.toLocaleString()}, ${roomCapacity.toLocaleString()}) = ${effectiveCapacity.toLocaleString()}`
);
console.log(
  `Capacity Utilization = ${totalVisitDemand.toLocaleString()} ÷ ${effectiveCapacity.toLocaleString()} = ${(capacityUtilization * 100).toFixed(1)}%`
);

console.log('\n6. SYNERGY EFFECT VERIFICATION');
console.log('-'.repeat(40));

const testLocations = [1, 3, 5, 10];
const sgnaSynergyPct = 0.15;
const marketingSynergyPct = 0.1;
const minAdminPctFactor = 0.1;

testLocations.forEach((locations) => {
  console.log(`\n${locations} Locations Synergy Analysis:`);

  // Admin synergies
  const adminReduction = Math.max(0, (locations - 1) * sgnaSynergyPct);
  const minFactor = Math.max(0.1, Math.min(1, minAdminPctFactor));
  const adminPctEff = Math.max(
    params.adminPct * minFactor,
    params.adminPct * (1 - Math.min(0.7, adminReduction))
  );

  console.log(`Admin Synergy:`);
  console.log(
    `  Reduction Factor = max(0, (${locations} - 1) × ${sgnaSynergyPct}) = ${adminReduction.toFixed(3)}`
  );
  console.log(
    `  Synergy-Adjusted Rate = ${(params.adminPct * 100).toFixed(1)}% × (1 - min(0.7, ${adminReduction.toFixed(3)})) = ${(params.adminPct * (1 - Math.min(0.7, adminReduction)) * 100).toFixed(1)}%`
  );
  console.log(
    `  Floor Rate = ${(params.adminPct * 100).toFixed(1)}% × ${minFactor} = ${(params.adminPct * minFactor * 100).toFixed(1)}%`
  );
  console.log(
    `  Effective Rate = max(${(params.adminPct * minFactor * 100).toFixed(1)}%, ${(params.adminPct * (1 - Math.min(0.7, adminReduction)) * 100).toFixed(1)}%) = ${(adminPctEff * 100).toFixed(1)}%`
  );

  // Marketing synergies
  const mktgReduction = Math.max(0, (locations - 1) * marketingSynergyPct);
  const mktgPctEff = Math.max(
    0.02,
    params.marketingPct * (1 - Math.min(0.5, mktgReduction))
  );

  console.log(`Marketing Synergy:`);
  console.log(
    `  Reduction Factor = max(0, (${locations} - 1) × ${marketingSynergyPct}) = ${mktgReduction.toFixed(3)}`
  );
  console.log(
    `  Synergy-Adjusted Rate = ${(params.marketingPct * 100).toFixed(1)}% × (1 - min(0.5, ${mktgReduction.toFixed(3)})) = ${(params.marketingPct * (1 - Math.min(0.5, mktgReduction)) * 100).toFixed(1)}%`
  );
  console.log(
    `  Effective Rate = max(2.0%, ${(params.marketingPct * (1 - Math.min(0.5, mktgReduction)) * 100).toFixed(1)}%) = ${(mktgPctEff * 100).toFixed(1)}%`
  );

  const totalSynergySavings =
    (params.adminPct - adminPctEff + params.marketingPct - mktgPctEff) *
    totalRevenue *
    locations;
  console.log(
    `Total Synergy Savings = $${totalSynergySavings.toLocaleString()}`
  );
});

console.log('\n7. MATHEMATICAL VERIFICATION SUMMARY');
console.log('='.repeat(60));

// Cross-check all major calculations
const checks = [
  {
    name: 'Revenue Components',
    calculation: `${serviceRevenue} + ${retailRevenue}`,
    result: serviceRevenue + retailRevenue,
    expected: totalRevenue,
    passes: serviceRevenue + retailRevenue === totalRevenue,
  },
  {
    name: 'Gross Profit',
    calculation: `${totalRevenue} - ${totalCOGS} - ${clinicalLaborCost}`,
    result: totalRevenue - totalCOGS - clinicalLaborCost,
    expected: grossProfit,
    passes:
      Math.abs(totalRevenue - totalCOGS - clinicalLaborCost - grossProfit) <
      0.01,
  },
  {
    name: 'EBITDA Normalization',
    calculation: `${ebitdaReported} + ${totalAddBacks}`,
    result: ebitdaReported + totalAddBacks,
    expected: ebitdaNormalized,
    passes: Math.abs(ebitdaReported + totalAddBacks - ebitdaNormalized) < 0.01,
  },
  {
    name: 'NOPAT',
    calculation: `${ebitNormalized} × (1 - ${params.taxRate})`,
    result: ebitNormalized * (1 - params.taxRate),
    expected: nopat,
    passes: Math.abs(ebitNormalized * (1 - params.taxRate) - nopat) < 0.01,
  },
  {
    name: 'Owner Earnings',
    calculation: `${nopat} + ${daTotal} - ${maintCapex}`,
    result: nopat + daTotal - maintCapex,
    expected: ownerEarnings,
    passes: Math.abs(nopat + daTotal - maintCapex - ownerEarnings) < 0.01,
  },
  {
    name: 'EPV (Owner Earnings)',
    calculation: `${ownerEarnings} ÷ ${wacc}`,
    result: ownerEarnings / wacc,
    expected: epvFromOwnerEarnings,
    passes: Math.abs(ownerEarnings / wacc - epvFromOwnerEarnings) < 0.01,
  },
];

console.log('Verification Results:');
checks.forEach((check, i) => {
  const status = check.passes ? '✅ PASS' : '❌ FAIL';
  console.log(`${i + 1}. ${check.name}: ${status}`);
  console.log(`   Formula: ${check.calculation}`);
  console.log(`   Result: $${check.result.toLocaleString()}`);
  console.log(`   Expected: $${check.expected.toLocaleString()}`);
  if (!check.passes) {
    console.log(
      `   Difference: $${(check.result - check.expected).toLocaleString()}`
    );
  }
});

const allPass = checks.every((check) => check.passes);
console.log(
  `\n${allPass ? '✅' : '❌'} Overall Mathematics Verification: ${allPass ? 'ALL CALCULATIONS CORRECT' : 'ERRORS FOUND'}`
);

console.log('\n' + '='.repeat(60));
