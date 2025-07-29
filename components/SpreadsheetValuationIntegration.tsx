import React, { useState, useCallback, useMemo } from 'react';
import FinancialSpreadsheetEntry from './FinancialSpreadsheetEntry';

interface FinancialLineItem {
  id: string;
  category: 'revenue' | 'cogs' | 'expenses' | 'other';
  subcategory?: string;
  label: string;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isEditable?: boolean;
  isCalculated?: boolean;
  formula?: string;
  values: { [year: string]: number };
  units?: 'currency' | 'percentage' | 'number';
  level: number;
}

interface ValuationInputs {
  revenue: number;
  ebitda: number;
  netIncome: number;
  wacc: number;
  growthRate: number;
  terminalGrowthRate: number;
  capex: number;
  workingCapitalChange: number;
  taxRate: number;
}

interface ValuationResults {
  enterpriseValue: number;
  equityValue: number;
  sharePrice?: number;
  dcfValue: number;
  epvValue: number;
  assetValue: number;
  revenueMultiple: number;
  ebitdaMultiple: number;
  peRatio: number;
}

interface SpreadsheetValuationProps {
  onValuationComplete?: (results: ValuationResults) => void;
  initialYears?: string[];
}

export const SpreadsheetValuationIntegration: React.FC<SpreadsheetValuationProps> = ({
  onValuationComplete,
  initialYears = ['2021', '2022', '2023', '2024', '2025']
}) => {
  const [spreadsheetData, setSpreadsheetData] = useState<FinancialLineItem[]>([]);
  const [valuationInputs, setValuationInputs] = useState<ValuationInputs>({
    wacc: 0.12,
    growthRate: 0.05,
    terminalGrowthRate: 0.025,
    capex: 0,
    workingCapitalChange: 0,
    taxRate: 0.25,
    revenue: 0,
    ebitda: 0,
    netIncome: 0
  });
  
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'assumptions' | 'results'>('spreadsheet');

  // Extract key financial metrics from spreadsheet data
  const financialMetrics = useMemo(() => {
    if (spreadsheetData.length === 0) return null;

    const latestYear = initialYears[initialYears.length - 1];
    const getValueByYear = (itemId: string, year: string = latestYear) => {
      const item = spreadsheetData.find(item => item.id === itemId);
      return item?.values[year] || 0;
    };

    const revenue = getValueByYear('total-revenue');
    const ebitda = getValueByYear('operating-income');
    const netIncome = getValueByYear('net-income');
    const grossProfit = getValueByYear('gross-profit');
    const totalExpenses = getValueByYear('total-expenses');
    const depreciation = getValueByYear('depreciation');

    // Calculate growth rates from historical data
    const calculateGrowthRate = (itemId: string) => {
      const currentYear = getValueByYear(itemId, latestYear);
      const previousYear = getValueByYear(itemId, initialYears[initialYears.length - 2]);
      if (previousYear === 0) return 0;
      return (currentYear - previousYear) / previousYear;
    };

    const revenueGrowth = calculateGrowthRate('total-revenue');
    const ebitdaGrowth = calculateGrowthRate('operating-income');

    return {
      revenue,
      ebitda,
      netIncome,
      grossProfit,
      totalExpenses,
      depreciation,
      revenueGrowth,
      ebitdaGrowth,
      grossMargin: revenue > 0 ? grossProfit / revenue : 0,
      ebitdaMargin: revenue > 0 ? ebitda / revenue : 0,
      netMargin: revenue > 0 ? netIncome / revenue : 0
    };
  }, [spreadsheetData, initialYears]);

  // Calculate valuation based on spreadsheet data and assumptions
  const valuationResults = useMemo(() => {
    if (!financialMetrics) return null;

    const { revenue, ebitda, netIncome } = financialMetrics;
    const { wacc, growthRate, terminalGrowthRate, capex, workingCapitalChange, taxRate } = valuationInputs;

    // DCF Calculation
    const projectedCashFlows = [];
    let projectedEbitda = ebitda;
    
    for (let year = 1; year <= 5; year++) {
      projectedEbitda *= (1 + growthRate);
      const nopat = projectedEbitda * (1 - taxRate);
      const freeCashFlow = nopat - capex - workingCapitalChange;
      const discountFactor = Math.pow(1 + wacc, year);
      const presentValue = freeCashFlow / discountFactor;
      projectedCashFlows.push(presentValue);
    }

    const terminalValue = (projectedCashFlows[4] * (1 + terminalGrowthRate)) / (wacc - terminalGrowthRate);
    const terminalPV = terminalValue / Math.pow(1 + wacc, 5);
    const dcfValue = projectedCashFlows.reduce((sum, cf) => sum + cf, 0) + terminalPV;

    // EPV Calculation (Greenwald method)
    const sustainableEarnings = ebitda * 0.85; // Apply haircut for sustainability
    const epvValue = sustainableEarnings / wacc;

    // Asset-based valuation (simplified)
    const assetValue = revenue * 0.8; // Rough asset multiple

    // Final enterprise value (weighted approach)
    const enterpriseValue = (dcfValue * 0.4) + (epvValue * 0.5) + (assetValue * 0.1);
    
    // Equity value (simplified - no debt assumed)
    const equityValue = enterpriseValue;

    // Calculate multiples
    const revenueMultiple = revenue > 0 ? enterpriseValue / revenue : 0;
    const ebitdaMultiple = ebitda > 0 ? enterpriseValue / ebitda : 0;
    const peRatio = netIncome > 0 ? equityValue / netIncome : 0;

    return {
      enterpriseValue,
      equityValue,
      dcfValue,
      epvValue,
      assetValue,
      revenueMultiple,
      ebitdaMultiple,
      peRatio
    };
  }, [financialMetrics, valuationInputs]);

  const handleSpreadsheetChange = useCallback((data: FinancialLineItem[]) => {
    setSpreadsheetData(data);
  }, []);

  const handleInputChange = useCallback((field: keyof ValuationInputs, value: number) => {
    setValuationInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatRatio = (value: number) => {
    return `${value.toFixed(1)}x`;
  };

  return (
    <div className="space-section">
      {/* Header */}
      <div className="mb-8">
        <h1 className="content-hero">Spreadsheet-Based Valuation</h1>
        <p className="content-body text-slate-600">
          Import your P&L data using the spreadsheet interface, set valuation assumptions, and generate comprehensive valuation results.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'spreadsheet', label: 'P&L Data Entry', icon: '📊' },
            { id: 'assumptions', label: 'Valuation Assumptions', icon: '⚙️' },
            { id: 'results', label: 'Valuation Results', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'spreadsheet' && (
        <FinancialSpreadsheetEntry
          years={initialYears}
          onDataChange={handleSpreadsheetChange}
        />
      )}

      {activeTab === 'assumptions' && (
        <div className="card-executive">
          <h2 className="content-section-title mb-6">Valuation Assumptions</h2>
          
          {/* Financial Metrics Summary */}
          {financialMetrics && (
            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <h3 className="content-subsection-title mb-4">Extracted Financial Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="financial-primary text-blue-600">
                    {formatCurrency(financialMetrics.revenue)}
                  </div>
                  <div className="financial-caption">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="financial-primary text-green-600">
                    {formatCurrency(financialMetrics.ebitda)}
                  </div>
                  <div className="financial-caption">EBITDA</div>
                </div>
                <div className="text-center">
                  <div className="financial-primary text-purple-600">
                    {formatPercentage(financialMetrics.ebitdaMargin)}
                  </div>
                  <div className="financial-caption">EBITDA Margin</div>
                </div>
              </div>
            </div>
          )}

          {/* Assumption Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Discount Rate & Growth</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  WACC (Weighted Average Cost of Capital)
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-financial"
                  value={valuationInputs.wacc}
                  onChange={(e) => handleInputChange('wacc', parseFloat(e.target.value) || 0)}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Current: {formatPercentage(valuationInputs.wacc)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Near-term Growth Rate (5 years)
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-financial"
                  value={valuationInputs.growthRate}
                  onChange={(e) => handleInputChange('growthRate', parseFloat(e.target.value) || 0)}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Current: {formatPercentage(valuationInputs.growthRate)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Terminal Growth Rate
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-financial"
                  value={valuationInputs.terminalGrowthRate}
                  onChange={(e) => handleInputChange('terminalGrowthRate', parseFloat(e.target.value) || 0)}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Current: {formatPercentage(valuationInputs.terminalGrowthRate)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Cash Flow Adjustments</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Annual Capital Expenditures
                </label>
                <input
                  type="number"
                  className="input-financial"
                  value={valuationInputs.capex}
                  onChange={(e) => handleInputChange('capex', parseFloat(e.target.value) || 0)}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Annual capex requirements
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Working Capital Change
                </label>
                <input
                  type="number"
                  className="input-financial"
                  value={valuationInputs.workingCapitalChange}
                  onChange={(e) => handleInputChange('workingCapitalChange', parseFloat(e.target.value) || 0)}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Annual working capital investment
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tax Rate
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-financial"
                  value={valuationInputs.taxRate}
                  onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Current: {formatPercentage(valuationInputs.taxRate)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Valuation Summary */}
          {valuationResults && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-metric-primary text-center">
                  <div className="financial-caption mb-2">Enterprise Value</div>
                  <div className="financial-hero text-blue-600 mb-2">
                    {formatCurrency(valuationResults.enterpriseValue)}
                  </div>
                  <div className="financial-caption text-slate-500">
                    Weighted Average
                  </div>
                </div>
                
                <div className="card-metric-primary text-center">
                  <div className="financial-caption mb-2">Equity Value</div>
                  <div className="financial-hero text-green-600 mb-2">
                    {formatCurrency(valuationResults.equityValue)}
                  </div>
                  <div className="financial-caption text-slate-500">
                    Net of Debt
                  </div>
                </div>
                
                <div className="card-metric-primary text-center">
                  <div className="financial-caption mb-2">Revenue Multiple</div>
                  <div className="financial-hero text-purple-600 mb-2">
                    {formatRatio(valuationResults.revenueMultiple)}
                  </div>
                  <div className="financial-caption text-slate-500">
                    EV/Revenue
                  </div>
                </div>
              </div>

              {/* Detailed Valuation Methods */}
              <div className="card-executive">
                <h3 className="content-section-title mb-4">Valuation Method Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="table-financial min-w-full">
                    <thead className="table-header">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Method</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Value</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Weight</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="table-row-hover">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">DCF Analysis</td>
                        <td className="table-cell-financial">{formatCurrency(valuationResults.dcfValue)}</td>
                        <td className="table-cell-financial">40%</td>
                        <td className="table-cell-financial">{formatCurrency(valuationResults.dcfValue * 0.4)}</td>
                      </tr>
                      <tr className="table-row-hover">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">EPV Method</td>
                        <td className="table-cell-financial">{formatCurrency(valuationResults.epvValue)}</td>
                        <td className="table-cell-financial">50%</td>
                        <td className="table-cell-financial">{formatCurrency(valuationResults.epvValue * 0.5)}</td>
                      </tr>
                      <tr className="table-row-hover">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">Asset-Based</td>
                        <td className="table-cell-financial">{formatCurrency(valuationResults.assetValue)}</td>
                        <td className="table-cell-financial">10%</td>
                        <td className="table-cell-financial">{formatCurrency(valuationResults.assetValue * 0.1)}</td>
                      </tr>
                      <tr className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">Total Enterprise Value</td>
                        <td className="table-cell-financial font-semibold">{formatCurrency(valuationResults.enterpriseValue)}</td>
                        <td className="table-cell-financial">100%</td>
                        <td className="table-cell-financial font-semibold">{formatCurrency(valuationResults.enterpriseValue)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Valuation Multiples */}
              <div className="card-executive">
                <h3 className="content-section-title mb-4">Valuation Multiples</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="financial-secondary font-semibold text-slate-900">
                      {formatRatio(valuationResults.ebitdaMultiple)}
                    </div>
                    <div className="financial-caption">EV/EBITDA</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="financial-secondary font-semibold text-slate-900">
                      {formatRatio(valuationResults.revenueMultiple)}
                    </div>
                    <div className="financial-caption">EV/Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="financial-secondary font-semibold text-slate-900">
                      {formatRatio(valuationResults.peRatio)}
                    </div>
                    <div className="financial-caption">P/E Ratio</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!valuationResults && (
            <div className="card-executive text-center py-12">
              <div className="text-slate-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="content-subsection-title text-slate-500 mb-2">No Data Available</h3>
              <p className="content-body text-slate-400">
                Please enter P&L data in the spreadsheet to generate valuation results.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpreadsheetValuationIntegration; 