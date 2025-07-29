import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DisclosureProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'card' | 'section';
}

export const ProgressiveDisclosure: React.FC<DisclosureProps> = ({
  title,
  subtitle,
  children,
  defaultOpen = false,
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const baseClasses =
    variant === 'card'
      ? 'card-primary'
      : variant === 'section'
        ? 'border-b border-gray-200 pb-6 mb-6'
        : '';

  return (
    <div className={baseClasses}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="disclosure-trigger w-full smooth-transition button-click"
        aria-expanded={isOpen}
      >
        <div className="flex-1 text-left">
          <h3 className="metric-secondary">{title}</h3>
          {subtitle && <p className="metric-supporting mt-1">{subtitle}</p>}
        </div>
        <div className="ml-4 smooth-transition">
          {isOpen ? (
            <ChevronDownIcon className="w-5 h-5 text-gray-500 smooth-transition" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-500 smooth-transition" />
          )}
        </div>
      </button>

      {isOpen && <div className="disclosure-panel slide-up">{children}</div>}
    </div>
  );
};

interface StepWizardProps {
  steps: {
    id: string;
    title: string;
    subtitle?: string;
    content: ReactNode;
  }[];
  currentStep: number;
  onStepChange: (step: number) => void;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  steps,
  currentStep,
  onStepChange,
}) => {
  return (
    <div className="container-narrow">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => onStepChange(index)}
                className={`step-indicator ${
                  index < currentStep
                    ? 'step-complete'
                    : index === currentStep
                      ? 'step-current'
                      : 'step-pending'
                }`}
              >
                {index + 1}
              </button>
              {index < steps.length - 1 && (
                <div className="w-full h-0.5 bg-gray-200 mx-4">
                  <div
                    className="h-0.5 bg-blue-600 transition-all duration-300"
                    style={{ width: index < currentStep ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="metric-primary">{steps[currentStep]?.title}</h2>
          {steps[currentStep]?.subtitle && (
            <p className="metric-supporting mt-2">
              {steps[currentStep].subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className="card-hero fade-in">
        {steps[currentStep]?.content}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => onStepChange(currentStep - 1)}
            disabled={currentStep === 0}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed button-click"
          >
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => onStepChange(currentStep + 1)}
              className="btn-primary button-click"
            >
              Next: {steps[currentStep + 1]?.title}
            </button>
          ) : (
            <button className="btn-success button-click">
              Complete Analysis
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface HeroMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const HeroMetricCard: React.FC<HeroMetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  action,
}) => {
  const trendColor =
    trend === 'up'
      ? 'text-financial-positive'
      : trend === 'down'
        ? 'text-financial-negative'
        : 'text-financial-neutral';

  return (
    <div className="card-hero text-center">
      <div className="metric-label mb-2">{title}</div>
      <div className="hero-number text-financial-highlight mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && <div className="metric-supporting mb-4">{subtitle}</div>}

      {trend && trendValue && (
        <div
          className={`flex items-center justify-center space-x-2 mb-4 ${trendColor}`}
        >
          <span className="text-sm font-medium">
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
          </span>
        </div>
      )}

      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
};

interface MetricGridProps {
  metrics: {
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  columns?: number;
}

export const MetricGrid: React.FC<MetricGridProps> = ({
  metrics,
  columns = 3,
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
      {metrics.map((metric, index) => (
        <div key={index} className="card-metric text-center">
          <div className="metric-label mb-2">{metric.label}</div>
          <div className="metric-primary mb-1">
            {typeof metric.value === 'number'
              ? metric.value.toLocaleString()
              : metric.value}
          </div>
          {metric.change && (
            <div
              className={`metric-supporting ${
                metric.trend === 'up'
                  ? 'text-financial-positive'
                  : metric.trend === 'down'
                    ? 'text-financial-negative'
                    : 'text-financial-neutral'
              }`}
            >
              {metric.change}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgressiveDisclosure;
