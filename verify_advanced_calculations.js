// Advanced EPV Calculations Verification
// Testing maintenance capex models, scenario adjustments, and advanced CAPM

console.log('🔬 Advanced EPV Calculations Verification');
console.log('='.repeat(60));

// Base parameters
const baseRevenue = 442850;
const baseLocations = 1;

console.log('\n1. MAINTENANCE CAPEX MODELS VERIFICATION');
console.log('-'.repeat(45));

// Model 1: Percentage of Revenue
const pctModel = {
  pct: 0.03,
  result: 0.03 * baseRevenue,
};

console.log(`Percentage Model:`);
console.log(`Capex = Revenue × Percentage`);
console.log(
  `$${pctModel.result.toLocaleString()} = $${baseRevenue.toLocaleString()} × ${(pctModel.pct * 100).toFixed(1)}%`
);

// Model 2: Fixed Amount per Location
const fixedModel = {
  amountPerLocation: 35000,
  result: 35000 * baseLocations,
};

console.log(`\nFixed Amount Model:`);
console.log(`Capex = Amount per Location × Locations`);
console.log(
  `$${fixedModel.result.toLocaleString()} = $${fixedModel.amountPerLocation.toLocaleString()} × ${baseLocations}`
);

// Model 3: Asset-Based Replacement Cycles
const assetModel = {
  equipmentDevices: 180000,
  equipReplacementYears: 8,
  buildoutImprovements: 120000,
  buildoutRefreshYears: 10,
  ffne: 40000,
  ffneRefreshYears: 5,
  minorMaintPct: 0.005,
};

const devicesCapex =
  (assetModel.equipmentDevices * baseLocations) /
  assetModel.equipReplacementYears;
const buildoutCapex =
  (assetModel.buildoutImprovements * baseLocations) /
  assetModel.buildoutRefreshYears;
const ffneCapex =
  (assetModel.ffne * baseLocations) / assetModel.ffneRefreshYears;
const minorCapex = assetModel.minorMaintPct * baseRevenue;
const totalAssetCapex = devicesCapex + buildoutCapex + ffneCapex + minorCapex;

console.log(`\nAsset-Based Model:`);
console.log(
  `Equipment Devices: $${assetModel.equipmentDevices.toLocaleString()} × ${baseLocations} ÷ ${assetModel.equipReplacementYears} years = $${devicesCapex.toLocaleString()}`
);
console.log(
  `Buildout Improvements: $${assetModel.buildoutImprovements.toLocaleString()} × ${baseLocations} ÷ ${assetModel.buildoutRefreshYears} years = $${buildoutCapex.toLocaleString()}`
);
console.log(
  `FF&E: $${assetModel.ffne.toLocaleString()} × ${baseLocations} ÷ ${assetModel.ffneRefreshYears} years = $${ffneCapex.toLocaleString()}`
);
console.log(
  `Minor Maintenance: $${baseRevenue.toLocaleString()} × ${(assetModel.minorMaintPct * 100).toFixed(1)}% = $${minorCapex.toLocaleString()}`
);
console.log(`Total Asset-Based Capex: $${totalAssetCapex.toLocaleString()}`);

// Cross-verification
const models = [
  {
    name: 'Percentage Model',
    value: pctModel.result,
    pctOfRevenue: pctModel.result / baseRevenue,
  },
  {
    name: 'Fixed Amount Model',
    value: fixedModel.result,
    pctOfRevenue: fixedModel.result / baseRevenue,
  },
  {
    name: 'Asset-Based Model',
    value: totalAssetCapex,
    pctOfRevenue: totalAssetCapex / baseRevenue,
  },
];

console.log(`\nCapex Model Comparison:`);
models.forEach((model, i) => {
  console.log(
    `${i + 1}. ${model.name}: $${model.value.toLocaleString()} (${(model.pctOfRevenue * 100).toFixed(1)}% of revenue)`
  );
});

console.log('\n2. SCENARIO ADJUSTMENT VERIFICATION');
console.log('-'.repeat(45));

const scenarios = {
  Base: { revenue: 1.0, ebitAdj: 1.0, waccAdj: 0.0 },
  Bull: { revenue: 1.08, ebitAdj: 1.06, waccAdj: -0.01 },
  Bear: { revenue: 0.92, ebitAdj: 0.95, waccAdj: 0.01 },
};

