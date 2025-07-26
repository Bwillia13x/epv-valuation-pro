import React, { useState, useMemo, useCallback } from "react";
import { 
  CompanyFinancialData, 
  PLLineItem, 
  PLDataPoint, 
  NormalizationSettings, 
  AnalysisResults,
  FinancialDataProcessor 
} from "../lib/financialDataProcessor";

// Utility functions
const fmt0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmt2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const pctFmt = (v: number) => `${(v * 100).toFixed(1)}%`;
const cx = (...args: (string | false | null | undefined)[]) => args.filter(Boolean).join(" ");

interface DataInputProps {
  theme: "dark" | "light";
  onDataChange: (data: CompanyFinancialData) => void;
  onAnalysisUpdate: (analysis: AnalysisResults) => void;
}

// Main data input component with tabbed interface
export const FinancialDataInput = ({ theme, onDataChange, onAnalysisUpdate }: DataInputProps) => {
  const [activeDataTab, setActiveDataTab] = useState<"manual" | "import" | "analysis" | "settings">("manual");
  const [financialData, setFinancialData] = useState<CompanyFinancialData>(() =>
    FinancialDataProcessor.createEmptyDataset(5, 'medispa')
  );
  
  const [normalizationSettings, setNormalizationSettings] = useState<NormalizationSettings>({
    yearsToAnalyze: 5,
    outlierThreshold: 0.5,
    normalizationMethod: 'median',
    adjustments: {
      removeOneTimeItems: true,
      normalizeSeasonality: false,
      adjustForInflation: false,
      inflationRate: 0.025
    },
    customAdjustments: []
  });

  const [analysis, setAnalysis] = useState<AnalysisResults | null>(null);

  // Update analysis when data or settings change
  const updateAnalysis = useCallback(() => {
    try {
      const enrichedData = FinancialDataProcessor.calculateDerivedMetrics(financialData);
      const newAnalysis = FinancialDataProcessor.normalizeData(enrichedData, normalizationSettings);
      setAnalysis(newAnalysis);
      onAnalysisUpdate(newAnalysis);
      onDataChange(enrichedData);
    } catch (error) {
      console.error('Analysis update failed:', error);
    }
  }, [financialData, normalizationSettings, onDataChange, onAnalysisUpdate]);

  React.useEffect(() => {
    updateAnalysis();
  }, [updateAnalysis]);

  return (
    <div className="space-y-6">
      {/* Data Input Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveDataTab("manual")}
          className={cx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeDataTab === "manual"
              ? (theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-600 text-white")
              : (theme === "dark" ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-white text-slate-700 hover:bg-slate-50 border")
          )}
        >
          📊 Manual Input
        </button>
        <button
          onClick={() => setActiveDataTab("import")}
          className={cx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeDataTab === "import"
              ? (theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-600 text-white")
              : (theme === "dark" ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-white text-slate-700 hover:bg-slate-50 border")
          )}
        >
          📁 Import Data
        </button>
        <button
          onClick={() => setActiveDataTab("analysis")}
          className={cx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeDataTab === "analysis"
              ? (theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-600 text-white")
              : (theme === "dark" ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-white text-slate-700 hover:bg-slate-50 border")
          )}
        >
          📈 Analysis
        </button>
        <button
          onClick={() => setActiveDataTab("settings")}
          className={cx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeDataTab === "settings"
              ? (theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-600 text-white")
              : (theme === "dark" ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-white text-slate-700 hover:bg-slate-50 border")
          )}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Manual Input Tab */}
      {activeDataTab === "manual" && (
        <ManualDataInput 
          theme={theme}
          data={financialData}
          onChange={setFinancialData}
        />
      )}

      {/* Import Tab */}
      {activeDataTab === "import" && (
        <DataImport 
          theme={theme}
          onDataImported={(importedData) => {
            setFinancialData(prev => ({
              ...prev,
              ...importedData,
              lastUpdated: new Date()
            }));
          }}
        />
      )}

      {/* Analysis Tab */}
      {activeDataTab === "analysis" && analysis && (
        <AnalysisDisplay 
          theme={theme}
          analysis={analysis}
          data={financialData}
        />
      )}

      {/* Settings Tab */}
      {activeDataTab === "settings" && (
        <NormalizationSettingsPanel 
          theme={theme}
          settings={normalizationSettings}
          onChange={setNormalizationSettings}
          data={financialData}
        />
      )}
    </div>
  );
};

