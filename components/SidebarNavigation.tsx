import React, { useState } from 'react';

// Navigation structure interfaces
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  children?: NavigationItem[];
  isActive?: boolean;
  isComplete?: boolean;
  hasProgress?: boolean;
  progressPercent?: number;
}

export interface SidebarNavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme?: 'light' | 'dark';
  className?: string;
}

// Navigation structure as defined in requirements
const navigationStructure: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    hasProgress: false,
  },
  {
    id: 'data-input',
    label: 'Data Input',
    icon: '📝',
    hasProgress: true,
    children: [
      { id: 'company-profile', label: 'Company Profile', icon: '🏢' },
      { id: 'financial-data', label: 'Financial Data', icon: '💹' },
      { id: 'market-data', label: 'Market Data', icon: '📈' },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: '🔬',
    hasProgress: true,
    children: [
      { id: 'valuation-models', label: 'Valuation Models', icon: '🧮' },
      { id: 'scenario-analysis', label: 'Scenario Analysis', icon: '🎯' },
      { id: 'sensitivity-testing', label: 'Sensitivity Testing', icon: '⚖️' },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    icon: '📈',
    hasProgress: true,
    children: [
      { id: 'summary-report', label: 'Summary Report', icon: '📋' },
      { id: 'detailed-analysis', label: 'Detailed Analysis', icon: '🔍' },
      { id: 'comparisons', label: 'Comparisons', icon: '⚖️' },
    ],
  },
  {
    id: 'validation',
    label: 'Validation',
    icon: '✅',
    hasProgress: true,
    children: [
      { id: 'cross-checks', label: 'Cross-checks', icon: '🔗' },
      { id: 'benchmarks', label: 'Benchmarks', icon: '📊' },
      { id: 'quality-metrics', label: 'Quality Metrics', icon: '⭐' },
    ],
  },
];

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeSection,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  theme = 'light',
  className = '',
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['data-input']) // Start with data-input expanded
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.id === activeSection) return true;
    return item.children?.some(child => child.id === activeSection) || false;
  };

  const getProgressPercent = (item: NavigationItem): number => {
    // Mock progress calculation - in real implementation, this would come from props
    if (item.id === 'data-input') return 75;
    if (item.id === 'analysis') return 45;
    if (item.id === 'results') return 20;
    if (item.id === 'validation') return 0;
    return 0;
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isExpanded = expandedSections.has(item.id);
    const isActive = isItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const progressPercent = getProgressPercent(item);

    const baseClasses = `
      group relative flex items-center w-full text-left transition-all duration-200
      ${level === 0 ? 'px-3 py-2.5' : 'px-6 py-2'}
      ${theme === 'dark' 
        ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }
    `;

    const activeClasses = isActive
      ? theme === 'dark'
        ? 'bg-slate-700 text-white border-r-2 border-blue-400'
        : 'bg-blue-50 text-blue-700 border-r-2 border-blue-500 font-medium'
      : '';

    return (
      <div key={item.id} className="relative">
        <button
          className={`${baseClasses} ${activeClasses} ${
            level > 0 ? 'border-l border-slate-200 ml-3' : ''
          }`}
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id);
            } else {
              onNavigate(item.id);
            }
          }}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          {/* Icon */}
          <span className={`flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3'} text-lg`}>
            {item.icon}
          </span>

          {/* Label and expand indicator */}
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm">{item.label}</span>
              
              {/* Progress indicator */}
              {item.hasProgress && progressPercent > 0 && (
                <div className="flex items-center ml-2">
                  <div className="w-6 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="ml-1 text-xs text-slate-500">{progressPercent}%</span>
                </div>
              )}

              {/* Expand/collapse indicator */}
              {hasChildren && (
                <span
                  className={`ml-2 transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : 'rotate-0'
                  }`}
                >
                  ▶
                </span>
              )}
            </>
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarClasses = `
    ${className}
    flex flex-col h-full transition-all duration-300 ease-in-out
    ${isCollapsed ? 'w-16' : 'w-64'}
    ${theme === 'dark' 
      ? 'bg-slate-800 border-slate-700' 
      : 'bg-white border-slate-200'
    }
    border-r shadow-sm
  `;

  return (
    <aside className={sidebarClasses}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
      }`}>
        {!isCollapsed && (
          <h2 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            EPV Valuation Pro
          </h2>
        )}
        
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-700'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1">
          {navigationStructure.map(item => renderNavigationItem(item))}
        </div>
      </nav>

      {/* Footer - Workflow Status */}
      {!isCollapsed && (
        <div className={`p-4 border-t ${
          theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <div className={`text-xs ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Workflow Progress
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                Overall Completion
              </span>
              <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                35%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '35%' }} />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default SidebarNavigation;