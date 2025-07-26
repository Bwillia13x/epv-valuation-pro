import React from "react";
import { CalculationStep, CalculationAuditTrail, formulaLibrary } from "../lib/calculationTransparency";

// Utility functions
const fmt0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const cx = (...args: (string | false | null | undefined)[]) => args.filter(Boolean).join(" ");

interface TransparencyProps {
  theme: "dark" | "light";
}

// Component for displaying individual calculation steps
export const CalculationStepDisplay = ({ step, theme }: { step: CalculationStep; theme: "dark" | "light" }) => (
  <div className={cx("border rounded-lg p-4 mb-3", theme === "dark" ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white")}>
    <div className="flex items-start justify-between mb-2">
      <h4 className="font-medium text-sm">{step.description}</h4>
      <span className={cx("text-xs px-2 py-1 rounded", theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600")}>
        {step.category}
      </span>
    </div>
    
    <div className={cx("text-xs font-mono p-2 rounded mb-2", theme === "dark" ? "bg-slate-900 text-green-400" : "bg-slate-50 text-slate-800")}>
      <strong>Formula:</strong> {step.formula}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
      <div>
        <strong>Inputs:</strong>
        <div className={cx("mt-1 p-2 rounded font-mono", theme === "dark" ? "bg-slate-900" : "bg-slate-50")}>
          {Object.entries(step.inputs).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span>{key}:</span>
              <span>{typeof value === 'number' ? 
                (key.includes('%') || key.includes('Rate') || key.includes('Premium') ? 
                  `${value.toFixed(2)}%` : 
                  value.toLocaleString()) : 
                value}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <strong>Calculation:</strong>
        <div className={cx("mt-1 p-2 rounded font-mono text-xs", theme === "dark" ? "bg-slate-900" : "bg-slate-50")}>
          {step.calculation}
        </div>
        <div className="mt-2 text-right">
          <strong>Result: </strong>
          <span className="font-mono text-lg text-emerald-400">
            {step.unit === 'percentage' ? 
              `${(step.result * 100).toFixed(2)}%` : 
              step.unit === 'USD' ? 
                fmt0.format(step.result) : 
                step.result.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Component for displaying complete audit trails
export const AuditTrailDisplay = ({ trail, theme }: { trail: CalculationAuditTrail; theme: "dark" | "light" }) => (
  <div className={cx("border rounded-xl p-4 mb-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{trail.category}</h3>
      <div className="text-right text-sm">
        <div className="font-mono text-xl text-emerald-400">{fmt0.format(trail.finalResult)}</div>
        <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>{trail.resultDescription}</div>
      </div>
    </div>
    
    <div className="space-y-3">
      {trail.steps.map((step, idx) => (
        <CalculationStepDisplay key={step.id} step={step} theme={theme} />
      ))}
    </div>
  </div>
);

// Formula reference display component
export const FormulaReferenceDisplay = ({ theme }: { theme: "dark" | "light" }) => (
  <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
    <h3 className="text-lg font-semibold mb-4">📚 Formula Reference Library</h3>
    
    {Object.entries(formulaLibrary).map(([key, section]) => (
      <div key={key} className="mb-6">
        <h4 className="text-md font-semibold mb-3 text-emerald-400">{section.title}</h4>
        <div className="space-y-4">
          {section.formulas.map((formula, idx) => (
            <div key={idx} className={cx("border rounded-lg p-4", theme === "dark" ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50")}>
              <h5 className="font-medium mb-2">{formula.name}</h5>
              <div className={cx("text-sm font-mono p-2 rounded mb-2", theme === "dark" ? "bg-slate-900 text-green-400" : "bg-white text-slate-800")}>
                {formula.formula}
              </div>
              <p className="text-sm text-slate-600 mb-2">{formula.description}</p>
              {Object.keys(formula.variables).length > 0 && (
                <div className="text-xs">
                  <strong>Variables:</strong>
                  <div className={cx("mt-1 p-2 rounded", theme === "dark" ? "bg-slate-900" : "bg-white")}>
                    {Object.entries(formula.variables).map(([variable, description]) => (
                      <div key={variable} className="mb-1">
                        <span className="font-mono text-emerald-400">{variable}</span>: {description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Cross-checks and verification display
export const VerificationDisplay = ({ checks, theme }: { checks: any[]; theme: "dark" | "light" }) => (
  <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
    <h3 className="text-lg font-semibold mb-4">🔍 Calculation Verification & Cross-Checks</h3>
    
    <div className="space-y-4">
      {checks.map((check, idx) => (
        <div key={idx} className={cx(
          "border rounded-lg p-4",
          check.passed 
            ? (theme === "dark" ? "border-green-600 bg-green-900/20" : "border-green-300 bg-green-50")
            : (theme === "dark" ? "border-red-600 bg-red-900/20" : "border-red-300 bg-red-50")
        )}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{check.name}</h4>
            <span className={cx(
              "px-2 py-1 rounded text-xs font-semibold",
              check.passed ? "bg-green-500 text-white" : "bg-red-500 text-white"
            )}>
              {check.passed ? "✓ PASS" : "✗ FAIL"}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Calculated:</strong>
              <div className="font-mono">
                {typeof check.calculated === 'number' ? 
                  (check.calculated < 1 ? 
                    `${(check.calculated * 100).toFixed(2)}%` : 
                    check.calculated.toLocaleString()) : 
                  check.calculated}
              </div>
            </div>
            <div>
              <strong>Expected:</strong>
              <div className="font-mono">
                {typeof check.expected === 'number' ? 
                  check.expected.toLocaleString() : 
                  check.expected}
              </div>
            </div>
          </div>
          
          {check.description && (
            <div className="mt-2 text-xs text-slate-600">
              {check.description}
            </div>
          )}
          
          {check.difference !== undefined && (
            <div className="mt-2 text-xs">
              <strong>Difference:</strong> {check.difference.toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Summary dashboard component
export const TransparencySummaryDashboard = ({ 
  trails, 
  theme 
}: { 
  trails: CalculationAuditTrail[]; 
  theme: "dark" | "light" 
}) => (
  <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
    <h3 className="text-lg font-semibold mb-4">📊 Calculation Summary Dashboard</h3>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {trails.map((trail, idx) => (
        <div key={idx} className={cx("text-center p-4 rounded border", theme === "dark" ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50")}>
          <div className="text-2xl font-bold text-emerald-400">{fmt0.format(trail.finalResult)}</div>
          <div className="text-sm font-medium">{trail.category}</div>
          <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>{trail.steps.length} steps</div>
        </div>
      ))}
    </div>
  </div>
);

// Export controls component
export const ExportControls = ({ 
  trails, 
  theme,
  onExport 
}: { 
  trails: CalculationAuditTrail[]; 
  theme: "dark" | "light";
  onExport: (data: any, filename: string, type: string) => void;
}) => {
  
  const exportCalculations = (format: 'csv' | 'json') => {
    const exportData = {
      timestamp: new Date().toISOString(),
      calculation_trails: trails,
      summary: {
        total_trails: trails.length,
        total_steps: trails.reduce((sum, trail) => sum + trail.steps.length, 0),
        categories: trails.map(trail => trail.category)
      }
    };
    
    onExport(exportData, 'epv_calculation_audit_trail', format);
  };

  return (
    <div className={cx("border rounded-xl p-6", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
      <h3 className="text-lg font-semibold mb-4">📤 Export Calculation Documentation</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => exportCalculations('json')}
          className={cx(
            "px-4 py-2 rounded font-medium transition-colors",
            theme === "dark" 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          )}
        >
          Export Full Audit Trail (JSON)
        </button>
        
        <button
          onClick={() => exportCalculations('csv')}
          className={cx(
            "px-4 py-2 rounded font-medium transition-colors",
            theme === "dark" 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          Export Summary (CSV)
        </button>
        
        <button
          onClick={() => window.print()}
          className={cx(
            "px-4 py-2 rounded font-medium transition-colors",
            theme === "dark" 
              ? "bg-purple-600 hover:bg-purple-700 text-white" 
              : "bg-purple-600 hover:bg-purple-700 text-white"
          )}
        >
          Print Documentation
        </button>
      </div>
    </div>
  );
}; 