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
      margin: (financialData.gp[index] / financialData.revenue.total[index]) * 100,
    }));
  }, [financialData]);

  // Prepare service line breakdown data (latest year)
  const serviceLineData = React.useMemo(() => {
    const latestIndex = financialData.revenue.total.length - 1;
    return Object.entries(financialData.revenue)
      .filter(([key]) => key !== 'total')
      .map(([name, values]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: values[latestIndex] / 1000,
        percentage: ((values[latestIndex] / financialData.revenue.total[latestIndex]) * 100).toFixed(1),
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
    const otherOpex = (financialData.opex.total[latestIndex] - marketing - rent) / 1000;
    const operatingIncome = financialData.below_line.operating_income[latestIndex] / 1000;

    return [
      { name: 'Revenue', value: revenue, cumulative: revenue },
      { name: 'COGS', value: -(revenue - grossProfit), cumulative: grossProfit },
      { name: 'Payroll', value: -payroll, cumulative: grossProfit - payroll },
      { name: 'Marketing', value: -marketing, cumulative: grossProfit - payroll - marketing },
      { name: 'Rent', value: -rent, cumulative: grossProfit - payroll - marketing - rent },
      { name: 'Other OpEx', value: -otherOpex, cumulative: operatingIncome },
    ];
  }, [financialData]);

  // Prepare agent consensus data
  const agentConsensusData = React.useMemo(() => {
    if (agentAnalyses.length === 0) return [];
    
    return agentAnalyses.map(analysis => ({
      agent: analysis.agentType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      enterpriseValue: analysis.enterpriseValue / 1000000, // Convert to millions
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
    }));
  }, [agentAnalyses]);

  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];
  const RAMP_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Revenue and Profitability Trends */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Profitability Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === 'margin') return [`${value.toFixed(1)}%`, 'Gross Margin'];
                return [`$${value.toFixed(0)}K`, name === 'revenue' ? 'Revenue' : 'Gross Profit'];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
            <Bar yAxisId="left" dataKey="grossProfit" fill="#10b981" name="Gross Profit" />
            <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#ef4444" strokeWidth={3} name="Gross Margin %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Service Line Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service Line (Latest Year)</h3>
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`$${value.toFixed(0)}K`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Line Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceLineData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value: any) => [`$${value.toFixed(0)}K`, 'Revenue']} />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EBITDA Bridge Waterfall */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">EBITDA Bridge (Waterfall Analysis)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ebitdaBridgeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: any, name: string) => [
                `$${Math.abs(value).toFixed(0)}K`, 
                value >= 0 ? 'Positive Impact' : 'Negative Impact'
              ]}
            />
            <Bar 
              dataKey="value" 
              fill="#8b5cf6"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Consensus Visualization */}
      {agentAnalyses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Valuation Spread</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentConsensusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="agent" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${value.toFixed(1)}M`, 'Enterprise Value']} />
                <Bar 
                  dataKey="enterpriseValue" 
                  fill="#8b5cf6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Confidence vs Valuation</h3>
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
                    if (name === 'enterpriseValue') return [`$${value.toFixed(1)}M`, 'Enterprise Value'];
                    return [value, 'Confidence Level'];
                  }}
                />
                <Scatter 
                  dataKey="enterpriseValue" 
                  fill="#8884d8"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Key Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Latest Revenue</div>
          <div className="text-2xl font-bold text-blue-600">
            ${(financialData.revenue.total[financialData.revenue.total.length - 1] / 1000).toFixed(0)}K
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Gross Margin</div>
          <div className="text-2xl font-bold text-green-600">
            {((financialData.gp[financialData.gp.length - 1] / financialData.revenue.total[financialData.revenue.total.length - 1]) * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Service Lines</div>
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(financialData.revenue).filter(k => k !== 'total').length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Agent Consensus</div>
          <div className="text-2xl font-bold text-orange-600">
            {agentAnalyses.length > 0 
              ? `${agentAnalyses.filter(a => ['BUY', 'FAVORABLE', 'CONDITIONAL'].includes(a.recommendation)).length}/4`
              : 'N/A'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVisualizations;