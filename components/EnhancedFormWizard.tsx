import React, { useState } from 'react';
import { StepWizard } from './ProgressiveDisclosure';
import { FinancialDatasetV1 } from '../lib/types';

interface FormData {
  basicInfo: {
    caseName: string;
    industry: string;
    analysisType: string;
  };
  financialData: {
    revenue: string;
    grossMargin: string;
    ebitda: string;
  };
  serviceLines: {
    lines: Array<{
      name: string;
      revenue: string;
      margin: string;
    }>;
  };
  assumptions: {
    growthRate: string;
    discountRate: string;
    terminalValue: string;
  };
}

interface EnhancedFormWizardProps {
  onComplete: (data: FormData) => void;
  onCancel: () => void;
}

export const EnhancedFormWizard: React.FC<EnhancedFormWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    basicInfo: {
      caseName: '',
      industry: 'Healthcare Services',
      analysisType: 'EPV',
    },
    financialData: {
      revenue: '',
      grossMargin: '',
      ebitda: '',
    },
    serviceLines: {
      lines: [{ name: '', revenue: '', margin: '' }],
    },
    assumptions: {
      growthRate: '3',
      discountRate: '12',
      terminalValue: '2.5',
    },
  });

  const updateFormData = (
    section: keyof FormData,
    data: Partial<FormData[keyof FormData]>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const addServiceLine = () => {
    setFormData((prev) => ({
      ...prev,
      serviceLines: {
        lines: [
          ...prev.serviceLines.lines,
          { name: '', revenue: '', margin: '' },
        ],
      },
    }));
  };

  const updateServiceLine = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceLines: {
        lines: prev.serviceLines.lines.map((line, i) =>
          i === index ? { ...line, [field]: value } : line
        ),
      },
    }));
  };

  const removeServiceLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      serviceLines: {
        lines: prev.serviceLines.lines.filter((_, i) => i !== index),
      },
    }));
  };

  const steps = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      subtitle: 'Tell us about your analysis case',
      content: (
        <div className="space-y-6">
          <div className="input-group">
            <label className="input-label">Case Name *</label>
            <input
              type="text"
              value={formData.basicInfo.caseName}
              onChange={(e) =>
                updateFormData('basicInfo', { caseName: e.target.value })
              }
              className="input-primary"
              placeholder="e.g., Multi-Service Medispa Analysis"
              required
            />
            <p className="input-help">
              Choose a descriptive name for your analysis case
            </p>
          </div>

          <div className="input-group">
            <label className="input-label">Industry Sector</label>
            <select
              value={formData.basicInfo.industry}
              onChange={(e) =>
                updateFormData('basicInfo', { industry: e.target.value })
              }
              className="input-primary"
            >
              <option value="Healthcare Services">Healthcare Services</option>
              <option value="Professional Services">
                Professional Services
              </option>
              <option value="Technology">Technology</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Analysis Type</label>
            <div className="grid grid-cols-3 gap-4">
              {['EPV', 'DCF', 'LBO'].map((type) => (
                <label
                  key={type}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    value={type}
                    checked={formData.basicInfo.analysisType === type}
                    onChange={(e) =>
                      updateFormData('basicInfo', {
                        analysisType: e.target.value,
                      })
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium">{type}</div>
                    <div className="text-xs text-gray-500">
                      {type === 'EPV'
                        ? 'Earnings Power Value'
                        : type === 'DCF'
                          ? 'Discounted Cash Flow'
                          : 'Leveraged Buyout'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'financial-data',
      title: 'Financial Overview',
      subtitle: 'Enter key financial metrics',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="input-group">
              <label className="input-label">
                Total Revenue (Latest Year) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="text"
                  value={formData.financialData.revenue}
                  onChange={(e) =>
                    updateFormData('financialData', { revenue: e.target.value })
                  }
                  className="input-primary pl-8"
                  placeholder="3,750,000"
                />
              </div>
              <p className="input-help">Enter the most recent annual revenue</p>
            </div>

            <div className="input-group">
              <label className="input-label">Gross Margin %</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.financialData.grossMargin}
                  onChange={(e) =>
                    updateFormData('financialData', {
                      grossMargin: e.target.value,
                    })
                  }
                  className="input-primary pr-8"
                  placeholder="70"
                  min="0"
                  max="100"
                />
                <span className="absolute right-3 top-3 text-gray-500">%</span>
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">EBITDA (Optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="text"
                value={formData.financialData.ebitda}
                onChange={(e) =>
                  updateFormData('financialData', { ebitda: e.target.value })
                }
                className="input-primary pl-8"
                placeholder="1,200,000"
              />
            </div>
            <p className="input-help">
              Leave blank to calculate from service line data
            </p>
          </div>

          {/* Financial Health Indicators */}
          <div className="card-metric">
            <div className="metric-label mb-3">Estimated Financial Health</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="metric-secondary text-financial-highlight">
                  {formData.financialData.revenue
                    ? `$${(parseInt(formData.financialData.revenue.replace(/,/g, '')) / 1000000).toFixed(1)}M`
                    : 'TBD'}
                </div>
                <div className="metric-label">Revenue</div>
              </div>
              <div>
                <div className="metric-secondary text-financial-positive">
                  {formData.financialData.grossMargin
                    ? `${formData.financialData.grossMargin}%`
                    : 'TBD'}
                </div>
                <div className="metric-label">Gross Margin</div>
              </div>
              <div>
                <div className="metric-secondary text-financial-neutral">
                  {formData.financialData.ebitda
                    ? `$${(parseInt(formData.financialData.ebitda.replace(/,/g, '')) / 1000).toFixed(0)}K`
                    : 'TBD'}
                </div>
                <div className="metric-label">EBITDA</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'service-lines',
      title: 'Service Lines',
      subtitle: 'Define your revenue streams',
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="metric-secondary">Revenue Streams</h4>
              <p className="metric-supporting">
                Add each distinct service or product line
              </p>
            </div>
            <button onClick={addServiceLine} className="btn-secondary">
              + Add Service Line
            </button>
          </div>

          <div className="space-y-4">
            {formData.serviceLines.lines.map((line, index) => (
              <div key={index} className="card-primary">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="metric-label">Service Line {index + 1}</h5>
                  {formData.serviceLines.lines.length > 1 && (
                    <button
                      onClick={() => removeServiceLine(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="input-group">
                    <label className="input-label">Service Name</label>
                    <input
                      type="text"
                      value={line.name}
                      onChange={(e) =>
                        updateServiceLine(index, 'name', e.target.value)
                      }
                      className="input-primary"
                      placeholder="e.g., Injectables"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Revenue</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">
                        $
                      </span>
                      <input
                        type="text"
                        value={line.revenue}
                        onChange={(e) =>
                          updateServiceLine(index, 'revenue', e.target.value)
                        }
                        className="input-primary pl-8"
                        placeholder="930,000"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Margin %</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={line.margin}
                        onChange={(e) =>
                          updateServiceLine(index, 'margin', e.target.value)
                        }
                        className="input-primary pr-8"
                        placeholder="70"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-3 text-gray-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Service Line Summary */}
          <div className="card-metric">
            <div className="metric-label mb-3">Service Line Summary</div>
            <div className="space-y-2">
              {formData.serviceLines.lines.map((line, index) =>
                line.name && line.revenue ? (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-700">{line.name}</span>
                    <div className="text-right">
                      <span className="metric-supporting">
                        $
                        {parseInt(
                          line.revenue.replace(/,/g, '') || '0'
                        ).toLocaleString()}
                      </span>
                      {line.margin && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({line.margin}%)
                        </span>
                      )}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'assumptions',
      title: 'Key Assumptions',
      subtitle: 'Set valuation parameters',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="input-group">
              <label className="input-label">Growth Rate (Annual)</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.assumptions.growthRate}
                  onChange={(e) =>
                    updateFormData('assumptions', {
                      growthRate: e.target.value,
                    })
                  }
                  className="input-primary pr-8"
                  step="0.1"
                  min="0"
                  max="50"
                />
                <span className="absolute right-3 top-3 text-gray-500">%</span>
              </div>
              <p className="input-help">Expected annual revenue growth rate</p>
            </div>

            <div className="input-group">
              <label className="input-label">Discount Rate (WACC)</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.assumptions.discountRate}
                  onChange={(e) =>
                    updateFormData('assumptions', {
                      discountRate: e.target.value,
                    })
                  }
                  className="input-primary pr-8"
                  step="0.1"
                  min="0"
                  max="30"
                />
                <span className="absolute right-3 top-3 text-gray-500">%</span>
              </div>
              <p className="input-help">Weighted average cost of capital</p>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Terminal Value Multiple</label>
            <div className="relative">
              <input
                type="number"
                value={formData.assumptions.terminalValue}
                onChange={(e) =>
                  updateFormData('assumptions', {
                    terminalValue: e.target.value,
                  })
                }
                className="input-primary pr-8"
                step="0.1"
                min="0"
                max="20"
              />
              <span className="absolute right-3 top-3 text-gray-500">x</span>
            </div>
            <p className="input-help">
              Exit multiple for terminal value calculation
            </p>
          </div>

          {/* Assumption Summary */}
          <div className="card-metric">
            <div className="metric-label mb-3">Valuation Parameters</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="metric-secondary text-financial-highlight">
                  {formData.assumptions.growthRate}%
                </div>
                <div className="metric-label">Growth Rate</div>
              </div>
              <div>
                <div className="metric-secondary text-financial-neutral">
                  {formData.assumptions.discountRate}%
                </div>
                <div className="metric-label">Discount Rate</div>
              </div>
              <div>
                <div className="metric-secondary text-financial-accent">
                  {formData.assumptions.terminalValue}x
                </div>
                <div className="metric-label">Terminal Multiple</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      />
    </div>
  );
};

export default EnhancedFormWizard;
