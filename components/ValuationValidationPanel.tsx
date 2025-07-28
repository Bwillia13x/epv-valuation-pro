import React from 'react';
import { CrossValidationResults, ValidationResult } from '../lib/valuationValidation';

interface ValidationPanelProps {
  validation: CrossValidationResults;
  className?: string;
}

const ValidationItem: React.FC<{ 
  title: string; 
  result: ValidationResult; 
  icon: string;
}> = ({ title, result, icon }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50 border-red-200';
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getSeverityColor(result.severity)}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <span className="text-lg">{getSeverityIcon(result.severity)}</span>
      </div>
      
      <p className="text-sm mb-2">{result.message}</p>
      
      {result.suggestedAction && (
        <div className="text-xs text-gray-600 bg-white/70 p-2 rounded border border-gray-200">
          <strong>Action:</strong> {result.suggestedAction}
        </div>
      )}
      
      {result.values && (
        <div className="text-xs mt-2 grid grid-cols-3 gap-2">
          <div>
            <span className="text-gray-500">Calculated:</span>
            <div className="font-mono">
              {typeof result.values.calculated === 'number' 
                ? result.values.calculated.toLocaleString()
                : result.values.calculated}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Expected:</span>
            <div className="font-mono">
              {typeof result.values.expected === 'number' 
                ? result.values.expected.toLocaleString()
                : result.values.expected}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Variance:</span>
            <div className="font-mono">
              {(result.values.variance * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ValuationValidationPanel: React.FC<ValidationPanelProps> = ({ 
  validation, 
  className = "" 
}) => {
  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'FAIL': return 'text-red-600 bg-red-100 border-red-300';
      case 'WARNING': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'PASS': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getOverallStatusIcon = (status: string) => {
    switch (status) {
      case 'FAIL': return '❌';
      case 'WARNING': return '⚠️';
      case 'PASS': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Status */}
      <div className={`p-4 rounded-lg border-2 ${getOverallStatusColor(validation.overall.status)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getOverallStatusIcon(validation.overall.status)}</span>
            <div>
              <h3 className="text-lg font-bold">Validation Status: {validation.overall.status}</h3>
              <p className="text-sm opacity-80">
                Quality Score: {validation.overall.score}/100
                {validation.overall.criticalIssues > 0 && (
                  <span className="ml-2 font-semibold">
                    ({validation.overall.criticalIssues} critical issue{validation.overall.criticalIssues !== 1 ? 's' : ''})
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{validation.overall.score}</div>
            <div className="text-xs opacity-60">Quality Score</div>
          </div>
        </div>
        
        {validation.overall.status !== 'PASS' && (
          <div className="mt-3 p-3 bg-white/50 rounded border border-current/20">
            <p className="text-sm font-medium">
              {validation.overall.status === 'FAIL' 
                ? '🔍 Critical issues detected - review calculations before proceeding'
                : '⚡ Some inconsistencies found - consider reviewing highlighted areas'
              }
            </p>
          </div>
        )}
      </div>

      {/* Individual Validation Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ValidationItem 
          title="EPV Method Consistency"
          result={validation.epvConsistency}
          icon="🧮"
        />
        
        <ValidationItem 
          title="Market Multiple Alignment"
          result={validation.multipleAlignment}
          icon="📊"
        />
        
        <ValidationItem 
          title="Margin Sustainability"
          result={validation.marginChecks}
          icon="💰"
        />
        
        <ValidationItem 
          title="Scaling Assumptions"
          result={validation.scalingConsistency}
          icon="📈"
        />
        
        <ValidationItem 
          title="Small Practice Safeguards"
          result={validation.smallPracticeChecks}
          icon="🏥"
        />
        
        <ValidationItem 
          title="Input Parameter Validation"
          result={validation.inputValidation}
          icon="📋"
        />
        
        <div className="lg:col-span-2">
          <ValidationItem 
            title="Method Comparison"
            result={validation.methodComparison}
            icon="🔄"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-sm text-gray-700 mb-2">💡 Quick Actions</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• Review EBITDA normalization if EPV methods show high variance</div>
          <div>• Check maintenance CapEx vs D&A assumptions for consistency</div>
          <div>• Verify industry multiples align with practice size and location</div>
          <div>• Ensure margins are sustainable and defensible</div>
          <div>• Cross-check synergy assumptions against comparable transactions</div>
          <div>• Apply small practice discounts for revenue &lt;$1M (key person, marketability risks)</div>
          <div>• Consider asset-based valuation for micro practices &lt;$250K revenue</div>
        </div>
      </div>
    </div>
  );
};

export default ValuationValidationPanel;