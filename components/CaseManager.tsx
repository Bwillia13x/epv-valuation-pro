import React, { useState, useEffect } from 'react';
import { FinancialDatasetV1, AgentAnalysis, CaseData } from '../lib/types';
import {
  HeroMetricCard,
  MetricGrid,
  ProgressiveDisclosure,
} from './ProgressiveDisclosure';
import { EmptyState, LoadingCard } from './LoadingAndErrorStates';

export const CaseManager: React.FC = () => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  useEffect(() => {
    // Load cases from localStorage
    const savedCases = localStorage.getItem('epv-cases');
    if (savedCases) {
      setCases(JSON.parse(savedCases));
    }
  }, []);

  const saveCase = (caseData: CaseData) => {
    const updatedCases = cases.map((c) =>
      c.id === caseData.id ? caseData : c
    );
    if (!cases.find((c) => c.id === caseData.id)) {
      updatedCases.push(caseData);
    }
    setCases(updatedCases);
    localStorage.setItem('epv-cases', JSON.stringify(updatedCases));
  };

  const deleteCase = (caseId: string) => {
    const updatedCases = cases.filter((c) => c.id !== caseId);
    setCases(updatedCases);
    localStorage.setItem('epv-cases', JSON.stringify(updatedCases));
  };

  const createNewCase = (name: string, financialData: FinancialDatasetV1) => {
    const newCase: CaseData = {
      id: `case-${Date.now()}`,
      name,
      lastModified: new Date(),
      financialData,
      analyses: [],
      status: 'draft',
      tags: [],
    };
    saveCase(newCase);
    setSelectedCase(newCase);
    setShowNewCaseModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container-wide">
        {/* Enhanced Header with Summary */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="hero-metric text-gray-900">Case Management</h1>
              <p className="metric-supporting mt-2">
                Manage your financial analysis cases and track agent
                recommendations
              </p>
            </div>
            <button
              onClick={() => setShowNewCaseModal(true)}
              className="btn-primary"
            >
              + New Case
            </button>
          </div>

          {/* Summary Metrics */}
          {cases.length > 0 && (
            <MetricGrid
              columns={4}
              metrics={[
                {
                  label: 'Total Cases',
                  value: cases.length,
                },
                {
                  label: 'Complete',
                  value: cases.filter((c) => c.status === 'complete').length,
                  trend: 'up',
                },
                {
                  label: 'In Progress',
                  value: cases.filter((c) => c.status === 'analyzing').length,
                  trend: 'neutral',
                },
                {
                  label: 'Draft',
                  value: cases.filter((c) => c.status === 'draft').length,
                  trend: 'neutral',
                },
              ]}
            />
          )}
        </div>

        {/* Cases Grid */}
        {cases.length === 0 ? (
          <EmptyState
            title="No Cases Yet"
            message="Start by creating your first financial analysis case. You can import existing data or create a new case from scratch."
            actionLabel="Create First Case"
            onAction={() => setShowNewCaseModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 fade-in">
            {cases.map((case_) => (
              <CaseCard
                key={case_.id}
                case={case_}
                onSelect={() => setSelectedCase(case_)}
                onDelete={() => deleteCase(case_.id)}
              />
            ))}
          </div>
        )}

        {/* Selected Case Details */}
        {selectedCase && (
          <CaseDetails
            case={selectedCase}
            onUpdate={saveCase}
            onClose={() => setSelectedCase(null)}
          />
        )}

        {/* New Case Modal */}
        {showNewCaseModal && (
          <NewCaseModal
            onCreate={createNewCase}
            onClose={() => setShowNewCaseModal(false)}
          />
        )}
      </div>
    </div>
  );
};

const CaseCard: React.FC<{
  case: CaseData;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ case: case_, onSelect, onDelete }) => {
  const getStatusClass = (status: CaseData['status']) => {
    switch (status) {
      case 'draft':
        return 'status-draft';
      case 'analyzing':
        return 'status-analyzing';
      case 'complete':
        return 'status-complete';
    }
  };

  const getConsensusRecommendation = (analyses: AgentAnalysis[]) => {
    if (analyses.length === 0) return 'Pending';
    const recommendations = analyses.map((a) => a.recommendation);
    const buyCount = recommendations.filter((r) => r === 'BUY').length;
    const holdCount = recommendations.filter((r) => r === 'HOLD').length;
    const sellCount = recommendations.filter((r) => r === 'SELL').length;

    if (buyCount >= 3) return 'CONSENSUS BUY';
    if (sellCount >= 3) return 'CONSENSUS SELL';
    if (holdCount >= 2) return 'CONSENSUS HOLD';
    return 'MIXED SIGNALS';
  };

  return (
    <div
      className="card-primary group cursor-pointer card-hover smooth-transition"
      onClick={onSelect}
    >
      {/* Header with Actions */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="metric-secondary text-gray-900 group-hover:text-blue-600 smooth-transition">
            {case_.name}
          </h3>
          <div className="flex items-center space-x-3 mt-2">
            <span className={getStatusClass(case_.status)}>
              {case_.status.toUpperCase()}
            </span>
            <span className="metric-supporting">
              {case_.lastModified.toLocaleDateString()}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-400 hover:text-red-500 smooth-transition p-1 button-click"
          aria-label="Delete case"
        >
          ×
        </button>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="metric-label">Revenue (Latest)</span>
          <span className="metric-primary text-financial-highlight">
            ${(case_.financialData.revenue.total?.[2] || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="metric-label">Analysis Progress</span>
          <div className="flex items-center space-x-2">
            <span className="metric-secondary">{case_.analyses.length}/4</span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(case_.analyses.length / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Consensus Indicator */}
      <div className="mb-6">
        <div className="metric-label mb-2">Agent Consensus</div>
        <div className="text-center py-3 bg-gray-50 rounded-lg">
          <span
            className={`metric-secondary ${
              getConsensusRecommendation(case_.analyses).includes('BUY')
                ? 'text-financial-positive'
                : getConsensusRecommendation(case_.analyses).includes('SELL')
                  ? 'text-financial-negative'
                  : 'text-financial-neutral'
            }`}
          >
            {getConsensusRecommendation(case_.analyses)}
          </span>
        </div>
      </div>

      {/* Tags */}
      {case_.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {case_.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Primary Action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className="btn-primary w-full group-hover:shadow-md button-click"
      >
        Open Analysis
      </button>
    </div>
  );
};

const CaseDetails: React.FC<{
  case: CaseData;
  onUpdate: (caseData: CaseData) => void;
  onClose: () => void;
}> = ({ case: case_, onUpdate, onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{case_.name}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Revenue (2024)</h3>
          <p className="text-2xl font-bold text-blue-600">
            ${(case_.financialData.revenue.total?.[2] || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Gross Profit</h3>
          <p className="text-2xl font-bold text-green-600">
            ${(case_.financialData.gp?.[2] || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Service Lines</h3>
          <p className="text-2xl font-bold text-purple-600">
            {
              Object.keys(case_.financialData.revenue).filter(
                (k) => k !== 'total'
              ).length
            }
          </p>
        </div>
      </div>

      {/* Agent Analyses */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Agent Analyses
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {case_.analyses.map((analysis, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">
                  {analysis.agentType.replace('-', ' ').toUpperCase()}
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    analysis.recommendation === 'BUY'
                      ? 'bg-green-100 text-green-800'
                      : analysis.recommendation === 'SELL'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {analysis.recommendation}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div>EV: ${analysis.enterpriseValue.toLocaleString()}</div>
                <div>Confidence: {analysis.confidence}</div>
                <div>
                  Completed: {analysis.completedAt.toLocaleDateString()}
                </div>
              </div>

              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-900 mb-1">
                  Key Risks:
                </h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {analysis.keyRisks.slice(0, 3).map((risk, i) => (
                    <li key={i}>• {risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const NewCaseModal: React.FC<{
  onCreate: (name: string, financialData: FinancialDatasetV1) => void;
  onClose: () => void;
}> = ({ onCreate, onClose }) => {
  const [caseName, setCaseName] = useState('');
  const [jsonData, setJsonData] = useState('');

  const handleCreate = () => {
    try {
      const financialData = JSON.parse(jsonData) as FinancialDatasetV1;
      onCreate(caseName, financialData);
    } catch (error) {
      alert('Invalid JSON data. Please check your input.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create New Case</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Name
            </label>
            <input
              type="text"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Enter case name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Financial Data (JSON)
            </label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
              rows={12}
              placeholder="Paste your financial data JSON here..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!caseName || !jsonData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Create Case
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseManager;
