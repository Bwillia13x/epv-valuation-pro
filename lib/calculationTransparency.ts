// Mathematical Transparency System for EPV Calculations
// Provides comprehensive audit trails and step-by-step calculation breakdowns

export interface CalculationStep {
  id: string;
  description: string;
  formula: string;
  inputs: Record<string, number | string>;
  calculation: string;
  result: number;
  unit?: string;
  category: string;
}

export interface CalculationAuditTrail {
  timestamp: number;
  category: string;
  steps: CalculationStep[];
  finalResult: number;
  resultDescription: string;
}

export interface ServiceLine {
  id: string;
  name: string;
  price: number;
  volume: number;
  cogsPct: number;
  kind: 'service' | 'retail';
  visitUnits: number;
  isMembership?: boolean;
}

export interface TransparencyInputs {
  // Service lines and revenue
  serviceLines: ServiceLine[];
  locations: number;
  effectiveVolumesOverall: Map<string, number>;
  totalRevenueBase: number;
  serviceRevenue: number;
  retailRevenue: number;

  // Cost structure
  totalCOGS: number;
  clinicalLaborCost: number;
  clinicalLaborPct: number;
  clinicalLaborPctEff: number;
  laborMarketAdj: number;
  grossProfit: number;

  // Operating expenses
  marketingCost: number;
  marketingPct: number;
  marketingPctEff: number;
  marketingSynergyPct: number;
  adminCost: number;
  adminPct: number;
  adminPctEff: number;
  sgnaSynergyPct: number;
  minAdminPctFactor: number;
  fixedOpex: number;
  rentAnnual: number;
  medDirectorAnnual: number;
  insuranceAnnual: number;
  softwareAnnual: number;
  utilitiesAnnual: number;
  msoFee: number;
  msoFeePct: number;
  complianceCost: number;
  complianceOverheadPct: number;
  otherOpexCost: number;
  otherOpexPct: number;
  opexTotal: number;

  // Earnings
  ebitdaReported: number;
  ebitdaNormalized: number;
  ownerAddBack: number;
  otherAddBack: number;
  ebitNormalized: number;
  ebitMargin: number;
  daTotal: number;
  daAnnual: number;

  // Capex
  maintCapexBase: number;
  maintCapexScenario: number;
  maintCapexModelBase: number;
  capexMode: 'model' | 'percent' | 'amount';
  maintenanceCapexPct: number;
  maintenanceCapexAmount: number;
  equipmentDevices: number;
  equipReplacementYears: number;
  buildoutImprovements: number;
  buildoutRefreshYears: number;
  ffne: number;
  ffneRefreshYears: number;
  minorMaintPct: number;

  // Valuation
  scenarioWacc: number;
  baseWacc: number;
  costEquity: number;
  afterTaxCostDebt: number;
  betaEff: number;
  rfRate: number;
  erp: number;
  sizePrem: number;
  specificPrem: number;
  targetDebtWeight: number;
  costDebt: number;
  taxRate: number;
  scenarioAdj: { revenue: number; ebitAdj: number; waccAdj: number };
  riskWaccPremium: number;

  // EPV
  nopatScenario: number;
  ownerEarningsScenario: number;
  adjustedEarningsScenario: number;
  riskEarningsHaircut: number;
  enterpriseEPV: number;
  equityEPV: number;
  cashNonOperating: number;
  debtInterestBearing: number;
  ebitScenario: number;
  epvMethod: 'Owner Earnings' | 'NOPAT (EBIT-based)';
  scenario: string;

  // Working capital
  totalCOGSForWC: number;
  accountsReceivable: number;
  inventory: number;
  accountsPayable: number;
  netWorkingCapital: number;
  dsoDays: number;
  dsiDays: number;
  dpoDays: number;
}