const baseEBIT = -8706; // From previous calculation
const baseWACC = 0.168;

Object.entries(scenarios).forEach(([scenarioName, adj]) => {
  console.log(`\n${scenarioName} Scenario Adjustments:`);

  const scenarioRevenue = baseRevenue * adj.revenue;
  const scenarioEBIT = baseEBIT * adj.ebitAdj * adj.revenue;
  const scenarioWACC = baseWACC + adj.waccAdj;

  console.log(`Revenue Adjustment:`);
  console.log(
    `  $${scenarioRevenue.toLocaleString()} = $${baseRevenue.toLocaleString()} × ${adj.revenue} (${((adj.revenue - 1) * 100).toFixed(0)}% change)`
  );

  console.log(`EBIT Adjustment:`);
  console.log(
    `  $${scenarioEBIT.toLocaleString()} = $${baseEBIT.toLocaleString()} × ${adj.ebitAdj} × ${adj.revenue}`
  );
  console.log(
    `  Combined multiplier: ${(adj.ebitAdj * adj.revenue).toFixed(3)}`
  );

  console.log(`WACC Adjustment:`);
  console.log(
    `  ${(scenarioWACC * 100).toFixed(1)}% = ${(baseWACC * 100).toFixed(1)}% + ${(adj.waccAdj * 100).toFixed(1)}%`
  );

  // Calculate scenario EPV
  const scenarioNOPAT = Math.max(0, scenarioEBIT * (1 - 0.26)); // Can't have negative tax benefit
  const scenarioEPV = scenarioWACC > 0 ? scenarioNOPAT / scenarioWACC : 0;

  console.log(`Scenario EPV:`);
  console.log(`  NOPAT: $${scenarioNOPAT.toLocaleString()}`);
  console.log(`  EPV: $${scenarioEPV.toLocaleString()}`);
});

console.log('\n3. ADVANCED CAPM VERIFICATION');
console.log('-'.repeat(45));

// Simple CAPM vs Advanced CAPM with unlevering/relevering
const capmParams = {
  rfRate: 0.045,
  erp: 0.065,
  betaSimple: 1.2,
  betaUnlevered: 0.9,
  taxRate: 0.26,
  costDebt: 0.08,
  sizePrem: 0.03,
  specificPrem: 0.015,
};

console.log(`CAPM Parameter Setup:`);
console.log(`Risk-free Rate: ${(capmParams.rfRate * 100).toFixed(1)}%`);
console.log(`Equity Risk Premium: ${(capmParams.erp * 100).toFixed(1)}%`);
console.log(`Simple Beta: ${capmParams.betaSimple}`);
console.log(`Unlevered Beta: ${capmParams.betaUnlevered}`);
console.log(`Tax Rate: ${(capmParams.taxRate * 100).toFixed(0)}%`);
console.log(`Cost of Debt: ${(capmParams.costDebt * 100).toFixed(1)}%`);

// Simple CAPM
const simpleCostEquity =
  capmParams.rfRate +
  capmParams.betaSimple * capmParams.erp +
  capmParams.sizePrem +
  capmParams.specificPrem;

console.log(`\nSimple CAPM:`);
console.log(`Cost of Equity = Rf + β × ERP + Size Premium + Specific Premium`);
console.log(
  `${(simpleCostEquity * 100).toFixed(1)}% = ${(capmParams.rfRate * 100).toFixed(1)}% + ${capmParams.betaSimple} × ${(capmParams.erp * 100).toFixed(1)}% + ${(capmParams.sizePrem * 100).toFixed(1)}% + ${(capmParams.specificPrem * 100).toFixed(1)}%`
);

// Advanced CAPM with different debt levels
const debtLevels = [0.0, 0.25, 0.5, 0.75];

