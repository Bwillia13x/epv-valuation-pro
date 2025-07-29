import React from 'react';

// Type definitions for dashboard data
interface ValuationSummary {
  epvValue: number;
  epvPercentile25: number;
  epvPercentile75: number;
  confidenceLevel: number;
  recommendedMethod: string;
  lastUpdated: Date;
}

interface KeyRatio {
  label: string;
  value: number | string;
  benchmark?: number | string;
  status: 'good' | 'warning' | 'critical' | 'neutral';
  format: 'currency' | 'percentage' | 'ratio' | 'number';
}

interface RiskIndicator {
  category: string;
  level: 'low' | 'medium' | 'high';
  score: number;
  description: string;
  factors: string[];
}

interface AnalysisProgress {
  section: string;
  completed: number;
  total: number;
  status: 'pending' | 'in_progress' | 'completed' | 'requires_review';
  lastUpdated?: Date;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary' | 'outline';
}

export interface ExecutiveDashboardProps {
  valuationSummary?: ValuationSummary;
  keyRatios?: KeyRatio[];
  riskIndicators?: RiskIndicator[];
  analysisProgress?: AnalysisProgress[];
  quickActions?: QuickAction[];
  theme?: 'light' | 'dark';
  onNavigate?: (section: string) => void;
}

// Utility functions
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

const formatRatio = (value: number) => `${value.toFixed(2)}x`;

const formatValue = (value: number | string, format: KeyRatio['format']) => {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'ratio':
      return formatRatio(value);
    case 'number':
      return value.toLocaleString();
    default:
      return value.toString();
  }
};

const getStatusColor = (
  status: KeyRatio['status'],
  theme: 'light' | 'dark'
) => {
  const colors = {
    light: {
      good: 'text-green-700 bg-green-50 border-green-200',
      warning: 'text-amber-700 bg-amber-50 border-amber-200',
      critical: 'text-red-700 bg-red-50 border-red-200',
      neutral: 'text-slate-700 bg-slate-50 border-slate-200',
    },
    dark: {
      good: 'text-green-300 bg-green-900/30 border-green-700',
      warning: 'text-amber-300 bg-amber-900/30 border-amber-700',
      critical: 'text-red-300 bg-red-900/30 border-red-700',
      neutral: 'text-slate-300 bg-slate-800 border-slate-600',
    },
  };
  return colors[theme][status];
};

const getRiskLevelColor = (
  level: RiskIndicator['level'],
  theme: 'light' | 'dark'
) => {
  const colors = {
    light: {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-amber-100 text-amber-800',
      high: 'bg-red-100 text-red-800',
    },
    dark: {
      low: 'bg-green-900/30 text-green-300',
      medium: 'bg-amber-900/30 text-amber-300',
      high: 'bg-red-900/30 text-red-300',
    },
  };
  return colors[theme][level];
};

// Default mock data for demonstration
const defaultValuationSummary: ValuationSummary = {
  epvValue: 2850000,
  epvPercentile25: 2550000,
  epvPercentile75: 3150000,
  confidenceLevel: 0.85,
  recommendedMethod: 'Hybrid: Multi-Method',
  lastUpdated: new Date(),
};

const defaultKeyRatios: KeyRatio[] = [
  {
    label: 'Revenue Multiple',
    value: 3.2,
    benchmark: 2.8,
    status: 'good',
    format: 'ratio',
  },
  {
    label: 'EBITDA Margin',
    value: 0.22,
    benchmark: 0.18,
    status: 'good',
    format: 'percentage',
  },
  {
    label: 'ROIC',
    value: 0.28,
    benchmark: 0.15,
    status: 'good',
    format: 'percentage',
  },
  {
    label: 'Debt/EBITDA',
    value: 1.2,
    benchmark: 2.5,
    status: 'good',
    format: 'ratio',
  },
  {
    label: 'Free Cash Flow Yield',
    value: 0.15,
    benchmark: 0.12,
    status: 'good',
    format: 'percentage',
  },
  {
    label: 'Growth Rate',
    value: 0.08,
    benchmark: 0.05,
    status: 'warning',
    format: 'percentage',
  },
];

const defaultRiskIndicators: RiskIndicator[] = [
  {
    category: 'Market Risk',
    level: 'medium',
    score: 6.2,
    description: 'Moderate exposure to economic cycles',
    factors: [
      'Consumer discretionary spending',
      'Local competition',
      'Insurance reimbursement',
    ],
  },
  {
    category: 'Operational Risk',
    level: 'low',
    score: 3.8,
    description: 'Well-established operations',
    factors: [
      'Staff retention',
      'Equipment maintenance',
      'Regulatory compliance',
    ],
  },
  {
    category: 'Financial Risk',
    level: 'low',
    score: 2.9,
    description: 'Strong financial position',
    factors: ['Cash flow stability', 'Debt coverage', 'Working capital'],
  },
];