export function generateCalculationAuditTrail(
  inputs: TransparencyInputs
): CalculationAuditTrail[] {
  const trails: CalculationAuditTrail[] = [];
  const timestamp = Date.now();

  // 1. REVENUE CALCULATION AUDIT TRAIL
  const revenueSteps: CalculationStep[] = [];

  inputs.serviceLines.forEach((line, idx) => {
    const effectiveVolume =
      inputs.effectiveVolumesOverall.get(line.id) ??
      line.volume * inputs.locations;
    revenueSteps.push({
      id: `revenue_${line.id}`,
      description: `${line.name} Revenue Calculation`,
      formula: 'Revenue = Price per Unit × Annual Volume × Locations',
      inputs: {
        'Price per Unit': line.price,
        'Annual Volume': line.volume,
        Locations: inputs.locations,
        'Effective Volume (after capacity)': effectiveVolume,
      },
      calculation: `$${line.price.toLocaleString()} × ${effectiveVolume.toLocaleString()} = $${(line.price * effectiveVolume).toLocaleString()}`,
      result: line.price * effectiveVolume,
      unit: 'USD',
      category: 'Revenue',
    });
  });

  revenueSteps.push({
    id: 'total_revenue',
    description: 'Total Revenue Aggregation',
    formula: 'Total Revenue = Σ(Individual Service Line Revenues)',
    inputs: Object.fromEntries(
      inputs.serviceLines.map((line) => [
        line.name,
        line.price *
          (inputs.effectiveVolumesOverall.get(line.id) ??
            line.volume * inputs.locations),
      ])
    ),
    calculation:
      inputs.serviceLines
        .map(
          (line) =>
            `$${(line.price * (inputs.effectiveVolumesOverall.get(line.id) ?? line.volume * inputs.locations)).toLocaleString()}`
        )
        .join(' + ') + ` = $${inputs.totalRevenueBase.toLocaleString()}`,
    result: inputs.totalRevenueBase,
    unit: 'USD',
    category: 'Revenue',
  });

  trails.push({
    timestamp,
    category: 'Revenue Analysis',
    steps: revenueSteps,
    finalResult: inputs.totalRevenueBase,
    resultDescription: 'Total Revenue (Base Case)',
  });

  // 2. COST STRUCTURE AUDIT TRAIL
  const costSteps: CalculationStep[] = [];

  // COGS Calculation
  inputs.serviceLines.forEach((line) => {
    const effectiveVolume =
      inputs.effectiveVolumesOverall.get(line.id) ??
      line.volume * inputs.locations;
    const lineRevenue = line.price * effectiveVolume;
    const lineCOGS = lineRevenue * line.cogsPct;

    costSteps.push({
      id: `cogs_${line.id}`,
      description: `${line.name} COGS Calculation`,
      formula: 'COGS = Revenue × COGS Percentage',
      inputs: {
        Revenue: lineRevenue,
        'COGS %': line.cogsPct * 100,
      },
      calculation: `$${lineRevenue.toLocaleString()} × ${(line.cogsPct * 100).toFixed(1)}% = $${lineCOGS.toLocaleString()}`,
      result: lineCOGS,
      unit: 'USD',
      category: 'COGS',
    });
  });

  costSteps.push({
    id: 'total_cogs',
    description: 'Total COGS Aggregation',
    formula: 'Total COGS = Σ(Individual Service Line COGS)',
    inputs: { 'Service Lines COGS': inputs.totalCOGS },
    calculation: `Total COGS = $${inputs.totalCOGS.toLocaleString()}`,
    result: inputs.totalCOGS,
    unit: 'USD',
    category: 'COGS',
  });

  // Clinical Labor Calculation
  costSteps.push({
    id: 'clinical_labor_pct_effective',
    description: 'Effective Clinical Labor Percentage',
    formula:
      'Effective Clinical Labor % = Base Clinical Labor % × Labor Market Adjustment',
    inputs: {
      'Base Clinical Labor %': inputs.clinicalLaborPct * 100,
      'Labor Market Adjustment': inputs.laborMarketAdj,
    },
    calculation: `${(inputs.clinicalLaborPct * 100).toFixed(1)}% × ${inputs.laborMarketAdj.toFixed(2)} = ${(inputs.clinicalLaborPctEff * 100).toFixed(1)}%`,
    result: inputs.clinicalLaborPctEff,
    unit: 'percentage',
    category: 'Labor Costs',
  });

  costSteps.push({
    id: 'clinical_labor_cost',
    description: 'Clinical Labor Cost Calculation',
    formula:
      'Clinical Labor Cost = Service Revenue × Effective Clinical Labor %',
    inputs: {
      'Service Revenue': inputs.serviceRevenue,
      'Effective Clinical Labor %': inputs.clinicalLaborPctEff * 100,
    },
    calculation: `$${inputs.serviceRevenue.toLocaleString()} × ${(inputs.clinicalLaborPctEff * 100).toFixed(1)}% = $${inputs.clinicalLaborCost.toLocaleString()}`,
    result: inputs.clinicalLaborCost,
    unit: 'USD',
    category: 'Labor Costs',
  });

  // Gross Profit
  costSteps.push({
    id: 'gross_profit',
    description: 'Gross Profit Calculation',
    formula: 'Gross Profit = Total Revenue - Total COGS - Clinical Labor Cost',
    inputs: {
      'Total Revenue': inputs.totalRevenueBase,
      'Total COGS': inputs.totalCOGS,
      'Clinical Labor Cost': inputs.clinicalLaborCost,
    },
    calculation: `$${inputs.totalRevenueBase.toLocaleString()} - $${inputs.totalCOGS.toLocaleString()} - $${inputs.clinicalLaborCost.toLocaleString()} = $${inputs.grossProfit.toLocaleString()}`,
    result: inputs.grossProfit,
    unit: 'USD',
    category: 'Profitability',
  });

  trails.push({
    timestamp,
    category: 'Cost Structure Analysis',
    steps: costSteps,
    finalResult: inputs.grossProfit,
    resultDescription: 'Gross Profit',
  });

  // 3. OPERATING EXPENSES AUDIT TRAIL
  const opexSteps: CalculationStep[] = [];

  // Marketing with synergies
  opexSteps.push({
    id: 'marketing_pct_effective',
    description: 'Effective Marketing Percentage (with synergies)',
    formula:
      'Effective Marketing % = Marketing % × (1 - min(0.5, (Locations - 1) × Marketing Synergy %))',
    inputs: {
      'Base Marketing %': inputs.marketingPct * 100,
      Locations: inputs.locations,
      'Marketing Synergy %': inputs.marketingSynergyPct * 100,
    },
    calculation: `${(inputs.marketingPct * 100).toFixed(1)}% × (1 - min(0.5, (${inputs.locations} - 1) × ${(inputs.marketingSynergyPct * 100).toFixed(1)}%)) = ${(inputs.marketingPctEff * 100).toFixed(1)}%`,
    result: inputs.marketingPctEff,
    unit: 'percentage',
    category: 'Operating Expenses',
  });

  opexSteps.push({
    id: 'marketing_cost',
    description: 'Marketing Cost Calculation',
    formula: 'Marketing Cost = Total Revenue × Effective Marketing %',
    inputs: {
      'Total Revenue': inputs.totalRevenueBase,
      'Effective Marketing %': inputs.marketingPctEff * 100,
    },
    calculation: `$${inputs.totalRevenueBase.toLocaleString()} × ${(inputs.marketingPctEff * 100).toFixed(1)}% = $${inputs.marketingCost.toLocaleString()}`,
    result: inputs.marketingCost,
    unit: 'USD',
    category: 'Operating Expenses',
  });

  // Admin with synergies
  opexSteps.push({
    id: 'admin_pct_effective',
    description: 'Effective Admin Percentage (with synergies)',
    formula:
      'Effective Admin % = max(Admin % × Min Factor, Admin % × (1 - min(0.7, (Locations - 1) × SG&A Synergy %)))',
    inputs: {
      'Base Admin %': inputs.adminPct * 100,
      Locations: inputs.locations,
      'SG&A Synergy %': inputs.sgnaSynergyPct * 100,
      'Min Admin Factor': inputs.minAdminPctFactor,
    },
    calculation: `max(${(inputs.adminPct * 100).toFixed(1)}% × ${inputs.minAdminPctFactor.toFixed(2)}, ${(inputs.adminPct * 100).toFixed(1)}% × (1 - min(0.7, (${inputs.locations} - 1) × ${(inputs.sgnaSynergyPct * 100).toFixed(1)}%))) = ${(inputs.adminPctEff * 100).toFixed(1)}%`,
    result: inputs.adminPctEff,
    unit: 'percentage',
    category: 'Operating Expenses',
  });

  opexSteps.push({
    id: 'admin_cost',
    description: 'Admin Cost Calculation',
    formula: 'Admin Cost = Total Revenue × Effective Admin %',
    inputs: {
      'Total Revenue': inputs.totalRevenueBase,
      'Effective Admin %': inputs.adminPctEff * 100,
    },
    calculation: `$${inputs.totalRevenueBase.toLocaleString()} × ${(inputs.adminPctEff * 100).toFixed(1)}% = $${inputs.adminCost.toLocaleString()}`,
    result: inputs.adminCost,
    unit: 'USD',
    category: 'Operating Expenses',
  });

  // Fixed costs
  opexSteps.push({
    id: 'fixed_opex',
    description: 'Fixed Operating Expenses',
    formula:
      'Fixed OpEx = (Rent + Medical Director + Insurance + Software + Utilities) × Locations',
    inputs: {
      'Rent (annual)': inputs.rentAnnual,
      'Medical Director': inputs.medDirectorAnnual,
      Insurance: inputs.insuranceAnnual,
      Software: inputs.softwareAnnual,
      Utilities: inputs.utilitiesAnnual,
      Locations: inputs.locations,
    },
    calculation: `($${inputs.rentAnnual.toLocaleString()} + $${inputs.medDirectorAnnual.toLocaleString()} + $${inputs.insuranceAnnual.toLocaleString()} + $${inputs.softwareAnnual.toLocaleString()} + $${inputs.utilitiesAnnual.toLocaleString()}) × ${inputs.locations} = $${inputs.fixedOpex.toLocaleString()}`,
    result: inputs.fixedOpex,
    unit: 'USD',
    category: 'Operating Expenses',
  });

  // MSO Fee
  opexSteps.push({
    id: 'mso_fee',
    description: 'MSO Fee Calculation',
    formula: 'MSO Fee = Total Revenue × MSO Fee %',
    inputs: {
      'Total Revenue': inputs.totalRevenueBase,
      'MSO Fee %': inputs.msoFeePct * 100,
    },
    calculation: `$${inputs.totalRevenueBase.toLocaleString()} × ${(inputs.msoFeePct * 100).toFixed(1)}% = $${inputs.msoFee.toLocaleString()}`,
    result: inputs.msoFee,
    unit: 'USD',
    category: 'Operating Expenses',
  });

  opexSteps.push({
    id: 'total_opex',
    description: 'Total Operating Expenses',
    formula:
      'Total OpEx = Marketing + Admin + Fixed Costs + MSO Fee + Compliance + Other OpEx',
    inputs: {
      Marketing: inputs.marketingCost,
      Admin: inputs.adminCost,
      'Fixed Costs': inputs.fixedOpex,
      'MSO Fee': inputs.msoFee,
      Compliance: inputs.complianceCost,
      'Other OpEx': inputs.otherOpexCost,
    },
    calculation: `$${inputs.marketingCost.toLocaleString()} + $${inputs.adminCost.toLocaleString()} + $${inputs.fixedOpex.toLocaleString()} + $${inputs.msoFee.toLocaleString()} + $${inputs.complianceCost.toLocaleString()} + $${inputs.otherOpexCost.toLocaleString()} = $${inputs.opexTotal.toLocaleString()}`,
    result: inputs.opexTotal,
    unit: 'USD',
    category: 'Operating Expenses',
  });

  trails.push({
    timestamp,
    category: 'Operating Expenses Analysis',
    steps: opexSteps,
    finalResult: inputs.opexTotal,
    resultDescription: 'Total Operating Expenses',
  });

  // 4. EBITDA AND EARNINGS AUDIT TRAIL
  const earningsSteps: CalculationStep[] = [];

  earningsSteps.push({
    id: 'ebitda_reported',
    description: 'Reported EBITDA',
    formula: 'EBITDA (Reported) = Gross Profit - Total Operating Expenses',
    inputs: {
      'Gross Profit': inputs.grossProfit,
      'Total Operating Expenses': inputs.opexTotal,
    },
    calculation: `$${inputs.grossProfit.toLocaleString()} - $${inputs.opexTotal.toLocaleString()} = $${inputs.ebitdaReported.toLocaleString()}`,
    result: inputs.ebitdaReported,
    unit: 'USD',
    category: 'Earnings',
  });

  earningsSteps.push({
    id: 'ebitda_normalized',
    description: 'Normalized EBITDA (with add-backs)',
    formula:
      'EBITDA (Normalized) = EBITDA (Reported) + (Owner Add-back + Other Add-back) × Locations',
    inputs: {
      'EBITDA (Reported)': inputs.ebitdaReported,
      'Owner Add-back': inputs.ownerAddBack,
      'Other Add-back': inputs.otherAddBack,
      Locations: inputs.locations,
    },
    calculation: `$${inputs.ebitdaReported.toLocaleString()} + ($${inputs.ownerAddBack.toLocaleString()} + $${inputs.otherAddBack.toLocaleString()}) × ${inputs.locations} = $${inputs.ebitdaNormalized.toLocaleString()}`,
    result: inputs.ebitdaNormalized,
    unit: 'USD',
    category: 'Earnings',
  });

  earningsSteps.push({
    id: 'ebit_normalized',
    description: 'Normalized EBIT',
    formula:
      'EBIT (Normalized) = EBITDA (Normalized) - Depreciation & Amortization',
    inputs: {
      'EBITDA (Normalized)': inputs.ebitdaNormalized,
      'D&A': inputs.daTotal,
    },
    calculation: `$${inputs.ebitdaNormalized.toLocaleString()} - $${inputs.daTotal.toLocaleString()} = $${inputs.ebitNormalized.toLocaleString()}`,
    result: inputs.ebitNormalized,
    unit: 'USD',
    category: 'Earnings',
  });

  earningsSteps.push({
    id: 'ebit_margin',
    description: 'EBIT Margin Calculation',
    formula: 'EBIT Margin = EBIT (Normalized) ÷ Total Revenue',
    inputs: {
      'EBIT (Normalized)': inputs.ebitNormalized,
      'Total Revenue': inputs.totalRevenueBase,
    },
    calculation: `$${inputs.ebitNormalized.toLocaleString()} ÷ $${inputs.totalRevenueBase.toLocaleString()} = ${(inputs.ebitMargin * 100).toFixed(1)}%`,
    result: inputs.ebitMargin,
    unit: 'percentage',
    category: 'Margins',
  });

  trails.push({
    timestamp,
    category: 'Earnings Analysis',
    steps: earningsSteps,
    finalResult: inputs.ebitdaNormalized,
    resultDescription: 'Normalized EBITDA',
  });

  // 5. MAINTENANCE CAPEX AUDIT TRAIL
  const capexSteps: CalculationStep[] = [];

  if (inputs.capexMode === 'model') {
    capexSteps.push({
      id: 'equipment_capex',
      description: 'Equipment Replacement Capex',
      formula:
        'Equipment Capex = (Equipment Cost × Locations) ÷ Replacement Years',
      inputs: {
        'Equipment Cost': inputs.equipmentDevices,
        Locations: inputs.locations,
        'Replacement Years': inputs.equipReplacementYears,
      },
      calculation: `($${inputs.equipmentDevices.toLocaleString()} × ${inputs.locations}) ÷ ${inputs.equipReplacementYears} = $${((inputs.equipmentDevices * inputs.locations) / Math.max(1, inputs.equipReplacementYears)).toLocaleString()}`,
      result:
        (inputs.equipmentDevices * inputs.locations) /
        Math.max(1, inputs.equipReplacementYears),
      unit: 'USD',
      category: 'Capex',
    });

    capexSteps.push({
      id: 'buildout_capex',
      description: 'Buildout Refresh Capex',
      formula: 'Buildout Capex = (Buildout Cost × Locations) ÷ Refresh Years',
      inputs: {
        'Buildout Cost': inputs.buildoutImprovements,
        Locations: inputs.locations,
        'Refresh Years': inputs.buildoutRefreshYears,
      },
      calculation: `($${inputs.buildoutImprovements.toLocaleString()} × ${inputs.locations}) ÷ ${inputs.buildoutRefreshYears} = $${((inputs.buildoutImprovements * inputs.locations) / Math.max(1, inputs.buildoutRefreshYears)).toLocaleString()}`,
      result:
        (inputs.buildoutImprovements * inputs.locations) /
        Math.max(1, inputs.buildoutRefreshYears),
      unit: 'USD',
      category: 'Capex',
    });

    capexSteps.push({
      id: 'ffne_capex',
      description: 'FF&E Replacement Capex',
      formula: 'FF&E Capex = (FF&E Cost × Locations) ÷ Refresh Years',
      inputs: {
        'FF&E Cost': inputs.ffne,
        Locations: inputs.locations,
        'Refresh Years': inputs.ffneRefreshYears,
      },
      calculation: `($${inputs.ffne.toLocaleString()} × ${inputs.locations}) ÷ ${inputs.ffneRefreshYears} = $${((inputs.ffne * inputs.locations) / Math.max(1, inputs.ffneRefreshYears)).toLocaleString()}`,
      result:
        (inputs.ffne * inputs.locations) / Math.max(1, inputs.ffneRefreshYears),
      unit: 'USD',
      category: 'Capex',
    });

    capexSteps.push({
      id: 'minor_maintenance',
      description: 'Minor Maintenance Capex',
      formula: 'Minor Maintenance = Total Revenue × Minor Maintenance %',
      inputs: {
        'Total Revenue': inputs.totalRevenueBase,
        'Minor Maintenance %': inputs.minorMaintPct * 100,
      },
      calculation: `$${inputs.totalRevenueBase.toLocaleString()} × ${(inputs.minorMaintPct * 100).toFixed(1)}% = $${(inputs.minorMaintPct * inputs.totalRevenueBase).toLocaleString()}`,
      result: inputs.minorMaintPct * inputs.totalRevenueBase,
      unit: 'USD',
      category: 'Capex',
    });
  }

  capexSteps.push({
    id: 'total_maintenance_capex',
    description: `Total Maintenance Capex (${inputs.capexMode} method)`,
    formula:
      inputs.capexMode === 'percent'
        ? 'Maintenance Capex = Total Revenue × Maintenance Capex %'
        : inputs.capexMode === 'amount'
          ? 'Maintenance Capex = Fixed Amount × Locations'
          : 'Maintenance Capex = Equipment + Buildout + FF&E + Minor Maintenance',
    inputs:
      inputs.capexMode === 'percent'
        ? {
            'Total Revenue': inputs.totalRevenueBase,
            'Maintenance Capex %': inputs.maintenanceCapexPct * 100,
          }
        : inputs.capexMode === 'amount'
          ? {
              'Fixed Amount': inputs.maintenanceCapexAmount,
              Locations: inputs.locations,
            }
          : { 'Asset Model Total': inputs.maintCapexModelBase },
    calculation:
      inputs.capexMode === 'percent'
        ? `$${inputs.totalRevenueBase.toLocaleString()} × ${(inputs.maintenanceCapexPct * 100).toFixed(1)}% = $${inputs.maintCapexBase.toLocaleString()}`
        : inputs.capexMode === 'amount'
          ? `$${inputs.maintenanceCapexAmount.toLocaleString()} × ${inputs.locations} = $${inputs.maintCapexBase.toLocaleString()}`
          : `Asset Model = $${inputs.maintCapexBase.toLocaleString()}`,
    result: inputs.maintCapexBase,
    unit: 'USD',
    category: 'Capex',
  });

  trails.push({
    timestamp,
    category: 'Maintenance Capex Analysis',
    steps: capexSteps,
    finalResult: inputs.maintCapexBase,
    resultDescription: 'Total Maintenance Capex',
  });

  // 6. WACC CALCULATION AUDIT TRAIL
  const waccSteps: CalculationStep[] = [];

  waccSteps.push({
    id: 'cost_of_equity',
    description: 'Cost of Equity (CAPM)',
    formula:
      'Cost of Equity = Risk-Free Rate + Beta × Market Risk Premium + Size Premium + Specific Premium',
    inputs: {
      'Risk-Free Rate': inputs.rfRate * 100,
      Beta: inputs.betaEff,
      'Market Risk Premium': inputs.erp * 100,
      'Size Premium': inputs.sizePrem * 100,
      'Specific Premium': inputs.specificPrem * 100,
    },
    calculation: `${(inputs.rfRate * 100).toFixed(1)}% + ${inputs.betaEff.toFixed(2)} × ${(inputs.erp * 100).toFixed(1)}% + ${(inputs.sizePrem * 100).toFixed(1)}% + ${(inputs.specificPrem * 100).toFixed(1)}% = ${(inputs.costEquity * 100).toFixed(1)}%`,
    result: inputs.costEquity,
    unit: 'percentage',
    category: 'WACC',
  });

  waccSteps.push({
    id: 'after_tax_cost_debt',
    description: 'After-Tax Cost of Debt',
    formula: 'After-Tax Cost of Debt = Cost of Debt × (1 - Tax Rate)',
    inputs: {
      'Cost of Debt': inputs.costDebt * 100,
      'Tax Rate': inputs.taxRate * 100,
    },
    calculation: `${(inputs.costDebt * 100).toFixed(1)}% × (1 - ${(inputs.taxRate * 100).toFixed(1)}%) = ${(inputs.afterTaxCostDebt * 100).toFixed(1)}%`,
    result: inputs.afterTaxCostDebt,
    unit: 'percentage',
    category: 'WACC',
  });

  waccSteps.push({
    id: 'base_wacc',
    description: 'Base WACC Calculation',
    formula:
      'WACC = (Target Debt Weight × After-Tax Cost of Debt) + ((1 - Target Debt Weight) × Cost of Equity)',
    inputs: {
      'Target Debt Weight': inputs.targetDebtWeight * 100,
      'After-Tax Cost of Debt': inputs.afterTaxCostDebt * 100,
      'Cost of Equity': inputs.costEquity * 100,
    },
    calculation: `(${(inputs.targetDebtWeight * 100).toFixed(1)}% × ${(inputs.afterTaxCostDebt * 100).toFixed(1)}%) + ((1 - ${(inputs.targetDebtWeight * 100).toFixed(1)}%) × ${(inputs.costEquity * 100).toFixed(1)}%) = ${(inputs.baseWacc * 100).toFixed(1)}%`,
    result: inputs.baseWacc,
    unit: 'percentage',
    category: 'WACC',
  });

  waccSteps.push({
    id: 'scenario_wacc',
    description: 'Scenario-Adjusted WACC',
    formula: 'Scenario WACC = Base WACC + Scenario Adjustment + Risk Premium',
    inputs: {
      'Base WACC': inputs.baseWacc * 100,
      'Scenario Adjustment': inputs.scenarioAdj.waccAdj * 100,
      'Risk Premium': inputs.riskWaccPremium * 100,
    },
    calculation: `${(inputs.baseWacc * 100).toFixed(1)}% + ${(inputs.scenarioAdj.waccAdj * 100).toFixed(1)}% + ${(inputs.riskWaccPremium * 100).toFixed(1)}% = ${(inputs.scenarioWacc * 100).toFixed(1)}%`,
    result: inputs.scenarioWacc,
    unit: 'percentage',
    category: 'WACC',
  });

  trails.push({
    timestamp,
    category: 'WACC Analysis',
    steps: waccSteps,
    finalResult: inputs.scenarioWacc,
    resultDescription: 'Scenario-Adjusted WACC',
  });

  // 7. EPV CALCULATION AUDIT TRAIL
  const epvSteps: CalculationStep[] = [];

  epvSteps.push({
    id: 'nopat_scenario',
    description: 'Scenario NOPAT',
    formula: 'NOPAT = Scenario EBIT × (1 - Tax Rate)',
    inputs: {
      'Scenario EBIT': inputs.ebitScenario,
      'Tax Rate': inputs.taxRate * 100,
    },
    calculation: `$${inputs.ebitScenario.toLocaleString()} × (1 - ${(inputs.taxRate * 100).toFixed(1)}%) = $${inputs.nopatScenario.toLocaleString()}`,
    result: inputs.nopatScenario,
    unit: 'USD',
    category: 'EPV',
  });

  epvSteps.push({
    id: 'owner_earnings_scenario',
    description: 'Owner Earnings (Scenario)',
    formula: 'Owner Earnings = NOPAT + D&A - Maintenance Capex',
    inputs: {
      NOPAT: inputs.nopatScenario,
      'D&A': inputs.daTotal,
      'Maintenance Capex': inputs.maintCapexScenario,
    },
    calculation: `$${inputs.nopatScenario.toLocaleString()} + $${inputs.daTotal.toLocaleString()} - $${inputs.maintCapexScenario.toLocaleString()} = $${(inputs.nopatScenario + inputs.daTotal - inputs.maintCapexScenario).toLocaleString()}`,
    result: inputs.nopatScenario + inputs.daTotal - inputs.maintCapexScenario,
    unit: 'USD',
    category: 'EPV',
  });

  epvSteps.push({
    id: 'adjusted_earnings_scenario',
    description: 'Risk-Adjusted Earnings',
    formula: `${inputs.epvMethod} × (1 - Risk Haircut)`,
    inputs: {
      [`${inputs.epvMethod} (before haircut)`]:
        inputs.epvMethod === 'Owner Earnings'
          ? inputs.ownerEarningsScenario / (1 - inputs.riskEarningsHaircut)
          : inputs.nopatScenario,
      'Risk Haircut': inputs.riskEarningsHaircut * 100,
    },
    calculation: `$${(inputs.epvMethod === 'Owner Earnings' ? inputs.ownerEarningsScenario / (1 - inputs.riskEarningsHaircut) : inputs.nopatScenario).toLocaleString()} × (1 - ${(inputs.riskEarningsHaircut * 100).toFixed(1)}%) = $${inputs.adjustedEarningsScenario.toLocaleString()}`,
    result: inputs.adjustedEarningsScenario,
    unit: 'USD',
    category: 'EPV',
  });

  epvSteps.push({
    id: 'enterprise_epv',
    description: 'Enterprise EPV (Perpetuity Value)',
    formula: 'Enterprise EPV = Adjusted Earnings ÷ WACC',
    inputs: {
      'Adjusted Earnings': inputs.adjustedEarningsScenario,
      WACC: inputs.scenarioWacc * 100,
    },
    calculation: `$${inputs.adjustedEarningsScenario.toLocaleString()} ÷ ${(inputs.scenarioWacc * 100).toFixed(1)}% = $${inputs.enterpriseEPV.toLocaleString()}`,
    result: inputs.enterpriseEPV,
    unit: 'USD',
    category: 'EPV',
  });

  epvSteps.push({
    id: 'equity_epv',
    description: 'Equity EPV',
    formula: 'Equity EPV = Enterprise EPV + Cash - Debt',
    inputs: {
      'Enterprise EPV': inputs.enterpriseEPV,
      'Cash (Non-Operating)': inputs.cashNonOperating,
      'Debt (Interest-Bearing)': inputs.debtInterestBearing,
    },
    calculation: `$${inputs.enterpriseEPV.toLocaleString()} + $${inputs.cashNonOperating.toLocaleString()} - $${inputs.debtInterestBearing.toLocaleString()} = $${inputs.equityEPV.toLocaleString()}`,
    result: inputs.equityEPV,
    unit: 'USD',
    category: 'EPV',
  });

  trails.push({
    timestamp,
    category: 'EPV Valuation',
    steps: epvSteps,
    finalResult: inputs.equityEPV,
    resultDescription: 'Equity EPV',
  });

  // 8. WORKING CAPITAL AUDIT TRAIL
  const wcSteps: CalculationStep[] = [];

  wcSteps.push({
    id: 'accounts_receivable',
    description: 'Accounts Receivable',
    formula: 'AR = Total Revenue × (DSO Days ÷ 365)',
    inputs: {
      'Total Revenue': inputs.totalRevenueBase,
      'DSO Days': inputs.dsoDays,
    },
    calculation: `$${inputs.totalRevenueBase.toLocaleString()} × (${inputs.dsoDays} ÷ 365) = $${inputs.accountsReceivable.toLocaleString()}`,
    result: inputs.accountsReceivable,
    unit: 'USD',
    category: 'Working Capital',
  });

  wcSteps.push({
    id: 'inventory',
    description: 'Inventory',
    formula: 'Inventory = Total COGS for WC × (DSI Days ÷ 365)',
    inputs: {
      'Total COGS for WC': inputs.totalCOGSForWC,
      'DSI Days': inputs.dsiDays,
    },
    calculation: `$${inputs.totalCOGSForWC.toLocaleString()} × (${inputs.dsiDays} ÷ 365) = $${inputs.inventory.toLocaleString()}`,
    result: inputs.inventory,
    unit: 'USD',
    category: 'Working Capital',
  });

  wcSteps.push({
    id: 'accounts_payable',
    description: 'Accounts Payable',
    formula: 'AP = Total COGS for WC × (DPO Days ÷ 365)',
    inputs: {
      'Total COGS for WC': inputs.totalCOGSForWC,
      'DPO Days': inputs.dpoDays,
    },
    calculation: `$${inputs.totalCOGSForWC.toLocaleString()} × (${inputs.dpoDays} ÷ 365) = $${inputs.accountsPayable.toLocaleString()}`,
    result: inputs.accountsPayable,
    unit: 'USD',
    category: 'Working Capital',
  });

  wcSteps.push({
    id: 'net_working_capital',
    description: 'Net Working Capital',
    formula: 'NWC = Accounts Receivable + Inventory - Accounts Payable',
    inputs: {
      'Accounts Receivable': inputs.accountsReceivable,
      Inventory: inputs.inventory,
      'Accounts Payable': inputs.accountsPayable,
    },
    calculation: `$${inputs.accountsReceivable.toLocaleString()} + $${inputs.inventory.toLocaleString()} - $${inputs.accountsPayable.toLocaleString()} = $${inputs.netWorkingCapital.toLocaleString()}`,
    result: inputs.netWorkingCapital,
    unit: 'USD',
    category: 'Working Capital',
  });

  trails.push({
    timestamp,
    category: 'Working Capital Analysis',
    steps: wcSteps,
    finalResult: inputs.netWorkingCapital,
    resultDescription: 'Net Working Capital',
  });

  return trails;
}

