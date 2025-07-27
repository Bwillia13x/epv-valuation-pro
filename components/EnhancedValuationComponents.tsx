import React, { useState, useEffect } from 'react';
import { 
  MultiYearFinancialData, 
  SynergyAdjustments, 
  HybridValuationResult,
  calculateHybridValuation,
  MEDSPA_BENCHMARKS_2025 
} from '../lib/enhancedValuationModels';

// Multi-Year Data Input Component
export interface MultiYearDataInputProps {
  data: MultiYearFinancialData[];
  onChange: (data: MultiYearFinancialData[]) => void;
  maxYears?: number;
}

export const MultiYearDataInput: React.FC<MultiYearDataInputProps> = ({ 
  data, 
  onChange, 
  maxYears = 5 
}) => {
  const [editingYear, setEditingYear] = useState<number | null>(null);

  const addYear = () => {
    if (data.length >= maxYears) return;
    
    const currentYear = new Date().getFullYear();
    const newYear = data.length > 0 
      ? Math.max(...data.map(d => d.year)) + 1 
      : currentYear - data.length;

    const newData: MultiYearFinancialData = {
      year: newYear,
      revenue: 0,
      ebitda: 0,
      ebit: 0,
      adjustedEbitda: 0,
      normalizations: {
        ownerCompensation: 0,
        personalExpenses: 0,
        oneTimeItems: 0,
        synergies: 0,
      },
    };

    onChange([...data, newData]);
  };

  const updateYear = (index: number, updates: Partial<MultiYearFinancialData>) => {
    const newData = [...data];
    newData[index] = { ...newData[index], ...updates };
    
    // Auto-calculate adjusted EBITDA
    if (updates.ebitda !== undefined || updates.normalizations) {
      const item = newData[index];
      const totalNormalizations = Object.values(item.normalizations).reduce((sum, val) => sum + val, 0);
      newData[index].adjustedEbitda = item.ebitda + totalNormalizations;
    }
    
    onChange(newData);
  };

  const removeYear = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-green-400">📊 Multi-Year Financial Data</h3>
        <button
          onClick={addYear}
          disabled={data.length >= maxYears}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add Year ({data.length}/{maxYears})
        </button>
      </div>

      <div className="space-y-3">
        {data.map((yearData, index) => (
          <div key={index} className="border border-gray-600 rounded-lg p-4 bg-gray-800">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-blue-300">Year {yearData.year}</h4>
              <button
                onClick={() => removeYear(index)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                ✕ Remove
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Revenue</label>
                <input
                  type="number"
                  value={yearData.revenue}
                  onChange={(e) => updateYear(index, { revenue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">EBITDA (Raw)</label>
                <input
                  type="number"
                  value={yearData.ebitda}
                  onChange={(e) => updateYear(index, { ebitda: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Owner Comp Add-Back</label>
                <input
                  type="number"
                  value={yearData.normalizations.ownerCompensation}
                  onChange={(e) => updateYear(index, { 
                    normalizations: { 
                      ...yearData.normalizations, 
                      ownerCompensation: parseFloat(e.target.value) || 0 
                    } 
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Adjusted EBITDA</label>
                <div className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-green-300 font-medium">
                  {fmt.format(yearData.adjustedEbitda)}
                </div>
              </div>
            </div>

            {editingYear === index && (
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4 border-t border-gray-600 pt-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Personal Expenses</label>
                  <input
                    type="number"
                    value={yearData.normalizations.personalExpenses}
                    onChange={(e) => updateYear(index, { 
                      normalizations: { 
                        ...yearData.normalizations, 
                        personalExpenses: parseFloat(e.target.value) || 0 
                      } 
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">One-Time Items</label>
                  <input
                    type="number"
                    value={yearData.normalizations.oneTimeItems}
                    onChange={(e) => updateYear(index, { 
                      normalizations: { 
                        ...yearData.normalizations, 
                        oneTimeItems: parseFloat(e.target.value) || 0 
                      } 
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Synergies</label>
                  <input
                    type="number"
                    value={yearData.normalizations.synergies}
                    onChange={(e) => updateYear(index, { 
                      normalizations: { 
                        ...yearData.normalizations, 
                        synergies: parseFloat(e.target.value) || 0 
                      } 
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setEditingYear(editingYear === index ? null : index)}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              {editingYear === index ? '▲ Hide Details' : '▼ Show Details'}
            </button>
          </div>
        ))}
      </div>

      {data.length > 0 && (
        <div className="mt-4 p-4 bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-300 mb-2">📈 Multi-Year Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-300">Years Analyzed:</span>
              <span className="ml-2 text-white font-medium">{data.length}</span>
            </div>
            <div>
              <span className="text-gray-300">Avg Adj EBITDA:</span>
              <span className="ml-2 text-green-300 font-medium">
                {fmt.format(data.reduce((sum, d) => sum + d.adjustedEbitda, 0) / data.length)}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Growth Trend:</span>
              <span className="ml-2 text-yellow-300 font-medium">
                {data.length > 1 ? 
                  `${(((data[data.length-1].adjustedEbitda / data[0].adjustedEbitda) ** (1/(data.length-1)) - 1) * 100).toFixed(1)}%` 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Synergy Adjustments Component
export interface SynergyAdjustmentsProps {
  synergies: SynergyAdjustments;
  onChange: (synergies: SynergyAdjustments) => void;
  baseEbitda: number;
}

export const SynergyAdjustmentsComponent: React.FC<SynergyAdjustmentsProps> = ({ 
  synergies, 
  onChange, 
  baseEbitda 
}) => {
  const updateSynergy = (key: keyof SynergyAdjustments, value: number) => {
    const newSynergies = { ...synergies, [key]: value };
    
    // Calculate total synergies (CONSERVATIVE: Cap at 15%)
    const baseSynergies = newSynergies.operationalEfficiencies +
      newSynergies.scaleEconomies +
      newSynergies.marketingOptimization +
      newSynergies.technologyIntegration +
      newSynergies.crossSelling;
    
    const moatAdjustment = (newSynergies.moatScore || 0) * 0.03; // Up to 3% for franchise value (down from 5%)
    newSynergies.totalSynergies = Math.min(0.20, baseSynergies + moatAdjustment); // Cap at 20% (down from 30%)
    
    onChange(newSynergies);
  };

  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const pctFmt = (v: number) => `${(v * 100).toFixed(1)}%`;

  const synergyValue = baseEbitda * synergies.totalSynergies;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-green-400">🚀 Synergy Adjustments</h3>
        <div className="text-right">
          <div className="text-sm text-gray-300">Total Impact</div>
          <div className="text-lg font-bold text-green-300">
            {pctFmt(synergies.totalSynergies)} = {fmt.format(synergyValue)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              🏭 Operational Efficiencies ({pctFmt(synergies.operationalEfficiencies)})
            </label>
            <input
              type="range"
              min="0"
              max="0.06"
              step="0.005"
              value={synergies.operationalEfficiencies}
              onChange={(e) => updateSynergy('operationalEfficiencies', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Staff productivity, process optimization, automation (CONSERVATIVE: Max 6%)
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              📈 Scale Economies ({pctFmt(synergies.scaleEconomies)})
            </label>
            <input
              type="range"
              min="0"
              max="0.05"
              step="0.005"
              value={synergies.scaleEconomies}
              onChange={(e) => updateSynergy('scaleEconomies', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Volume discounts, shared services, purchasing power (CONSERVATIVE: Max 5%)
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              📢 Marketing Optimization ({pctFmt(synergies.marketingOptimization)})
            </label>
            <input
              type="range"
              min="0"
              max="0.04"
              step="0.005"
              value={synergies.marketingOptimization}
              onChange={(e) => updateSynergy('marketingOptimization', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Better targeting, reduced acquisition costs (CONSERVATIVE: Max 4%)
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              🏰 Franchise/Moat Score ({pctFmt(synergies.moatScore || 0)})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={synergies.moatScore || 0}
              onChange={(e) => updateSynergy('moatScore', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Physician autonomy, location moats, regulatory barriers (NEW: +5% max)
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              💻 Technology Integration ({pctFmt(synergies.technologyIntegration)})
            </label>
            <input
              type="range"
              min="0"
              max="0.05"
              step="0.005"
              value={synergies.technologyIntegration}
              onChange={(e) => updateSynergy('technologyIntegration', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              EMR systems, AI optimization, digital workflows (CONSERVATIVE: Max 5%)
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              🔄 Cross-Selling ({pctFmt(synergies.crossSelling)})
            </label>
            <input
              type="range"
              min="0"
              max="0.08"
              step="0.005"
              value={synergies.crossSelling}
              onChange={(e) => updateSynergy('crossSelling', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Service upsells, product bundles, membership growth (CONSERVATIVE: Max 8%)
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              ⏰ Year One Realization ({pctFmt(synergies.yearOneRealization || 0.30)})
            </label>
            <input
              type="range"
              min="0.20"
              max="0.50"
              step="0.05"
              value={synergies.yearOneRealization || 0.30}
              onChange={(e) => updateSynergy('yearOneRealization', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Percentage of synergies realized in first year (NEW: Default 30%)
            </div>
          </div>

          <div className="p-4 bg-red-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-red-300 mb-2">🎯 CONSERVATIVE Guidelines (2025)</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Conservative: 3-8% total synergies</li>
              <li>• Moderate: 8-12% total synergies</li>
              <li>• Aggressive: 12-15% total synergies</li>
              <li>• Market-calibrated limit: 20% (with moats)</li>
              <li>• Single-location risk: Additional discounts applied</li>
              <li>• Phased realization: 30% → 65% → 100%</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-green-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-green-300 mb-2">💰 Synergy Impact Analysis</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-300">Base EBITDA:</span>
            <div className="text-white font-medium">{fmt.format(baseEbitda)}</div>
          </div>
          <div>
            <span className="text-gray-300">Synergy Value:</span>
            <div className="text-green-300 font-medium">{fmt.format(synergyValue)}</div>
          </div>
          <div>
            <span className="text-gray-300">Enhanced EBITDA:</span>
            <div className="text-green-300 font-medium">{fmt.format(baseEbitda + synergyValue)}</div>
          </div>
          <div>
            <span className="text-gray-300">Multiplier:</span>
            <div className="text-yellow-300 font-medium">{(1 + synergies.totalSynergies).toFixed(2)}x</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hybrid Valuation Results Display
export interface HybridValuationDisplayProps {
  result: HybridValuationResult;
  className?: string;
}

export const HybridValuationDisplay: React.FC<HybridValuationDisplayProps> = ({ 
  result, 
  className = "" 
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'sensitivity' | 'scenarios' | 'synergies'>('summary');

  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const pctFmt = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-400 mb-2">🎯 Hybrid Valuation Results</h2>
        <div className="text-4xl font-bold text-white mb-1">
          {fmt.format(result.hybridValuation)}
        </div>
        <div className="text-sm text-gray-300">
          Weighted Average of EPV, DCF, and Market Approaches
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {(['summary', 'details', 'sensitivity', 'scenarios', 'synergies'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab === 'synergies' ? '🚀 Synergies' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-4">💼 Valuation Methods</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">EPV (Conservative):</span>
                <span className="text-white font-medium">{fmt.format(result.epvValuation)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">DCF (Growth):</span>
                <span className="text-white font-medium">{fmt.format(result.dcfValuation)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Market Multiple:</span>
                <span className="text-white font-medium">{fmt.format(result.multipleValuation)}</span>
              </div>
              <div className="border-t border-gray-600 pt-3">
                <div className="flex justify-between">
                  <span className="text-green-300 font-medium">Hybrid Result:</span>
                  <span className="text-green-300 font-bold">{fmt.format(result.hybridValuation)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-4">⚖️ Method Weights</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">EPV Weight:</span>
                <span className="text-white font-medium">{pctFmt(result.weights.epv)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">DCF Weight:</span>
                <span className="text-white font-medium">{pctFmt(result.weights.dcf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Multiple Weight:</span>
                <span className="text-white font-medium">{pctFmt(result.weights.multiple)}</span>
              </div>
              <div className="border-t border-gray-600 pt-2">
                <div className="text-xs text-blue-300 font-medium">
                  {result.weights.methodology.charAt(0).toUpperCase() + result.weights.methodology.slice(1)} Approach
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              REFINED: Market-calibrated weighting methodology
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-300 mb-4">🎯 Market Calibration</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Implied Multiple:</span>
                <span className="text-white font-medium">{result.marketCalibration.impliedMultiple.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Benchmark Range:</span>
                <span className="text-white font-medium">
                  {result.marketCalibration.benchmarkRange[0]}x - {result.marketCalibration.benchmarkRange[1]}x
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Calibration Score:</span>
                <span className={`font-medium ${
                  result.marketCalibration.calibrationScore > 0.8 ? 'text-green-300' :
                  result.marketCalibration.calibrationScore > 0.6 ? 'text-yellow-300' : 'text-red-300'
                }`}>
                  {pctFmt(result.marketCalibration.calibrationScore)}
                </span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              NEW: Market alignment validation
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">📊 Confidence Range</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">P5 (Worst Case):</span>
                <span className="text-red-300 font-medium">{fmt.format(result.confidenceInterval.p5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">P25:</span>
                <span className="text-orange-300 font-medium">{fmt.format(result.confidenceInterval.p25)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">P50 (Median):</span>
                <span className="text-white font-medium">{fmt.format(result.confidenceInterval.p50)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">P75:</span>
                <span className="text-blue-300 font-medium">{fmt.format(result.confidenceInterval.p75)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">P95 (Best Case):</span>
                <span className="text-green-300 font-medium">{fmt.format(result.confidenceInterval.p95)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              REFINED: Tighter distributions (±8-10%)
            </div>
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-4">🔍 Detailed Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-green-300 mb-3">Valuation Bridge</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Conservative Base (EPV):</span>
                  <span className="text-white">{fmt.format(result.epvValuation)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Growth Premium (DCF):</span>
                  <span className="text-green-300">+{fmt.format(result.dcfValuation - result.epvValuation)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Market Validation:</span>
                  <span className="text-blue-300">{fmt.format(result.multipleValuation)}</span>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-yellow-300">Weighted Result:</span>
                    <span className="text-yellow-300">{fmt.format(result.hybridValuation)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-yellow-300 mb-3">Method Comparison</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Range (Low-High):</span>
                  <span className="text-white">
                    {fmt.format(Math.min(result.epvValuation, result.dcfValuation, result.multipleValuation))} - 
                    {fmt.format(Math.max(result.epvValuation, result.dcfValuation, result.multipleValuation))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Variance (CV):</span>
                  <span className="text-white">
                    {(
                      Math.sqrt(
                        [result.epvValuation, result.dcfValuation, result.multipleValuation]
                          .map(v => Math.pow(v - result.hybridValuation, 2))
                          .reduce((a, b) => a + b, 0) / 3
                      ) / result.hybridValuation * 100
                    ).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sensitivity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-300 mb-4">📉 WACC Sensitivity</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Low WACC (-10%):</span>
                <span className="text-green-300 font-medium">{fmt.format(result.sensitivity.wacc.low)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Base Case:</span>
                <span className="text-white font-medium">{fmt.format(result.sensitivity.wacc.base)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">High WACC (+10%):</span>
                <span className="text-red-300 font-medium">{fmt.format(result.sensitivity.wacc.high)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              REFINED: Tighter WACC range (±10%)
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-4">📈 Growth Sensitivity</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Conservative (-10%):</span>
                <span className="text-orange-300 font-medium">{fmt.format(result.sensitivity.growth.conservative)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Base Case:</span>
                <span className="text-white font-medium">{fmt.format(result.sensitivity.growth.base)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Aggressive (+15%):</span>
                <span className="text-green-300 font-medium">{fmt.format(result.sensitivity.growth.aggressive)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              REFINED: Tighter growth range
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-300 mb-4">💰 Margin Sensitivity</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Low Margins (-8%):</span>
                <span className="text-red-300 font-medium">{fmt.format(result.sensitivity.margins.low)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Base Case:</span>
                <span className="text-white font-medium">{fmt.format(result.sensitivity.margins.base)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">High Margins (+10%):</span>
                <span className="text-green-300 font-medium">{fmt.format(result.sensitivity.margins.high)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              REFINED: Tighter margin range
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">🚀 Synergy Sensitivity</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">No Synergies:</span>
                <span className="text-red-300 font-medium">{fmt.format(result.sensitivity.synergies.none)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Base Case:</span>
                <span className="text-white font-medium">{fmt.format(result.sensitivity.synergies.base)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Full Realization:</span>
                <span className="text-green-300 font-medium">{fmt.format(result.sensitivity.synergies.full)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              NEW: Synergy impact analysis
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-300 mb-4">🐻 Bear Case</h3>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-300 mb-2">
                {fmt.format(result.scenarios.bear)}
              </div>
              <div className="text-sm text-gray-300">
                Economic downturn, increased competition, margin compression
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-4">📊 Base Case</h3>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300 mb-2">
                {fmt.format(result.scenarios.base)}
              </div>
              <div className="text-sm text-gray-300">
                Expected performance with moderate growth and stable margins
              </div>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-300 mb-4">🚀 Bull Case</h3>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300 mb-2">
                {fmt.format(result.scenarios.bull)}
              </div>
              <div className="text-sm text-gray-300">
                Strong growth, successful synergies, market expansion
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'synergies' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">📅 Synergy Phasing Schedule</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-900/20 rounded-lg">
                  <span className="text-gray-300">Year 1 (Ramp-up):</span>
                  <span className="text-white font-medium">{fmt.format(result.synergyPhasing.yearOne)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-900/20 rounded-lg">
                  <span className="text-gray-300">Year 2 (65% Realization):</span>
                  <span className="text-white font-medium">{fmt.format(result.synergyPhasing.yearTwo)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-900/20 rounded-lg">
                  <span className="text-gray-300">Year 3+ (Steady State):</span>
                  <span className="text-white font-medium">{fmt.format(result.synergyPhasing.steadyState)}</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-400">
                REFINED: Non-linear realization schedule (30% → 65% → 100%)
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-4">🎯 Value Creation Timeline</h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-300 mb-3">Cumulative Synergy Value Impact:</div>
                
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        Year 1
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        30%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div style={{ width: "30%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                        Year 2
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-green-600">
                        65%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                    <div style={{ width: "65%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                        Year 3+
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-purple-600">
                        100%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                    <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-4">💡 Synergy Implementation Insights</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-300 mb-2">🏭 Operations (Year 1)</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Process standardization</li>
                  <li>• Staff cross-training</li>
                  <li>• Initial efficiency gains</li>
                </ul>
              </div>
              <div className="p-4 bg-green-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-green-300 mb-2">📈 Growth (Year 2)</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Technology integration</li>
                  <li>• Marketing optimization</li>
                  <li>• Scale economies realized</li>
                </ul>
              </div>
              <div className="p-4 bg-purple-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-purple-300 mb-2">🎯 Maturity (Year 3+)</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Full cross-selling active</li>
                  <li>• Franchise value realized</li>
                  <li>• Market leadership position</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 