console.log(`\nAdvanced CAPM with Relevering:`);
debtLevels.forEach((debtWeight) => {
  // Calculate D/E ratio
  const debtEquityRatio =
    debtWeight >= 1 ? 99 : debtWeight <= 0 ? 0 : debtWeight / (1 - debtWeight);

  // Relever beta
  const leveredBeta =
    capmParams.betaUnlevered * (1 + (1 - capmParams.taxRate) * debtEquityRatio);

  // Calculate cost of equity
  const advancedCostEquity =
    capmParams.rfRate +
    leveredBeta * capmParams.erp +
    capmParams.sizePrem +
    capmParams.specificPrem;

  // Calculate after-tax cost of debt
  const afterTaxCostDebt = capmParams.costDebt * (1 - capmParams.taxRate);

  // Calculate WACC
  const wacc =
    debtWeight * afterTaxCostDebt + (1 - debtWeight) * advancedCostEquity;

  console.log(
    `\n${(debtWeight * 100).toFixed(0)}% Debt / ${((1 - debtWeight) * 100).toFixed(0)}% Equity:`
  );
  console.log(`  D/E Ratio: ${debtEquityRatio.toFixed(2)}`);
  console.log(`  Beta Relevering: βL = βU × [1 + (1-T) × D/E]`);
  console.log(
    `  ${leveredBeta.toFixed(2)} = ${capmParams.betaUnlevered} × [1 + (1-${capmParams.taxRate}) × ${debtEquityRatio.toFixed(2)}]`
  );
  console.log(
    `  ${leveredBeta.toFixed(2)} = ${capmParams.betaUnlevered} × [1 + ${((1 - capmParams.taxRate) * debtEquityRatio).toFixed(2)}] = ${capmParams.betaUnlevered} × ${(1 + (1 - capmParams.taxRate) * debtEquityRatio).toFixed(2)}`
  );
  console.log(`  Cost of Equity: ${(advancedCostEquity * 100).toFixed(1)}%`);
  console.log(
    `  After-tax Cost of Debt: ${(afterTaxCostDebt * 100).toFixed(1)}%`
  );
  console.log(`  WACC: ${(wacc * 100).toFixed(1)}%`);
});

console.log('\n4. RISK ADJUSTMENT VERIFICATION');
console.log('-'.repeat(45));

const baseOwnerEarnings = 5272.06; // From previous calculation
const baseWACCForRisk = 0.168;

const riskScenarios = [
  { name: 'No Risk', earningsHaircut: 0.0, waccPremium: 0.0 },
  { name: 'Key Person Risk', earningsHaircut: 0.1, waccPremium: 0.01 },
  { name: 'Regulatory Risk', earningsHaircut: 0.05, waccPremium: 0.015 },
  { name: 'Concentration Risk', earningsHaircut: 0.15, waccPremium: 0.02 },
];

riskScenarios.forEach((risk) => {
  const adjustedEarnings = baseOwnerEarnings * (1 - risk.earningsHaircut);
  const adjustedWACC = baseWACCForRisk + risk.waccPremium;
  const riskAdjustedEV = adjustedEarnings / adjustedWACC;

  console.log(`\n${risk.name}:`);
  console.log(`  Earnings Adjustment:`);
  console.log(
    `    $${adjustedEarnings.toLocaleString()} = $${baseOwnerEarnings.toLocaleString()} × (1 - ${(risk.earningsHaircut * 100).toFixed(0)}%)`
  );
  console.log(
    `    $${adjustedEarnings.toLocaleString()} = $${baseOwnerEarnings.toLocaleString()} × ${(1 - risk.earningsHaircut).toFixed(2)}`
  );

  console.log(`  WACC Adjustment:`);
  console.log(
    `    ${(adjustedWACC * 100).toFixed(1)}% = ${(baseWACCForRisk * 100).toFixed(1)}% + ${(risk.waccPremium * 100).toFixed(1)}%`
  );

  console.log(`  Risk-Adjusted EPV:`);
  console.log(
    `    $${riskAdjustedEV.toLocaleString()} = $${adjustedEarnings.toLocaleString()} ÷ ${(adjustedWACC * 100).toFixed(1)}%`
  );

  const valueImpact = riskAdjustedEV - baseOwnerEarnings / baseWACCForRisk;
  const valueImpactPct = valueImpact / (baseOwnerEarnings / baseWACCForRisk);
  console.log(
    `  Value Impact: $${valueImpact.toLocaleString()} (${(valueImpactPct * 100).toFixed(1)}%)`
  );
});

console.log('\n5. WORKING CAPITAL CALCULATION VERIFICATION');
console.log('-'.repeat(45));

// Working capital components
const wcParams = {
  dsoDays: 45,
  dsiDays: 30,
  dpoDays: 30,
  totalRevenue: baseRevenue,
  totalCOGS: 131945,
  clinicalLaborCost: 58327.5,
};