const defaultAnalysisProgress: AnalysisProgress[] = [
  { section: 'Data Input', completed: 8, total: 10, status: 'completed' },
  {
    section: 'Financial Analysis',
    completed: 6,
    total: 8,
    status: 'in_progress',
  },
  {
    section: 'Valuation Models',
    completed: 4,
    total: 6,
    status: 'in_progress',
  },
  { section: 'Risk Assessment', completed: 2, total: 5, status: 'pending' },
  { section: 'Validation', completed: 0, total: 4, status: 'pending' },
];

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  valuationSummary = defaultValuationSummary,
  keyRatios = defaultKeyRatios,
  riskIndicators = defaultRiskIndicators,
  analysisProgress = defaultAnalysisProgress,
  quickActions = [],
  theme = 'light',
  onNavigate,
}) => {
  const containerClasses = `p-6 space-y-6 ${
    theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
  }`;

  const cardClasses = `rounded-xl border p-6 ${
    theme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
  } shadow-sm`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p
            className={`mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}
          >
            Comprehensive valuation overview and key insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span
            className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}
          >
            Last updated: {valuationSummary.lastUpdated.toLocaleDateString()} at{' '}
            {valuationSummary.lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Valuation Summary - Hero Card */}
      <div className={`${cardClasses} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <div className="text-6xl">💎</div>
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Enterprise Valuation Summary
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                theme === 'dark'
                  ? 'bg-blue-900/30 text-blue-300'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {valuationSummary.recommendedMethod}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(valuationSummary.epvValue)}
              </div>
              <div
                className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}
              >
                Primary Valuation
              </div>
            </div>

            <div className="text-center md:text-left">
              <div
                className={`text-lg ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}
              >
                {formatCurrency(valuationSummary.epvPercentile25)} -{' '}
                {formatCurrency(valuationSummary.epvPercentile75)}
              </div>
              <div
                className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}
              >
                Confidence Range (25th-75th percentile)
              </div>
            </div>

            <div className="text-center md:text-left">
              <div
                className={`text-lg ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}
              >
                {formatPercentage(valuationSummary.confidenceLevel)}
              </div>
              <div
                className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}
              >
                Model Confidence
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Financial Ratios */}
        <div className={cardClasses}>
          <h3 className="text-lg font-semibold mb-4">Key Financial Ratios</h3>
          <div className="space-y-3">
            {keyRatios.map((ratio, index) => (
              <div key={index} className="flex items-center justify-between">
                <span
                  className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}
                >
                  {ratio.label}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {formatValue(ratio.value, ratio.format)}
                  </span>
                  {ratio.benchmark && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                        ratio.status,
                        theme
                      )}`}
                    >
                      vs {formatValue(ratio.benchmark, ratio.format)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Assessment Panel */}
        <div className={cardClasses}>
          <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
          <div className="space-y-4">
            {riskIndicators.map((risk, index) => (
              <div key={index} className="border-l-4 border-gray-200 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{risk.category}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(
                      risk.level,
                      theme
                    )}`}
                  >
                    {risk.level.toUpperCase()}
                  </span>
                </div>
                <p
                  className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}
                >
                  {risk.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {risk.factors.slice(0, 2).map((factor, factorIndex) => (
                    <span
                      key={factorIndex}
                      className={`text-xs px-2 py-1 rounded ${
                        theme === 'dark'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {factor}
                    </span>
                  ))}
                  {risk.factors.length > 2 && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        theme === 'dark'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      +{risk.factors.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Progress Tracker */}
      <div className={cardClasses}>
        <h3 className="text-lg font-semibold mb-4">Analysis Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {analysisProgress.map((progress, index) => {
            const completionPercent =
              (progress.completed / progress.total) * 100;
            const statusColors = {
              pending: theme === 'dark' ? 'text-slate-400' : 'text-gray-400',
              in_progress: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
              completed: theme === 'dark' ? 'text-green-400' : 'text-green-600',
              requires_review:
                theme === 'dark' ? 'text-amber-400' : 'text-amber-600',
            };

            return (
              <div key={index} className="text-center">
                <div
                  className={`text-sm font-medium mb-2 ${statusColors[progress.status]}`}
                >
                  {progress.section}
                </div>
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg
                    className="w-16 h-16 transform -rotate-90"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
                      strokeWidth="2"
                      fill="none"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke={
                        statusColors[progress.status].includes('blue')
                          ? '#3b82f6'
                          : statusColors[progress.status].includes('green')
                            ? '#10b981'
                            : '#6b7280'
                      }
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${completionPercent * 0.628} 62.8`}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {Math.round(completionPercent)}%
                    </span>
                  </div>
                </div>
                <div
                  className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  {progress.completed}/{progress.total} tasks
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className={cardClasses}>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                  action.variant === 'primary'
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : action.variant === 'secondary'
                      ? theme === 'dark'
                        ? 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200'
                      : theme === 'dark'
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="font-medium">{action.label}</div>
                <div
                  className={`text-sm mt-1 ${
                    action.variant === 'primary'
                      ? 'text-blue-100'
                      : theme === 'dark'
                        ? 'text-slate-400'
                        : 'text-gray-600'
                  }`}
                >
                  {action.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveDashboard;