// Formula reference library
export const formulaLibrary = {
  revenue: {
    title: 'Revenue Calculations',
    formulas: [
      {
        name: 'Service Line Revenue',
        formula: 'Revenue = Price per Unit × Annual Volume × Locations',
        description: 'Revenue for each individual service line',
        variables: {
          'Price per Unit': 'Average price charged per service unit',
          'Annual Volume': 'Number of units sold per location per year',
          Locations: 'Number of clinic locations',
        },
      },
      {
        name: 'Total Revenue',
        formula: 'Total Revenue = Σ(Individual Service Line Revenues)',
        description: 'Aggregated revenue across all service lines',
        variables: {},
      },
    ],
  },
  costs: {
    title: 'Cost Structure',
    formulas: [
      {
        name: 'COGS',
        formula: 'COGS = Revenue × COGS Percentage',
        description: 'Direct cost of goods sold for each service line',
        variables: {
          Revenue: 'Service line revenue',
          'COGS Percentage': 'Direct cost percentage for the service',
        },
      },
      {
        name: 'Clinical Labor',
        formula:
          'Clinical Labor = Service Revenue × Clinical Labor % × Labor Market Adjustment',
        description: 'Cost of clinical staff adjusted for market conditions',
        variables: {
          'Service Revenue': 'Revenue from services requiring clinical staff',
          'Clinical Labor %':
            'Base percentage of service revenue for clinical labor',
          'Labor Market Adjustment':
            'Market adjustment factor (>1 for expensive markets)',
        },
      },
      {
        name: 'Marketing with Synergies',
        formula:
          'Marketing % = Marketing % × (1 - min(0.5, (Locations - 1) × Marketing Synergy %))',
        description: 'Marketing costs with multi-location synergies',
        variables: {
          'Marketing %': 'Base marketing percentage',
          Locations: 'Number of locations',
          'Marketing Synergy %': 'Synergy percentage for additional locations',
        },
      },
    ],
  },
  valuation: {
    title: 'Valuation Methods',
    formulas: [
      {
        name: 'WACC',
        formula: 'WACC = (E/V × Re) + (D/V × Rd × (1-T))',
        description: 'Weighted Average Cost of Capital',
        variables: {
          'E/V': 'Equity weight (1 - Target Debt Weight)',
          Re: 'Cost of Equity',
          'D/V': 'Debt weight (Target Debt Weight)',
          Rd: 'Cost of Debt',
          T: 'Tax Rate',
        },
      },
      {
        name: 'Cost of Equity (CAPM)',
        formula: 'Re = Rf + β × (Rm - Rf) + Size Premium + Specific Premium',
        description: 'Capital Asset Pricing Model for cost of equity',
        variables: {
          Rf: 'Risk-free rate',
          β: 'Beta (systematic risk)',
          '(Rm - Rf)': 'Market risk premium',
          'Size Premium': 'Small company premium',
          'Specific Premium': 'Company-specific risk premium',
        },
      },
      {
        name: 'EPV (Perpetuity)',
        formula: 'EPV = Adjusted Earnings ÷ WACC',
        description: 'Earnings Power Value using perpetuity method',
        variables: {
          'Adjusted Earnings':
            'Normalized sustainable earnings (Owner Earnings or NOPAT)',
          WACC: 'Weighted Average Cost of Capital',
        },
      },
      {
        name: 'Owner Earnings',
        formula: 'Owner Earnings = NOPAT + D&A - Maintenance Capex',
        description: "Buffett's Owner Earnings calculation",
        variables: {
          NOPAT: 'Net Operating Profit After Tax',
          'D&A': 'Depreciation & Amortization',
          'Maintenance Capex':
            'Capital expenditures needed to maintain business',
        },
      },
    ],
  },
};

