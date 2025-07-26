// Generic valuation helpers reused across Summit builds
// Pure TS (no React / browser refs) so it can run on server or client.

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = clamp((sorted.length - 1) * p, 0, sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const h = idx - lo;
  return sorted[lo] * (1 - h) + sorted[hi] * h;
}

function normal(mean: number, sd: number) {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export interface MonteCarloEPVInput {
  adjustedEarnings: number;   // steady-state Owner Earnings or NOPAT
  wacc: number;               // base WACC (decimal)
  totalRevenue: number;       // used to scale capex % shocks
  ebitMargin: number;         // current margin (for shock sd)
  capexMode: "percent" | "amount";
  maintenanceCapexPct: number;
  maintCapex: number;         // absolute capex if mode === amount
  da: number;                 // depreciation & amortisation
  cash: number;               // non-operating cash
  debt: number;               // interest-bearing debt
  taxRate: number;            // decimal
  runs?: number;              // default 500
}

export function runMonteCarloEPV(input: MonteCarloEPVInput & { runs?: number }) {
  const R = clamp(input.runs ?? 500, 100, 5000);
  const evDist: number[] = [];
  const eqDist: number[] = [];

  for (let i = 0; i < R; i++) {
    // Stochastic WACC ±1% sd
    const wacc = clamp(normal(input.wacc, 0.01), 0.03, 0.5);

    // Revenue & margin shocks (±5% revenue, ±2% margin)
    const rev = Math.max(0, normal(input.totalRevenue, input.totalRevenue * 0.05));
    const margin = clamp(normal(input.ebitMargin, 0.02), 0, 0.6);

    const ebit = rev * margin;
    const nopat = ebit * (1 - input.taxRate);

    // Maintenance capex shock (±1% of revenue if % mode)
    const maint = input.capexMode === "percent"
      ? clamp(normal(input.maintenanceCapexPct, 0.01), 0, 0.2) * rev
      : input.maintCapex;

    const adj = nopat + input.da - maint; // Owner-earnings style
    const ev = wacc > 0 ? adj / wacc : 0;
    const equity = ev + input.cash - input.debt;

    evDist.push(ev);
    eqDist.push(equity);
  }

  evDist.sort((a, b) => a - b);
  eqDist.sort((a, b) => a - b);

  return {
    mean: evDist.reduce((a, b) => a + b, 0) / evDist.length,
    median: percentile(evDist, 0.5),
    p5: percentile(evDist, 0.05),
    p95: percentile(evDist, 0.95),
    meanEquity: eqDist.reduce((a, b) => a + b, 0) / eqDist.length,
    p5Equity: percentile(eqDist, 0.05),
    p95Equity: percentile(eqDist, 0.95),
  };
} 