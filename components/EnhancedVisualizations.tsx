import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import { FinancialDatasetV1, AgentAnalysis } from '../lib/types';
import { MetricGrid } from './ProgressiveDisclosure';

interface EnhancedVisualizationsProps {
  financialData: FinancialDatasetV1;
  agentAnalyses?: AgentAnalysis[];
}

export const EnhancedVisualizations: React.FC<EnhancedVisualizationsProps> = ({
  financialData,
  agentAnalyses = [],
}) => {
  // Prepare revenue trend data
  const revenueTrendData = React.useMemo(() => {
    const years = Object.keys(financialData.periods).sort();
    return years.map((year, index) => ({
      year,
      revenue: financialData.revenue.total[index] / 1000, // Convert to thousands
      grossProfit: financialData.gp[index] / 1000,
      margin:
        (financialData.gp[index] / financialData.revenue.total[index]) * 100,
    }));
  }, [financialData]);

  // Prepare service line breakdown data (latest year)
  const serviceLineData = React.useMemo(() => {
    const latestIndex = financialData.revenue.total.length - 1;
    return Object.entries(financialData.revenue)
      .filter(([key]) => key !== 'total')
      .map(([name, values]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: values[latestIndex] / 1000,
        percentage: (
          (values[latestIndex] / financialData.revenue.total[latestIndex]) *
          100
        ).toFixed(1),
      }))
      .sort((a, b) => b.value - a.value);
  }, [financialData]);

  // Prepare EBITDA bridge data
  const ebitdaBridgeData = React.useMemo(() => {
    const latestIndex = financialData.revenue.total.length - 1;
    const revenue = financialData.revenue.total[latestIndex] / 1000;
    const grossProfit = financialData.gp[latestIndex] / 1000;
    const marketing = financialData.opex.marketing?.[latestIndex] / 1000 || 0;
    const rent = financialData.opex.rent?.[latestIndex] / 1000 || 0;
    const payroll = financialData.payroll.total[latestIndex] / 1000;
    const otherOpex =
      (financialData.opex.total[latestIndex] - marketing - rent) / 1000;
    const operatingIncome =
      financialData.below_line.operating_income[latestIndex] / 1000;

    return [
      { name: 'Revenue', value: revenue, cumulative: revenue },
      {
        name: 'COGS',
        value: -(revenue - grossProfit),
        cumulative: grossProfit,
      },
      { name: 'Payroll', value: -payroll, cumulative: grossProfit - payroll },
      {
        name: 'Marketing',
        value: -marketing,
        cumulative: grossProfit - payroll - marketing,
      },
      {
        name: 'Rent',
        value: -rent,
        cumulative: grossProfit - payroll - marketing - rent,
      },
      { name: 'Other OpEx', value: -otherOpex, cumulative: operatingIncome },
    ];
  }, [financialData]);

  // Prepare agent consensus data
  const agentConsensusData = React.useMemo(() => {
    if (agentAnalyses.length === 0) return [];

    return agentAnalyses.map((analysis) => ({
      agent: analysis.agentType
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      enterpriseValue: analysis.enterpriseValue / 1000000, // Convert to millions
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
    }));
  }, [agentAnalyses]);

  // Professional Financial Color Palette
  const FINANCIAL_COLORS = {
    primary: '#0066d1', // Institutional blue
    positive: '#059669', // Professional green
    negative: '#dc2626', // Clear red
    neutral: '#6b7280', // Balanced gray
    accent: '#8b5cf6', // Purple accent
    warning: '#d97706', // Amber warning
  };

  const CHART_COLORS = [
    FINANCIAL_COLORS.primary,
    FINANCIAL_COLORS.positive,
    FINANCIAL_COLORS.accent,
    FINANCIAL_COLORS.warning,
    FINANCIAL_COLORS.neutral,
    FINANCIAL_COLORS.negative,
  ];

  return (
    <div className="space-y-8">
      {/* Revenue and Profitability Trends - Enhanced */}
      <div className="card-primary">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="metric-primary text-gray-900">
              Revenue & Profitability Trends
            </h3>
            <p className="metric-supporting">Historical performance analysis</p>
          </div>
          <div className="text-right">
            <div className="metric-secondary text-financial-positive">
              {((revenueTrendData[revenueTrendData.length - 1]?.revenue || 0) /
                (revenueTrendData[0]?.revenue || 1) -
                1) *
                100 >=
              0
                ? '+'
                : ''}
              {(
                ((revenueTrendData[revenueTrendData.length - 1]?.revenue || 0) /
                  (revenueTrendData[0]?.revenue || 1) -
                  1) *
                100
              ).toFixed(1)}
              %
            </div>
            <div className="metric-label">Total Growth</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={revenueTrendData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `$${value}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: any, name: string) => {
                return [
                  `$${value.toFixed(0)}K`,
                  name === 'revenue' ? 'Revenue' : 'Gross Profit',
                ];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" />
            <Bar
              dataKey="revenue"
              fill={FINANCIAL_COLORS.primary}
              name="Revenue"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="grossProfit"
              fill={FINANCIAL_COLORS.positive}
              name="Gross Profit"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Service Line Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-primary">
          <h3 className="metric-primary text-gray-900 mb-4">
            Revenue by Service Line (Latest Year)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceLineData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceLineData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`$${value.toFixed(0)}K`, 'Revenue']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card-primary">
          <h3 className="metric-primary text-gray-900 mb-4">
            Service Line Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceLineData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                formatter={(value: any) => [`$${value.toFixed(0)}K`, 'Revenue']}
              />
              <Bar dataKey="value" fill={FINANCIAL_COLORS.accent} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EBITDA Bridge Waterfall */}
      <div className="card-primary">
        <h3 className="metric-primary text-gray-900 mb-4">
          EBITDA Bridge (Waterfall Analysis)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ebitdaBridgeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value: any, name: string) => [
                `$${Math.abs(value).toFixed(0)}K`,
                value >= 0 ? 'Positive Impact' : 'Negative Impact',
              ]}
            />
            <Bar dataKey="value" fill={FINANCIAL_COLORS.primary} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Consensus Visualization */}
      {agentAnalyses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-primary">
            <h3 className="metric-primary text-gray-900 mb-4">
              Agent Valuation Spread
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentConsensusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="agent"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [
                    `$${value.toFixed(1)}M`,
                    'Enterprise Value',
                  ]}
                />
                <Bar
                  dataKey="enterpriseValue"
                  fill={FINANCIAL_COLORS.primary}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-primary">
            <h3 className="metric-primary text-gray-900 mb-4">
              Agent Confidence vs Valuation
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={agentConsensusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="enterpriseValue"
                  name="Enterprise Value"
                  unit="M"
                />
                <YAxis
                  dataKey="confidence"
                  name="Confidence"
                  type="category"
                  domain={['LOW', 'MEDIUM', 'HIGH']}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'enterpriseValue')
                      return [`$${value.toFixed(1)}M`, 'Enterprise Value'];
                    return [value, 'Confidence Level'];
                  }}
                />
                <Scatter
                  dataKey="enterpriseValue"
                  fill={FINANCIAL_COLORS.accent}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Key Metrics Summary Cards */}
      <MetricGrid
        columns={4}
        metrics={[
          {
            label: 'Latest Revenue',
            value: `$${(financialData.revenue.total[financialData.revenue.total.length - 1] / 1000).toFixed(0)}K`,
            trend: 'up',
          },
          {
            label: 'Gross Margin',
            value: `${((financialData.gp[financialData.gp.length - 1] / financialData.revenue.total[financialData.revenue.total.length - 1]) * 100).toFixed(1)}%`,
            trend: 'up',
          },
          {
            label: 'Service Lines',
            value: Object.keys(financialData.revenue).filter(
              (k) => k !== 'total'
            ).length,
            trend: 'neutral',
          },
          {
            label: 'Agent Consensus',
            value:
              agentAnalyses.length > 0
                ? `${agentAnalyses.filter((a) => ['BUY', 'FAVORABLE', 'CONDITIONAL'].includes(a.recommendation)).length}/4`
                : 'N/A',
            trend: 'neutral',
          },
        ]}
      />
    </div>
  );
};

export default EnhancedVisualizations;