// Spreadsheet-like manual data input component
const ManualDataInput = ({ 
  theme, 
  data, 
  onChange 
}: { 
  theme: "dark" | "light"; 
  data: CompanyFinancialData;
  onChange: (data: CompanyFinancialData) => void;
}) => {
  
  const years = useMemo(() => {
    if (data.lineItems.length === 0) return [];
    return data.lineItems[0].data.map(d => d.year).sort((a, b) => a - b);
  }, [data.lineItems]);

  const updateLineItem = (lineItemIndex: number, year: number, value: number | null) => {
    const newData = { ...data };
    const lineItem = newData.lineItems[lineItemIndex];
    const dataPoint = lineItem.data.find(d => d.year === year);
    if (dataPoint) {
      dataPoint.value = value;
      dataPoint.isEstimated = false;
    }
    newData.lastUpdated = new Date();
    onChange(newData);
  };

  const addYear = (year: number) => {
    const newData = { ...data };
    newData.lineItems.forEach(item => {
      if (!item.data.find(d => d.year === year)) {
        item.data.push({ year, value: null });
        item.data.sort((a, b) => a.year - b.year);
      }
    });
    newData.lastUpdated = new Date();
    onChange(newData);
  };

  const addLineItem = (category: 'revenue' | 'cogs' | 'opex' | 'other') => {
    const newData = { ...data };
    const newItem: PLLineItem = {
      id: `custom_${Date.now()}`,
      name: 'New Line Item',
      category,
      data: years.map(year => ({ year, value: null }))
    };
    newData.lineItems.push(newItem);
    newData.lastUpdated = new Date();
    onChange(newData);
  };

  const categoryColors = {
    revenue: theme === 'dark' ? 'bg-green-900/20 border-green-600/30' : 'bg-green-50 border-green-200',
    cogs: theme === 'dark' ? 'bg-red-900/20 border-red-600/30' : 'bg-red-50 border-red-200',
    opex: theme === 'dark' ? 'bg-orange-900/20 border-orange-600/30' : 'bg-orange-50 border-orange-200',
    other: theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'
  };

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Company Name</label>
            <input
              type="text"
              value={data.companyName}
              onChange={(e) => onChange({ ...data, companyName: e.target.value })}
              className={cx("w-full px-3 py-2 rounded border text-sm", 
                theme === "dark" ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"
              )}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Industry</label>
            <input
              type="text"
              value={data.industry}
              onChange={(e) => onChange({ ...data, industry: e.target.value })}
              className={cx("w-full px-3 py-2 rounded border text-sm", 
                theme === "dark" ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"
              )}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Currency</label>
            <select
              value={data.currency}
              onChange={(e) => onChange({ ...data, currency: e.target.value })}
              className={cx("w-full px-3 py-2 rounded border text-sm", 
                theme === "dark" ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"
              )}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Year Management */}
      <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Years: {years.join(', ')}</h3>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Add year (e.g., 2024)"
              className={cx("px-3 py-2 rounded border text-sm w-32", 
                theme === "dark" ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"
              )}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const year = parseInt((e.target as HTMLInputElement).value);
                  if (year && year > 2000 && year < 2050) {
                    addYear(year);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* P&L Data Table */}
      <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
        <h3 className="text-lg font-semibold mb-4">Financial Data</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cx("border-b", theme === "dark" ? "border-slate-700" : "border-slate-200")}>
                <th className="text-left p-2 font-medium">Line Item</th>
                <th className="text-left p-2 font-medium w-24">Category</th>
                {years.map(year => (
                  <th key={year} className="text-right p-2 font-medium w-32">{year}</th>
                ))}
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {data.lineItems.map((item, itemIndex) => (
                <tr 
                  key={item.id} 
                  className={cx(
                    "border-b",
                    categoryColors[item.category],
                    theme === "dark" ? "border-slate-700" : "border-slate-200"
                  )}
                >
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const newData = { ...data };
                        newData.lineItems[itemIndex].name = e.target.value;
                        onChange(newData);
                      }}
                      className={cx("w-full px-2 py-1 rounded border text-sm bg-transparent", 
                        theme === "dark" ? "border-slate-600" : "border-slate-300"
                      )}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={item.category}
                      onChange={(e) => {
                        const newData = { ...data };
                        newData.lineItems[itemIndex].category = e.target.value as any;
                        onChange(newData);
                      }}
                      className={cx("w-full px-2 py-1 rounded border text-xs", 
                        theme === "dark" ? "bg-slate-700 border-slate-600" : "bg-white border-slate-300"
                      )}
                    >
                      <option value="revenue">Revenue</option>
                      <option value="cogs">COGS</option>
                      <option value="opex">OpEx</option>
                      <option value="other">Other</option>
                    </select>
                  </td>
                  {years.map(year => {
                    const dataPoint = item.data.find(d => d.year === year);
                    return (
                      <td key={year} className="p-2">
                        <input
                          type="number"
                          value={dataPoint?.value || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : null;
                            updateLineItem(itemIndex, year, value);
                          }}
                          className={cx("w-full px-2 py-1 rounded border text-sm text-right font-mono", 
                            theme === "dark" ? "bg-slate-700 border-slate-600" : "bg-white border-slate-300"
                          )}
                          placeholder="0"
                        />
                      </td>
                    );
                  })}
                  <td className="p-2">
                    <button
                      onClick={() => {
                        const newData = { ...data };
                        newData.lineItems.splice(itemIndex, 1);
                        onChange(newData);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Line Item Controls */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => addLineItem('revenue')}
            className="px-3 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700"
          >
            + Revenue
          </button>
          <button
            onClick={() => addLineItem('cogs')}
            className="px-3 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
          >
            + COGS
          </button>
          <button
            onClick={() => addLineItem('opex')}
            className="px-3 py-1 rounded text-xs bg-orange-600 text-white hover:bg-orange-700"
          >
            + OpEx
          </button>
          <button
            onClick={() => addLineItem('other')}
            className="px-3 py-1 rounded text-xs bg-slate-600 text-white hover:bg-slate-700"
          >
            + Other
          </button>
        </div>
      </div>
    </div>
  );
};

