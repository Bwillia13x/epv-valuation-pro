import React, { useState, useEffect } from 'react';
import { FinancialDatasetV1, AgentAnalysis, CaseData } from '../lib/types';


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
    const updatedCases = cases.map(c => c.id === caseData.id ? caseData : c);
    if (!cases.find(c => c.id === caseData.id)) {
      updatedCases.push(caseData);
    }
    setCases(updatedCases);
    localStorage.setItem('epv-cases', JSON.stringify(updatedCases));
  };

  const deleteCase = (caseId: string) => {
    const updatedCases = cases.filter(c => c.id !== caseId);
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
      tags: []
    };
    saveCase(newCase);
    setSelectedCase(newCase);
    setShowNewCaseModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
            <p className="text-gray-600 mt-2">Manage your financial analysis cases and track agent recommendations</p>
          </div>
          <button
            onClick={() => setShowNewCaseModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Case
          </button>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {cases.map(case_ => (
            <CaseCard
              key={case_.id}
              case={case_}
              onSelect={() => setSelectedCase(case_)}
              onDelete={() => deleteCase(case_.id)}
            />
          ))}
        </div>

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
  const getStatusColor = (status: CaseData['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'analyzing': return 'bg-yellow-100 text-yellow-800';
      case 'complete': return 'bg-green-100 text-green-800';
    }
  };

  const getConsensusRecommendation = (analyses: AgentAnalysis[]) => {
    if (analyses.length === 0) return 'Pending';
    const recommendations = analyses.map(a => a.recommendation);
    const buyCount = recommendations.filter(r => r === 'BUY').length;
    const holdCount = recommendations.filter(r => r === 'HOLD').length;
    const sellCount = recommendations.filter(r => r === 'SELL').length;
    
    if (buyCount >= 3) return 'CONSENSUS BUY';
    if (sellCount >= 3) return 'CONSENSUS SELL';
    if (holdCount >= 2) return 'CONSENSUS HOLD';
    return 'MIXED SIGNALS';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{case_.name}</h3>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-red-500 hover:text-red-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
            {case_.status.toUpperCase()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Revenue:</span>
          <span className="text-sm font-medium">
            ${(case_.financialData.revenue.total?.[2] || 0).toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Agent Analyses:</span>
          <span className="text-sm font-medium">{case_.analyses.length}/4</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Recommendation:</span>
          <span className="text-sm font-medium">{getConsensusRecommendation(case_.analyses)}</span>
        </div>
      </div>
      
      <div className="flex space-x-2 mb-4">
        {case_.tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="text-xs text-gray-500">
        Last modified: {case_.lastModified.toLocaleDateString()}
      </div>
      
      <button
        onClick={onSelect}
        className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
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
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
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
            {Object.keys(case_.financialData.revenue).filter(k => k !== 'total').length}
          </p>
        </div>
      </div>
      
      {/* Agent Analyses */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Analyses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {case_.analyses.map((analysis, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">
                  {analysis.agentType.replace('-', ' ').toUpperCase()}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  analysis.recommendation === 'BUY' ? 'bg-green-100 text-green-800' :
                  analysis.recommendation === 'SELL' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {analysis.recommendation}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div>EV: ${analysis.enterpriseValue.toLocaleString()}</div>
                <div>Confidence: {analysis.confidence}</div>
                <div>Completed: {analysis.completedAt.toLocaleDateString()}</div>
              </div>
              
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-900 mb-1">Key Risks:</h5>
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
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