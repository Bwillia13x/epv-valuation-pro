import React from 'react';

// Example of how to transform existing components with new design system

interface MetricCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'percentage' | 'number';
  change?: number;
  subtitle?: string;
  status?: 'positive' | 'negative' | 'neutral' | 'premium';
  icon?: string;
  size?: 'small' | 'medium' | 'large';
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

export const ImprovedMetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  format,
  change,
  subtitle,
  status = 'neutral',
  icon,
  size = 'medium'
}) => {
  // Status-based styling using new design system
  const statusStyles = {
    positive: 'card-status-positive border-emerald-200',
    negative: 'card-status-critical border-red-200', 
    neutral: 'bg-white border-slate-200',
    premium: 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
  };

  // Size-based styling
  const sizeStyles = {
    small: {
      container: 'p-4',
      title: 'financial-caption',
      value: 'financial-secondary',
      icon: 'text-lg'
    },
    medium: {
      container: 'p-6', 
      title: 'financial-caption',
      value: 'financial-primary',
      icon: 'text-2xl'
    },
    large: {
      container: 'p-8',
      title: 'financial-caption', 
      value: 'financial-hero',
      icon: 'text-3xl'
    }
  };

  // Change indicator styling
  const getChangeStyle = (change: number) => {
    if (change > 0) return 'text-financial-positive';
    if (change < 0) return 'text-financial-negative';
    return 'text-financial-neutral';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '→';
  };

  return (
    <div className={`
      card-metric-primary hover-lift hover-glow
      ${statusStyles[status]}
      ${sizeStyles[size].container}
      transition-all duration-300
    `}>
      {/* Header with icon and change indicator */}
      <div className="flex items-start justify-between mb-space-tight">
        <div className="flex items-center space-x-2">
          {icon && (
            <span className={`${sizeStyles[size].icon}`}>
              {icon}
            </span>
          )}
          <h3 className={sizeStyles[size].title}>
            {title}
          </h3>
        </div>
        
        {change !== undefined && (
          <div className={`
            status-badge-${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}
            flex items-center space-x-1
          `}>
            <span>{getChangeIcon(change)}</span>
            <span className="font-mono text-xs">
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Main value */}
      <div className={`${sizeStyles[size].value} mb-space-tight`}>
        {formatValue(value, format)}
      </div>

      {/* Subtitle/description */}
      {subtitle && (
        <div className="financial-caption text-slate-500">
          {subtitle}
        </div>
      )}

      {/* Progress bar for certain metrics */}
      {status === 'premium' && (
        <div className="mt-space-element">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: '75%' }}
            />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Above market average
          </div>
        </div>
      )}
    </div>
  );
};

// Example usage component showing before/after
export const MetricCardDemo: React.FC = () => {
  const sampleMetrics = [
    {
      title: "Enterprise Value",
      value: 2850000,
      format: "currency" as const,
      change: 12.4,
      status: "positive" as const,
      icon: "🏢",
      subtitle: "Based on EPV methodology"
    },
    {
      title: "EBITDA Margin", 
      value: 0.22,
      format: "percentage" as const,
      change: 2.1,
      status: "positive" as const,
      icon: "📈",
      subtitle: "Above industry average"
    },
    {
      title: "Revenue Multiple",
      value: 3.2,
      format: "number" as const,
      change: -0.5,
      status: "premium" as const,
      icon: "💰",
      subtitle: "Premium valuation range"
    },
    {
      title: "WACC",
      value: 0.125,
      format: "percentage" as const, 
      change: -1.2,
      status: "positive" as const,
      icon: "⚖️",
      subtitle: "Risk-adjusted discount rate"
    }
  ];

  return (
    <div className="space-section">
      <div className="mb-space-component">
        <h2 className="content-section-title">Enhanced Metric Cards</h2>
        <p className="content-body">
          Demonstrating the improved design system with professional financial data presentation.
        </p>
      </div>

      {/* Different sizes */}
      <div className="space-component">
        <h3 className="content-subsection-title mb-space-element">Size Variations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ImprovedMetricCard
            size="small"
            title="Quick Metric"
            value={125000}
            format="currency"
            icon="💡"
            status="neutral"
          />
          <ImprovedMetricCard
            size="medium" 
            title="Standard Metric"
            value={2850000}
            format="currency"
            change={12.4}
            icon="🏢"
            status="positive"
            subtitle="Enterprise valuation"
          />
          <ImprovedMetricCard
            size="large"
            title="Hero Metric"
            value={0.22}
            format="percentage" 
            change={5.7}
            icon="📈"
            status="premium"
            subtitle="Premium performance indicator"
          />
        </div>
      </div>

      {/* Status variations */}
      <div className="space-component">
        <h3 className="content-subsection-title mb-space-element">Status Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleMetrics.map((metric, index) => (
            <ImprovedMetricCard
              key={index}
              {...metric}
            />
          ))}
        </div>
      </div>

      {/* Implementation note */}
      <div className="card-financial-highlight p-6 mt-space-component">
        <h4 className="content-subsection-title text-blue-900 mb-2">
          Implementation Notes
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Uses enhanced design system classes for consistency</li>
          <li>• Semantic color coding for financial status</li>
          <li>• Responsive grid layouts with proper spacing</li>
          <li>• Micro-interactions for better user feedback</li>
          <li>• Accessible focus states and proper contrast</li>
        </ul>
      </div>
    </div>
  );
};

export default ImprovedMetricCard; 