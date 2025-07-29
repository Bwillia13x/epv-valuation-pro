import React, { useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  status?: 'positive' | 'negative' | 'neutral';
  format?: 'currency' | 'percentage' | 'number';
  icon?: string;
}

interface ProgressMetricProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  status?: 'on-track' | 'behind' | 'ahead';
}

interface EnhancedDashboardProps {
  valuationData: {
    enterpriseValue: number;
    equityValue: number;
    revenue: number;
    ebitda: number;
    wacc: number;
  };
  performanceMetrics: MetricCardProps[];
  progressMetrics: ProgressMetricProps[];
  onNavigate?: (section: string) => void;
}

const formatValue = (value: number, format?: string) => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    default:
      return value.toLocaleString();
  }
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  status = 'neutral',
  format,
  icon
}) => {
  const statusClasses = {
    positive: 'card-status-positive',
    negative: 'card-status-critical',
    neutral: 'bg-white border-slate-200'
  };

  const changeClasses = {
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-slate-600'
  };

  return (
    <div className={`card-metric-primary hover-lift ${statusClasses[status]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="financial-caption mb-2">
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </div>
          <div className="financial-primary mb-1">
            {typeof value === 'number' ? formatValue(value, format) : value}
          </div>
          {subtitle && (
            <div className="financial-caption text-slate-500">
              {subtitle}
            </div>
          )}
        </div>
        {change !== undefined && (
          <div className={`text-sm font-medium ${changeClasses[change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral']}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};

const ProgressMetric: React.FC<ProgressMetricProps> = ({
  label,
  current,
  target,
  unit = '',
  status = 'on-track'
}) => {
  const progress = Math.min((current / target) * 100, 100);
  
  const statusConfig = {
    'on-track': { 
      color: 'progress-fill', 
      badge: 'status-badge-positive',
      text: 'On Track'
    },
    'behind': { 
      color: 'progress-fill-warning', 
      badge: 'status-badge-negative',
      text: 'Behind'
    },
    'ahead': { 
      color: 'progress-fill-success', 
      badge: 'status-badge-positive',
      text: 'Ahead'
    }
  };

  return (
    <div className="card-metric-secondary">
      <div className="flex items-center justify-between mb-3">
        <span className="financial-caption">{label}</span>
        <span className={statusConfig[status].badge}>
          {statusConfig[status].text}
        </span>
      </div>
      
      <div className="flex items-baseline justify-between mb-2">
        <span className="financial-secondary">
          {current.toLocaleString()}{unit}
        </span>
        <span className="financial-caption">
          Target: {target.toLocaleString()}{unit}
        </span>
      </div>
      
      <div className="progress-bar">
        <div 
          className={statusConfig[status].color}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="mt-2 text-xs text-slate-500">
        {progress.toFixed(1)}% of target
      </div>
    </div>
  );
};

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  action: string;
  onClick: () => void;
}> = ({ title, description, icon, action, onClick }) => (
  <div className="card-metric-primary hover-lift hover-glow cursor-pointer" onClick={onClick}>
    <div className="flex items-start space-x-4">
      <div className="text-3xl">{icon}</div>
      <div className="flex-1">
        <h3 className="content-subsection-title">{title}</h3>
        <p className="text-sm text-slate-600 mb-3">{description}</p>
        <button className="btn-outline text-sm px-4 py-2">
          {action}
        </button>
      </div>
    </div>
  </div>
);

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  valuationData,
  performanceMetrics,
  progressMetrics,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'progress'>('overview');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-section">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="content-hero">Financial Analysis Dashboard</h1>
        <p className="content-body text-slate-600">
          Comprehensive EPV valuation analysis with real-time insights and performance tracking.
        </p>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 space-component">
        <MetricCard
          title="Enterprise Value"
          value={valuationData.enterpriseValue}
          format="currency"
          icon="🏢"
          status="positive"
          change={12.4}
        />
        <MetricCard
          title="Equity Value"
          value={valuationData.equityValue}
          format="currency"
          icon="💰"
          status="positive"
          change={8.7}
        />
        <MetricCard
          title="Annual Revenue"
          value={valuationData.revenue}
          format="currency"
          icon="📈"
          status="neutral"
          change={15.2}
        />
        <MetricCard
          title="WACC"
          value={valuationData.wacc}
          format="percentage"
          icon="⚖️"
          status="positive"
          change={-0.5}
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 space-component">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'metrics', label: 'Performance Metrics', icon: '📈' },
            { id: 'progress', label: 'Analysis Progress', icon: '🎯' }
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
      <div className="space-component">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <QuickActionCard
              title="Run Monte Carlo"
              description="Execute risk simulation with 10,000 iterations"
              icon="🎲"
              action="Start Analysis"
              onClick={() => onNavigate?.('monte-carlo')}
            />
            <QuickActionCard
              title="Sensitivity Analysis"
              description="Test WACC and margin sensitivity scenarios"
              icon="📊"
              action="View Analysis"
              onClick={() => onNavigate?.('sensitivity')}
            />
            <QuickActionCard
              title="Export Report"
              description="Generate comprehensive valuation report"
              icon="📋"
              action="Generate PDF"
              onClick={() => onNavigate?.('export')}
            />
            <QuickActionCard
              title="Benchmark Analysis"
              description="Compare against industry benchmarks"
              icon="⚖️"
              action="View Benchmarks"
              onClick={() => onNavigate?.('benchmarks')}
            />
            <QuickActionCard
              title="Scenario Planning"
              description="Explore base, bull, and bear scenarios"
              icon="🎯"
              action="Build Scenarios"
              onClick={() => onNavigate?.('scenarios')}
            />
            <QuickActionCard
              title="Data Validation"
              description="Cross-check calculations and assumptions"
              icon="✅"
              action="Validate Data"
              onClick={() => onNavigate?.('validation')}
            />
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceMetrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {progressMetrics.map((metric, index) => (
              <ProgressMetric key={index} {...metric} />
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="card-financial-highlight text-center py-8">
        <h2 className="content-section-title text-blue-900 mb-4">
          Ready to Complete Your Analysis?
        </h2>
        <p className="content-body text-blue-700 mb-6 max-w-2xl mx-auto">
          Your valuation model is set up and ready. Review the key metrics above and proceed 
          to detailed analysis or export your comprehensive report.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            className="btn-financial-analysis"
            onClick={() => onNavigate?.('detailed-analysis')}
          >
            <span className="mr-2">🔬</span>
            Detailed Analysis
          </button>
          <button 
            className="btn-financial-export"
            onClick={() => onNavigate?.('export-report')}
          >
            <span className="mr-2">📊</span>
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard; 