// Calculation verification functions
export function calculateCrossChecks(inputs: TransparencyInputs) {
  const checks = [];

  // Revenue cross-check
  const manualRevenue = inputs.serviceLines.reduce(
    (sum, line) => sum + line.price * line.volume * inputs.locations,
    0
  );
  checks.push({
    name: 'Revenue Verification',
    calculated: inputs.totalRevenueBase,
    manual: manualRevenue,
    difference: Math.abs(inputs.totalRevenueBase - manualRevenue),
    passed: Math.abs(inputs.totalRevenueBase - manualRevenue) < 1,
  });

  // Gross margin check
  const grossMarginPct =
    inputs.totalRevenueBase > 0
      ? inputs.grossProfit / inputs.totalRevenueBase
      : 0;
  checks.push({
    name: 'Gross Margin Range Check',
    calculated: grossMarginPct,
    expected: '0.20 to 0.80',
    passed: grossMarginPct >= 0.2 && grossMarginPct <= 0.8,
    description: 'Gross margin should be reasonable for medispa business',
  });

  // WACC reasonableness
  checks.push({
    name: 'WACC Range Check',
    calculated: inputs.scenarioWacc,
    expected: '0.08 to 0.25',
    passed: inputs.scenarioWacc >= 0.08 && inputs.scenarioWacc <= 0.25,
    description: 'WACC should be reasonable for small healthcare business',
  });

  // EPV multiple check
  const epvMultiple =
    inputs.totalRevenueBase > 0
      ? inputs.enterpriseEPV / inputs.totalRevenueBase
      : 0;
  checks.push({
    name: 'EV/Revenue Multiple',
    calculated: epvMultiple,
    expected: '1.0 to 8.0',
    passed: epvMultiple >= 1.0 && epvMultiple <= 8.0,
    description: 'Enterprise value multiple should be reasonable',
  });

  return checks;
}
