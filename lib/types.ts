// Core financial data types for the EPV platform

export interface FinancialDatasetV1 {
  periods: { [year: string]: string }; // {"2022": "2022-12-31", ...}
  revenue: { [serviceLine: string]: number[] }; // service lines + total
  cogs: { [component: string]: number[] }; // components + total
  gp: number[]; // gross profit [2022, 2023, 2024]
  payroll: { [component: string]: number[] }; // benefits, payroll, taxes, total
  opex: { [component: string]: number[] }; // all operating expenses + total
  below_line: { [component: string]: number[] }; // operating income, other income, etc.
  meta: {
    source_files?: { [key: string]: string };
    case_name: string;
    period_end_dates: { [year: string]: string };
    units: string;
    key_notes: string[];
  };
}

export interface AgentAnalysis {
  agentType: 'financial-analyst' | 'financial-analyst-b' | 'quant-finance-modeler' | 'value-investing-pe-analyst';
  recommendation: 'BUY' | 'HOLD' | 'SELL' | 'CONDITIONAL' | 'FAVORABLE' | 'CAUTION' | 'UNFAVORABLE';
  enterpriseValue: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  keyRisks: string[];
  strengths: string[];
  completedAt: Date;
  methodology: string;
  notes?: string;
  detailedAnalysis?: {
    normalizedEBITDA?: number;
    ebitdaMargin?: number;
    evMultiple?: number;
    keyAssumptions?: string[];
    sensitivityAnalysis?: {
      variable: string;
      impact: number;
    }[];
  };
}

export interface ServiceLine {
  id: string;
  name: string;
  price: number; // per unit (annual for memberships)
  volume: number; // annual units per location
  cogsPct: number; // as decimal 0..1
  kind: "service" | "retail";
  visitUnits: number; // appointment slots consumed per unit (retail = 0)
  isMembership?: boolean; // for CAC-based intangible
}

export interface ProviderType {
  id: string;
  name: string;
  fte: number; // per location
  hoursPerWeek: number;
  apptsPerHour: number;
  utilization: number; // 0..1
}

export type EPVMethod = "Owner Earnings" | "NOPAT (EBIT-based)";

export type RecommendedMethod =
  | "EPV Only"
  | "Asset Reproduction"
  | "Conservative: Min"
  | "Opportunistic: Max"
  | "Blend: 70% EPV / 30% Asset";

export interface EPVInputs {
  // Service lines
  serviceLines: ServiceLine[];
  
  // Provider capacity
  providers: ProviderType[];
  locations: number;
  
  // Cost structure
  clinicalLaborPct: number; // % of revenue
  marketingPct: number;
  adminPct: number;
  rentPerLocation: number; // annual
  
  // Financial parameters
  wacc: number;
  taxRate: number;
  growthRate: number;
  terminalMultiple: number;
  
  // Normalization adjustments
  ownerAddBack: number;
  depreciation: number;
  maintenanceCapex: number;
  
  // Balance sheet
  cash: number;
  debt: number;
  workingCapital: number;
}

export interface EPVOutputs {
  // Core valuation
  enterpriseValue: number;
  equityValue: number;
  
  // Financial metrics
  revenue: number;
  normalizedEBITDA: number;
  ebitdaMargin: number;
  
  // Multiples
  evRevenue: number;
  evEBITDA: number;
  
  // Sensitivity data
  sensitivityMatrix: number[][];
  scenarios: {
    base: number;
    bull: number;
    bear: number;
  };
  
  // Monte Carlo results
  monteCarloResults?: {
    mean: number;
    median: number;
    p10: number;
    p90: number;
    probPositive: number;
  };
}

export interface CaseData {
  id: string;
  name: string;
  lastModified: Date;
  financialData: FinancialDatasetV1;
  analyses: AgentAnalysis[];
  status: 'draft' | 'analyzing' | 'complete';
  tags: string[];
  epvInputs?: EPVInputs;
  epvOutputs?: EPVOutputs;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tieOuts: {
    serviceLineSum: boolean;
    grossProfitCalc: boolean;
    opexTotalCalc: boolean;
  };
}

// Utility types for component props
export interface DashboardProps {
  cases: CaseData[];
  selectedCase?: CaseData;
  onCaseSelect: (caseData: CaseData) => void;
  onCaseUpdate: (caseData: CaseData) => void;
}

export interface AnalysisComponentProps {
  financialData: FinancialDatasetV1;
  onAnalysisComplete: (analysis: AgentAnalysis) => void;
}

// Monte Carlo simulation types
export interface MonteCarloConfig {
  iterations: number;
  variables: {
    [key: string]: {
      distribution: 'normal' | 'uniform' | 'triangular';
      params: number[]; // [mean, std] for normal, [min, max] for uniform, [min, mode, max] for triangular
    };
  };
}

export interface SimulationResult {
  variable: string;
  values: number[];
  statistics: {
    mean: number;
    median: number;
    std: number;
    p10: number;
    p25: number;
    p75: number;
    p90: number;
  };
}

// Helper functions type definitions
export type GetSeriesFunction = (metric: string, component: string) => number[];
export type GetValueFunction = (metric: string, component: string, year: string) => number;
export type ListComponentsFunction = (metric: string) => string[];