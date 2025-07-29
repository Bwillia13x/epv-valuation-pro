import React, { useMemo } from 'react';
import {
  HeroMetricCard,
  MetricGrid,
  ProgressiveDisclosure,
} from './ProgressiveDisclosure';

interface AgentAnalysis {
  agentType:
    | 'financial-analyst'
    | 'financial-analyst-b'
    | 'quant-finance-modeler'
    | 'value-investing-pe-analyst';
  recommendation:
    | 'BUY'
    | 'HOLD'
    | 'SELL'
    | 'CONDITIONAL'
    | 'FAVORABLE'
    | 'CAUTION'
    | 'UNFAVORABLE';
  enterpriseValue: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  keyRisks: string[];
  strengths: string[];
  completedAt: Date;
  methodology: string;
  notes?: string;
}

interface AgentConsensusDashboardProps {
  analyses: AgentAnalysis[];
  caseName: string;
}

export const AgentConsensusDashboard: React.FC<
  AgentConsensusDashboardProps
> = ({ analyses, caseName }) => {
  const consensusData = useMemo(() => {
    if (analyses.length === 0) return null;

    // Normalize recommendations to standard format
    const normalizeRecommendation = (rec: string): 'BUY' | 'HOLD' | 'SELL' => {
      if (['BUY', 'FAVORABLE', 'CONDITIONAL'].includes(rec)) return 'BUY';
      if (['SELL', 'UNFAVORABLE'].includes(rec)) return 'SELL';
      return 'HOLD';
    };

    const normalizedRecs = analyses.map((a) =>
      normalizeRecommendation(a.recommendation)
    );
    const buyCount = normalizedRecs.filter((r) => r === 'BUY').length;
    const holdCount = normalizedRecs.filter((r) => r === 'HOLD').length;
    const sellCount = normalizedRecs.filter((r) => r === 'SELL').length;

    let consensus: string;
    let consensusStrength: 'STRONG' | 'WEAK' | 'MIXED';

    if (buyCount >= 3) {
      consensus = 'BUY';
      consensusStrength = buyCount === 4 ? 'STRONG' : 'WEAK';
    } else if (sellCount >= 3) {
      consensus = 'SELL';
      consensusStrength = sellCount === 4 ? 'STRONG' : 'WEAK';
    } else if (holdCount >= 2) {
      consensus = 'HOLD';
      consensusStrength = 'WEAK';
    } else {
      consensus = 'MIXED';
      consensusStrength = 'MIXED';
    }

    // Valuation statistics
    const valuations = analyses.map((a) => a.enterpriseValue);
    const avgValuation =
      valuations.reduce((a, b) => a + b, 0) / valuations.length;
    const minValuation = Math.min(...valuations);
    const maxValuation = Math.max(...valuations);
    const valuationSpread =
      ((maxValuation - minValuation) / avgValuation) * 100;

    // Confidence analysis
    const highConfidence = analyses.filter(
      (a) => a.confidence === 'HIGH'
    ).length;
    const mediumConfidence = analyses.filter(
      (a) => a.confidence === 'MEDIUM'
    ).length;
    const lowConfidence = analyses.filter((a) => a.confidence === 'LOW').length;

    return {
      consensus,
      consensusStrength,
      buyCount,
      holdCount,
      sellCount,
      avgValuation,
      minValuation,
      maxValuation,
      valuationSpread,
      highConfidence,
      mediumConfidence,
      lowConfidence,
    };
  }, [analyses]);

  const getAllRisks = () => {
    const riskCounts: { [key: string]: number } = {};
    analyses.forEach((analysis) => {
      analysis.keyRisks.forEach((risk) => {
        riskCounts[risk] = (riskCounts[risk] || 0) + 1;
      });
    });
    return Object.entries(riskCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  };

  const getAllStrengths = () => {
    const strengthCounts: { [key: string]: number } = {};
    analyses.forEach((analysis) => {
      analysis.strengths.forEach((strength) => {
        strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
      });
    });
    return Object.entries(strengthCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  };

  if (!consensusData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container-wide">
          <div className="card-hero text-center">
            <h2 className="hero-metric text-gray-900 mb-4">
              Agent Consensus Dashboard
            </h2>
            <p className="metric-supporting mb-8">
              No analyses available yet. Run the 4-agent analysis to see
              consensus results.
            </p>
            <button className="btn-primary">Start Analysis</button>
          </div>
        </div>
      </div>
    );
  }

  const getConsensusColor = (consensus: string, strength: string) => {
    if (consensus === 'BUY') {
      return strength === 'STRONG' ? 'bg-green-600' : 'bg-green-400';
    } else if (consensus === 'SELL') {
      return strength === 'STRONG' ? 'bg-red-600' : 'bg-red-400';
    } else if (consensus === 'HOLD') {
      return 'bg-yellow-500';
    } else {
      return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container-wide">
        {/* Enhanced Header */}
        <div className="mb-8">
          <h1 className="hero-metric text-gray-900">
            Agent Consensus Dashboard
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <p className="metric-secondary text-gray-700">Case: {caseName}</p>
            <span className="metric-supporting">
              Analysis from {analyses.length} financial experts
            </span>
          </div>
        </div>

        {/* Hero Consensus Decision */}
        <div className="mb-12">
          <HeroMetricCard
            title="Investment Consensus"
            value={`${consensusData.consensusStrength} ${consensusData.consensus}`}
            subtitle={`${consensusData.buyCount} Buy • ${consensusData.holdCount} Hold • ${consensusData.sellCount} Sell`}
            trend={
              consensusData.consensus === 'BUY'
                ? 'up'
                : consensusData.consensus === 'SELL'
                  ? 'down'
                  : 'neutral'
            }
            trendValue={`${Math.round((Math.max(consensusData.buyCount, consensusData.holdCount, consensusData.sellCount) / analyses.length) * 100)}% agreement`}
            action={{
              label: 'View Detailed Analysis',
              onClick: () => console.log('Navigate to detailed analysis'),
            }}
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="mb-8">
          <MetricGrid
            columns={3}
            metrics={[
              {
                label: 'Average Enterprise Value',
                value: `$${(consensusData.avgValuation / 1000000).toFixed(1)}M`,
                change: `Range: $${(consensusData.minValuation / 1000000).toFixed(1)}M - $${(consensusData.maxValuation / 1000000).toFixed(1)}M`,
                trend: 'neutral',
              },
              {
                label: 'Valuation Spread',
                value: `${consensusData.valuationSpread.toFixed(1)}%`,
                change:
                  consensusData.valuationSpread < 30
                    ? 'Low disagreement'
                    : consensusData.valuationSpread < 60
                      ? 'Moderate disagreement'
                      : 'High disagreement',
                trend:
                  consensusData.valuationSpread < 30
                    ? 'up'
                    : consensusData.valuationSpread > 60
                      ? 'down'
                      : 'neutral',
              },
              {
                label: 'High Confidence Analyses',
                value: `${consensusData.highConfidence}/4`,
                change: `${Math.round((consensusData.highConfidence / 4) * 100)}% confidence rate`,
                trend:
                  consensusData.highConfidence >= 3
                    ? 'up'
                    : consensusData.highConfidence <= 1
                      ? 'down'
                      : 'neutral',
              },
            ]}
          />
        </div>

        {/* Individual Agent Results with Progressive Disclosure */}
        <ProgressiveDisclosure
          title="Individual Agent Results"
          subtitle="Detailed analysis from each financial expert"
          variant="card"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analyses.map((analysis, index) => (
              <div key={index} className="card-primary">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="metric-secondary text-gray-900">
                      {analysis.agentType
                        .replace(/-/g, ' ')
                        .toUpperCase()
                        .replace('B', '-B')}
                    </h3>
                    <p className="metric-supporting">
                      {analysis.completedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ['BUY', 'FAVORABLE', 'CONDITIONAL'].includes(
                          analysis.recommendation
                        )
                          ? 'bg-financial-positive'
                          : ['SELL', 'UNFAVORABLE'].includes(
                                analysis.recommendation
                              )
                            ? 'bg-financial-negative'
                            : 'bg-financial-neutral'
                      }`}
                    >
                      {analysis.recommendation}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        analysis.confidence === 'HIGH'
                          ? 'bg-green-100 text-green-800'
                          : analysis.confidence === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {analysis.confidence} CONFIDENCE
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="metric-label">Enterprise Value</span>
                    <span className="metric-primary text-financial-highlight">
                      ${(analysis.enterpriseValue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="metric-label">Methodology</span>
                    <span className="metric-supporting">
                      {analysis.methodology}
                    </span>
                  </div>
                </div>

                {analysis.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="metric-label mb-1">Key Notes</div>
                    <p className="text-xs text-gray-700">{analysis.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ProgressiveDisclosure>

        {/* Risk and Strength Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Consensus Risk Factors
            </h2>
            <div className="space-y-3">
              {getAllRisks().map(([risk, count], index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {risk}
                      </span>
                      <span className="text-xs text-gray-500">
                        {count}/4 agents
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(count / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Consensus Strengths
            </h2>
            <div className="space-y-3">
              {getAllStrengths().map(([strength, count], index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {strength}
                      </span>
                      <span className="text-xs text-gray-500">
                        {count}/4 agents
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(count / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investment Decision Framework */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Investment Decision Framework
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {consensusData.buyCount}
              </div>
              <div className="text-sm text-gray-600">
                Favorable Recommendations
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Strong fundamentals, proceed with investment
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {consensusData.holdCount}
              </div>
              <div className="text-sm text-gray-600">
                Cautious Recommendations
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Mixed signals, additional due diligence required
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {consensusData.sellCount}
              </div>
              <div className="text-sm text-gray-600">
                Unfavorable Recommendations
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Significant concerns, avoid or reconsider
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentConsensusDashboard;