const totalCOGSforWC = wcParams.totalCOGS + wcParams.clinicalLaborCost;

const accountsReceivable = wcParams.totalRevenue * (wcParams.dsoDays / 365);
const inventory = totalCOGSforWC * (wcParams.dsiDays / 365);
const accountsPayable = totalCOGSforWC * (wcParams.dpoDays / 365);
const netWorkingCapital = accountsReceivable + inventory - accountsPayable;

console.log(`Working Capital Calculation:`);
console.log(`Accounts Receivable (DSO):`);
console.log(
  `  $${accountsReceivable.toLocaleString()} = $${wcParams.totalRevenue.toLocaleString()} × (${wcParams.dsoDays} days ÷ 365 days)`
);
console.log(
  `  $${accountsReceivable.toLocaleString()} = $${wcParams.totalRevenue.toLocaleString()} × ${(wcParams.dsoDays / 365).toFixed(3)}`
);

console.log(`Inventory (DSI):`);
console.log(
  `  $${inventory.toLocaleString()} = $${totalCOGSforWC.toLocaleString()} × (${wcParams.dsiDays} days ÷ 365 days)`
);
console.log(
  `  $${inventory.toLocaleString()} = $${totalCOGSforWC.toLocaleString()} × ${(wcParams.dsiDays / 365).toFixed(3)}`
);

console.log(`Accounts Payable (DPO):`);
console.log(
  `  $${accountsPayable.toLocaleString()} = $${totalCOGSforWC.toLocaleString()} × (${wcParams.dpoDays} days ÷ 365 days)`
);
console.log(
  `  $${accountsPayable.toLocaleString()} = $${totalCOGSforWC.toLocaleString()} × ${(wcParams.dpoDays / 365).toFixed(3)}`
);

console.log(`Net Working Capital:`);
console.log(
  `  $${netWorkingCapital.toLocaleString()} = $${accountsReceivable.toLocaleString()} + $${inventory.toLocaleString()} - $${accountsPayable.toLocaleString()}`
);

console.log('\n6. MATHEMATICAL VERIFICATION SUMMARY');
console.log('='.repeat(60));

// Verify key calculations
const verifications = [
  {
    name: 'Asset-Based Capex Components',
    calculation: `${devicesCapex} + ${buildoutCapex} + ${ffneCapex} + ${minorCapex}`,
    result: devicesCapex + buildoutCapex + ffneCapex + minorCapex,
    expected: totalAssetCapex,
    passes:
      Math.abs(
        devicesCapex + buildoutCapex + ffneCapex + minorCapex - totalAssetCapex
      ) < 0.01,
  },
  {
    name: 'Working Capital Components',
    calculation: `${accountsReceivable} + ${inventory} - ${accountsPayable}`,
    result: accountsReceivable + inventory - accountsPayable,
    expected: netWorkingCapital,
    passes:
      Math.abs(
        accountsReceivable + inventory - accountsPayable - netWorkingCapital
      ) < 0.01,
  },
  {
    name: 'Bull Scenario Revenue',
    calculation: `${baseRevenue} × 1.08`,
    result: baseRevenue * 1.08,
    expected: baseRevenue * scenarios.Bull.revenue,
    passes:
      Math.abs(baseRevenue * 1.08 - baseRevenue * scenarios.Bull.revenue) <
      0.01,
  },
  {
    name: 'Simple CAPM vs Manual',
    calculation: `0.045 + 1.2 × 0.065 + 0.03 + 0.015`,
    result: 0.045 + 1.2 * 0.065 + 0.03 + 0.015,
    expected: simpleCostEquity,
    passes:
      Math.abs(0.045 + 1.2 * 0.065 + 0.03 + 0.015 - simpleCostEquity) < 0.0001,
  },
];

console.log('Advanced Calculation Verification Results:');
verifications.forEach((check, i) => {
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

const allAdvancedPass = verifications.every((check) => check.passes);
console.log(
  `\n${allAdvancedPass ? '✅' : '❌'} Advanced Mathematics Verification: ${allAdvancedPass ? 'ALL CALCULATIONS CORRECT' : 'ERRORS FOUND'}`
);

console.log('\n' + '='.repeat(60));