// CSV Import component
const DataImport = ({ 
  theme, 
  onDataImported 
}: { 
  theme: "dark" | "light";
  onDataImported: (data: Partial<CompanyFinancialData>) => void;
}) => {
  const [csvText, setCsvText] = useState('');
  const [hasHeaders, setHasHeaders] = useState(true);
  const [previewData, setPreviewData] = useState<Partial<CompanyFinancialData> | null>(null);

  const handlePreview = () => {
    try {
      const data = FinancialDataProcessor.parseCSVData(csvText, hasHeaders);
      setPreviewData(data);
    } catch (error) {
      alert('Error parsing CSV data. Please check the format.');
    }
  };

  const handleImport = () => {
    if (previewData) {
      onDataImported(previewData);
      setCsvText('');
      setPreviewData(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
        <h3 className="text-lg font-semibold mb-4">Import P&L Data from CSV</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">CSV Format Example:</label>
            <div className={cx("p-3 rounded text-xs font-mono", theme === "dark" ? "bg-slate-800" : "bg-slate-100")}>
              Line Item,2020,2021,2022,2023,2024<br/>
              Total Revenue,1000000,1200000,1350000,1500000,1650000<br/>
              Total COGS,400000,480000,540000,600000,660000<br/>
              Marketing,80000,96000,108000,120000,132000<br/>
              ...
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={hasHeaders}
                onChange={(e) => setHasHeaders(e.target.checked)}
                className="rounded"
              />
              <span>First row contains headers</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Paste CSV Data:</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste your CSV data here..."
              className={cx("w-full h-64 px-3 py-2 rounded border text-sm font-mono", 
                theme === "dark" ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"
              )}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              disabled={!csvText.trim()}
              className={cx(
                "px-4 py-2 rounded font-medium",
                !csvText.trim()
                  ? "bg-slate-400 text-slate-200 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              Preview Data
            </button>
            
            {previewData && (
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded font-medium bg-green-600 hover:bg-green-700 text-white"
              >
                Import Data
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        {previewData && (
          <div className="mt-6">
            <h4 className="font-medium mb-2">Preview:</h4>
            <div className={cx("border rounded p-4 max-h-64 overflow-auto", theme === "dark" ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50")}>
              <div className="text-xs">
                <strong>Line Items Found:</strong> {previewData.lineItems?.length || 0}
                <br />
                <strong>Years Detected:</strong> {previewData.lineItems?.[0]?.data.map(d => d.year).join(', ') || 'None'}
              </div>
              
              {previewData.lineItems && previewData.lineItems.slice(0, 5).map((item, i) => (
                <div key={i} className="mt-2 p-2 border rounded text-xs">
                  <strong>{item.name}</strong> ({item.category})
                  <div className="mt-1">
                    {item.data.map(d => `${d.year}: ${d.value ? fmt0.format(d.value) : 'N/A'}`).join(' | ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Analysis display component
const AnalysisDisplay = ({ 
  theme, 
  analysis, 
  data 
}: { 
  theme: "dark" | "light";
  analysis: AnalysisResults;
  data: CompanyFinancialData;
}) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={cx("rounded-xl p-4 border", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
          <div className="text-sm text-slate-500">Revenue CAGR</div>
          <div className={cx("text-2xl font-bold", analysis.trends.revenue.cagr > 0 ? "text-green-400" : "text-red-400")}>
            {pctFmt(analysis.trends.revenue.cagr)}
          </div>
          <div className="text-xs text-slate-500">Trend: {analysis.trends.revenue.trend}</div>
        </div>
        
        <div className={cx("rounded-xl p-4 border", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
          <div className="text-sm text-slate-500">Normalized Revenue</div>
          <div className="text-2xl font-bold text-blue-400">{fmt0.format(analysis.normalized.revenue)}</div>
          <div className="text-xs text-slate-500">For EPV calculation</div>
        </div>
        
        <div className={cx("rounded-xl p-4 border", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
          <div className="text-sm text-slate-500">EBITDA Margin</div>
          <div className="text-2xl font-bold text-purple-400">{pctFmt(analysis.normalized.margins.ebitda)}</div>
          <div className="text-xs text-slate-500">Normalized</div>
        </div>
        
        <div className={cx("rounded-xl p-4 border", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
          <div className="text-sm text-slate-500">Data Quality</div>
          <div className="text-2xl font-bold text-emerald-400">{pctFmt(analysis.quality.dataCompleteness)}</div>
          <div className="text-xs text-slate-500">Completeness</div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
          <h3 className="text-lg font-semibold mb-4">Revenue Growth Trend</h3>
          <div className="space-y-2">
            {analysis.trends.growth.revenueGrowth.map((point, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{point.year}</span>
                <span className={cx("font-mono", point.value && point.value > 0 ? "text-green-400" : "text-red-400")}>
                  {point.value ? pctFmt(point.value) : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
          <h3 className="text-lg font-semibold mb-4">Margin Analysis</h3>
          <div className="space-y-2">
            {analysis.trends.margins.grossMargin.map((point, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{point.year}</span>
                <div className="space-x-2">
                  <span className="font-mono text-blue-400">
                    Gross: {point.value ? pctFmt(point.value) : 'N/A'}
                  </span>
                  <span className="font-mono text-purple-400">
                    EBITDA: {analysis.trends.margins.ebitdaMargin[i]?.value ? 
                      pctFmt(analysis.trends.margins.ebitdaMargin[i].value as number) : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Normalized Values for EPV */}
      <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
        <h3 className="text-lg font-semibold mb-4">📊 Normalized Values for EPV Calculation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded bg-blue-500/10 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{fmt0.format(analysis.normalized.revenue)}</div>
            <div className="text-sm text-slate-500">Revenue</div>
          </div>
          <div className="text-center p-4 rounded bg-green-500/10 border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{fmt0.format(analysis.normalized.grossProfit)}</div>
            <div className="text-sm text-slate-500">Gross Profit</div>
          </div>
          <div className="text-center p-4 rounded bg-purple-500/10 border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400">{fmt0.format(analysis.normalized.ebitda)}</div>
            <div className="text-sm text-slate-500">EBITDA</div>
          </div>
          <div className="text-center p-4 rounded bg-orange-500/10 border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-400">{pctFmt(analysis.normalized.margins.ebitda)}</div>
            <div className="text-sm text-slate-500">EBITDA Margin</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 rounded bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-sm font-medium text-emerald-400 mb-2">✅ Ready for EPV Calculation</div>
          <div className="text-xs text-slate-600">
            These normalized values can be used to populate the EPV model automatically. 
            Revenue CAGR: {pctFmt(analysis.trends.revenue.cagr)} | 
            Volatility: {pctFmt(analysis.trends.revenue.volatility)} | 
            Data Quality: {pctFmt(analysis.quality.dataCompleteness)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Normalization settings panel
const NormalizationSettingsPanel = ({ 
  theme, 
  settings, 
  onChange,
  data
}: { 
  theme: "dark" | "light";
  settings: NormalizationSettings;
  onChange: (settings: NormalizationSettings) => void;
  data: CompanyFinancialData;
}) => {
  return (
    <div className="space-y-6">
      <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
        <h3 className="text-lg font-semibold mb-4">Normalization Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Normalization Method</label>
            <select
              value={settings.normalizationMethod}
              onChange={(e) => onChange({
                ...settings,
                normalizationMethod: e.target.value as any
              })}
              className={cx("w-full px-3 py-2 rounded border", 
                theme === "dark" ? "bg-slate-700 border-slate-600" : "bg-white border-slate-300"
              )}
            >
              <option value="median">Median (Recommended)</option>
              <option value="average">Average</option>
              <option value="latest">Latest Year</option>
              <option value="trend">Trend Projection</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Years to Analyze</label>
            <input
              type="number"
              value={settings.yearsToAnalyze}
              onChange={(e) => onChange({
                ...settings,
                yearsToAnalyze: parseInt(e.target.value) || 5
              })}
              min="2"
              max="10"
              className={cx("w-full px-3 py-2 rounded border", 
                theme === "dark" ? "bg-slate-700 border-slate-600" : "bg-white border-slate-300"
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Outlier Threshold (%)</label>
            <input
              type="number"
              value={settings.outlierThreshold * 100}
              onChange={(e) => onChange({
                ...settings,
                outlierThreshold: (parseFloat(e.target.value) || 50) / 100
              })}
              min="10"
              max="100"
              step="5"
              className={cx("w-full px-3 py-2 rounded border", 
                theme === "dark" ? "bg-slate-700 border-slate-600" : "bg-white border-slate-300"
              )}
            />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium mb-3">Adjustments</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.adjustments.removeOneTimeItems}
                onChange={(e) => onChange({
                  ...settings,
                  adjustments: {
                    ...settings.adjustments,
                    removeOneTimeItems: e.target.checked
                  }
                })}
                className="rounded"
              />
              <span className="text-sm">Remove one-time items</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.adjustments.normalizeSeasonality}
                onChange={(e) => onChange({
                  ...settings,
                  adjustments: {
                    ...settings.adjustments,
                    normalizeSeasonality: e.target.checked
                  }
                })}
                className="rounded"
              />
              <span className="text-sm">Normalize seasonality</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.adjustments.adjustForInflation}
                onChange={(e) => onChange({
                  ...settings,
                  adjustments: {
                    ...settings.adjustments,
                    adjustForInflation: e.target.checked
                  }
                })}
                className="rounded"
              />
              <span className="text-sm">Adjust for inflation</span>
            </label>
            
            {settings.adjustments.adjustForInflation && (
              <div className="ml-6">
                <label className="block text-xs text-slate-500 mb-1">Inflation Rate (%)</label>
                <input
                  type="number"
                  value={(settings.adjustments.inflationRate || 0.025) * 100}
                  onChange={(e) => onChange({
                    ...settings,
                    adjustments: {
                      ...settings.adjustments,
                      inflationRate: (parseFloat(e.target.value) || 2.5) / 100
                    }
                  })}
                  step="0.1"
                  className={cx("w-32 px-2 py-1 rounded border text-sm", 
                    theme === "dark" ? "bg-slate-700 border-slate-600" : "bg-white border-slate-300"
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Quality Summary */}
      <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
        <h3 className="text-lg font-semibold mb-4">Data Quality Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Line Items:</span>
            <span className="font-mono">{data.lineItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Years of Data:</span>
            <span className="font-mono">{data.lineItems[0]?.data.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Updated:</span>
            <span className="font-mono">{data.lastUpdated.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Data Source:</span>
            <span className="font-mono capitalize">{data.dataSource}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 