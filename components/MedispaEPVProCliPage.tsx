import React, { useEffect, useMemo, useRef, useState } from "react";

// Medispa EPV Valuation Pro (Greenwald) — CLI/ClaudeCode Aesthetic
// Next.js page with TypeScript + TailwindCSS (no extra deps)
// Advanced modeling retained; enhanced terminal-style UX with command console and hotkeys.

// ========================= Types =========================
interface ServiceLine {
  id: string;
  name: string;
  price: number; // per unit (annual for memberships)
  volume: number; // annual units per location
  cogsPct: number; // as decimal 0..1
  kind: "service" | "retail";
  visitUnits: number; // appointment slots consumed per unit (retail = 0)
  isMembership?: boolean; // for CAC-based intangible
}

interface ProviderType {
  id: string;
  name: string;
  fte: number; // per location
  hoursPerWeek: number;
  apptsPerHour: number;
  utilization: number; // 0..1
}

type EPVMethod = "Owner Earnings" | "NOPAT (EBIT-based)";

type RecommendedMethod =
  | "EPV Only"
  | "Asset Reproduction"
  | "Conservative: Min"
  | "Opportunistic: Max"
  | "Blend: 70% EPV / 30% Asset";

interface CliMsg {
  ts: number;
  kind: "system" | "user" | "success" | "error" | "info";
  text: string;
}

// ========================= Helpers =========================
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const fmt0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmt2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const pctFmt = (v: number) => `${(v * 100).toFixed(1)}%`;

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = clamp(Math.floor((sorted.length - 1) * p), 0, sorted.length - 1);
  return sorted[idx];
}

function normalRand(mean: number, sd: number) {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const n = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + sd * n;
}

function cx(...arr: (string | false | null | undefined)[]) {
  return arr.filter(Boolean).join(" ");
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function parseTokens(line: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (!inQuotes && /\s/.test(ch)) {
      if (cur) tokens.push(cur), (cur = "");
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function parsePercentOrNumber(v: string): number | null {
  const s = v.trim();
  if (s.endsWith("%")) {
    const n = parseFloat(s.slice(0, -1));
    return isNaN(n) ? null : n / 100;
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseDollars(v: string): number | null {
  const s = v.replace(/[$,]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export default function MedispaEPVProCliPage() {
  // ========================= State =========================
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState("main");
  const [scenario, setScenario] = useState<"Base" | "Bull" | "Bear">("Base");

  // Service lines
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([
    { id: "botox", name: "Botox", price: 700, volume: 200, cogsPct: 0.28, kind: "service", visitUnits: 1 },
    { id: "filler", name: "Dermal Fillers", price: 900, volume: 120, cogsPct: 0.32, kind: "service", visitUnits: 1 },
    { id: "laser", name: "Laser Treatments", price: 1200, volume: 80, cogsPct: 0.25, kind: "service", visitUnits: 2 },
    { id: "membership", name: "Membership", price: 299, volume: 150, cogsPct: 0.10, kind: "service", visitUnits: 0, isMembership: true },
    { id: "skincare", name: "Skincare Products", price: 180, volume: 300, cogsPct: 0.55, kind: "retail", visitUnits: 0 },
  ]);

  // Providers
  const [providers, setProviders] = useState<ProviderType[]>([
    { id: "np", name: "Nurse Practitioner", fte: 1.0, hoursPerWeek: 40, apptsPerHour: 1.5, utilization: 0.85 },
    { id: "rn", name: "RN Injector", fte: 0.8, hoursPerWeek: 32, apptsPerHour: 1.2, utilization: 0.80 },
  ]);

  // Capacity inputs
  const [numRooms, setNumRooms] = useState(3);
  const [hoursPerDay, setHoursPerDay] = useState(10);
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [roomUtilization, setRoomUtilization] = useState(0.75);
  const [enableCapacity, setEnableCapacity] = useState(false);

  // Business parameters
  const [locations, setLocations] = useState(1);
  const [clinicalLaborPct, setClinicalLaborPct] = useState(0.15);
  const [laborMarketAdj, setLaborMarketAdj] = useState(1.0);
  const [adminPct, setAdminPct] = useState(0.12);
  const [marketingPct, setMarketingPct] = useState(0.08);
  const [msoFeePct, setMsoFeePct] = useState(0.06);
  const [complianceOverheadPct, setComplianceOverheadPct] = useState(0.02);
  const [otherOpexPct, setOtherOpexPct] = useState(0.03);

  // Fixed costs per location
  const [rentAnnual, setRentAnnual] = useState(120000);
  const [medDirectorAnnual, setMedDirectorAnnual] = useState(60000);
  const [insuranceAnnual, setInsuranceAnnual] = useState(24000);
  const [softwareAnnual, setSoftwareAnnual] = useState(18000);
  const [utilitiesAnnual, setUtilitiesAnnual] = useState(12000);

  // Synergies
  const [sgnaSynergyPct, setSgnaSynergyPct] = useState(0.15);
  const [marketingSynergyPct, setMarketingSynergyPct] = useState(0.10);
  const [minAdminPctFactor, setMinAdminPctFactor] = useState(0.1);

  // Add-backs
  const [ownerAddBack, setOwnerAddBack] = useState(120000);
  const [otherAddBack, setOtherAddBack] = useState(15000);

  // D&A and Capex
  const [daAnnual, setDaAnnual] = useState(25000);
  const [capexMode, setCapexMode] = useState<"model" | "percent" | "amount">("model");
  const [maintenanceCapexPct, setMaintenanceCapexPct] = useState(0.03);
  const [maintenanceCapexAmount, setMaintenanceCapexAmount] = useState(35000);

  // Capex model inputs
  const [equipmentDevices, setEquipmentDevices] = useState(180000);
  const [equipReplacementYears, setEquipReplacementYears] = useState(8);
  const [buildoutImprovements, setBuildoutImprovements] = useState(120000);
  const [buildoutRefreshYears, setBuildoutRefreshYears] = useState(10);
  const [ffne, setFfne] = useState(40000);
  const [ffneRefreshYears, setFfneRefreshYears] = useState(5);
  const [minorMaintPct, setMinorMaintPct] = useState(0.005);

  // WACC and valuation
  const [epvMethod, setEpvMethod] = useState<EPVMethod>("Owner Earnings");
  const [rfRate, setRfRate] = useState(0.045);
  const [erp, setErp] = useState(0.065);
  const [beta, setBeta] = useState(1.2);
  const [sizePrem, setSizePrem] = useState(0.03);
  const [specificPrem, setSpecificPrem] = useState(0.015);
  const [taxRate, setTaxRate] = useState(0.26);

  // Advanced CAPM
  const [capmMode, setCapmMode] = useState<"simple" | "advanced">("simple");
  const [betaUnlevered, setBetaUnlevered] = useState(0.9);
  const [targetDE, setTargetDE] = useState<number | null>(null);
  const [targetDebtWeight, setTargetDebtWeight] = useState(0.25);
  const [costDebt, setCostDebt] = useState(0.065);

  // Risk overlays
  const [riskEarningsHaircut, setRiskEarningsHaircut] = useState(0.0);
  const [riskWaccPremium, setRiskWaccPremium] = useState(0.0);

  // Asset reproduction
  const [equipmentAssets, setEquipmentAssets] = useState(180000);
  const [buildoutAssets, setBuildoutAssets] = useState(150000);
  const [ffneAssets, setFfneAssets] = useState(40000);
  const [dsoDays, setDsoDays] = useState(45);
  const [dsiDays, setDsiDays] = useState(30);
  const [dpoDays, setDpoDays] = useState(30);

  // Intangibles
  const [trainingCostPerProvider, setTrainingCostPerProvider] = useState(15000);
  const [brandRebuildCost, setBrandRebuildCost] = useState(80000);
  const [membershipCac, setMembershipCac] = useState(150);

  // Cash and debt
  const [cashNonOperating, setCashNonOperating] = useState(50000);
  const [debtInterestBearing, setDebtInterestBearing] = useState(0);

  // LBO inputs
  const [lboEnabled, setLboEnabled] = useState(false);
  const [entryEv, setEntryEv] = useState(0);
  const [debtRatio, setDebtRatio] = useState(0.65);
  const [exitMultipleMode, setExitMultipleMode] = useState<"EPV" | "Multiple">("EPV");
  const [exitMultiple, setExitMultiple] = useState(5.0);
  const [transactionYears, setTransactionYears] = useState(5);
  const [transCostsPct, setTransCostsPct] = useState(0.02);
  const [exitCostsPct, setExitCostsPct] = useState(0.01);

  // Monte Carlo
  const [mcRuns, setMcRuns] = useState(1000);
  const [mcResults, setMcResults] = useState<number[]>([]);

  // CLI
  const [cliInput, setCliInput] = useState("");
  const [cliMessages, setCliMessages] = useState<CliMsg[]>([]);
  const cliRef = useRef<HTMLInputElement>(null);
  const [cliVisible, setCliVisible] = useState(false);

  // Scenarios
  const [savedScenarios, setSavedScenarios] = useState<Array<{ id: string; name: string; data: any }>>([]);
  const [scenarioName, setScenarioName] = useState("");

  // JSON import/export
  const [jsonText, setJsonText] = useState("");

  // ========================= Init and defaults =========================
  useEffect(() => {
    const saved = localStorage.getItem("epv-pro-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Restore state from localStorage if needed
      } catch {}
    }

    const savedScenarios = localStorage.getItem("epv-pro-scenarios");
    if (savedScenarios) {
      try {
        setSavedScenarios(JSON.parse(savedScenarios));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const state = collectSnapshot();
    localStorage.setItem("epv-pro-state", JSON.stringify(state));
  }, [serviceLines, providers, locations, scenario]); // Add key dependencies

  const pushLog = (msg: Omit<CliMsg, "ts">) => {
    setCliMessages(prev => [...prev.slice(-49), { ...msg, ts: Date.now() }]);
  };

  function collectSnapshot() {
    return {
      serviceLines, providers, locations, scenario, clinicalLaborPct, laborMarketAdj,
      adminPct, marketingPct, msoFeePct, complianceOverheadPct, otherOpexPct,
      rentAnnual, medDirectorAnnual, insuranceAnnual, softwareAnnual, utilitiesAnnual,
      sgnaSynergyPct, marketingSynergyPct, minAdminPctFactor, ownerAddBack, otherAddBack,
      daAnnual, capexMode, maintenanceCapexPct, maintenanceCapexAmount,
      equipmentDevices, equipReplacementYears, buildoutImprovements, buildoutRefreshYears,
      ffne, ffneRefreshYears, minorMaintPct, epvMethod, rfRate, erp, beta, sizePrem,
      specificPrem, taxRate, capmMode, betaUnlevered, targetDE, targetDebtWeight, costDebt,
      riskEarningsHaircut, riskWaccPremium, equipmentAssets, buildoutAssets, ffneAssets,
      dsoDays, dsiDays, dpoDays, trainingCostPerProvider, brandRebuildCost, membershipCac,
      cashNonOperating, debtInterestBearing, enableCapacity, numRooms, hoursPerDay,
      daysPerWeek, roomUtilization
    };
  }

  function applySnapshot(data: any) {
    const setters: Record<string, (value: any) => void> = {
      serviceLines: setServiceLines,
      providers: setProviders,
      locations: setLocations,
      scenario: setScenario,
      clinicalLaborPct: setClinicalLaborPct,
      laborMarketAdj: setLaborMarketAdj,
      adminPct: setAdminPct,
      marketingPct: setMarketingPct,
      msoFeePct: setMsoFeePct,
      complianceOverheadPct: setComplianceOverheadPct,
      otherOpexPct: setOtherOpexPct,
      rentAnnual: setRentAnnual,
      medDirectorAnnual: setMedDirectorAnnual,
      insuranceAnnual: setInsuranceAnnual,
      softwareAnnual: setSoftwareAnnual,
      utilitiesAnnual: setUtilitiesAnnual,
      sgnaSynergyPct: setSgnaSynergyPct,
      marketingSynergyPct: setMarketingSynergyPct,
      minAdminPctFactor: setMinAdminPctFactor,
      ownerAddBack: setOwnerAddBack,
      otherAddBack: setOtherAddBack,
      daAnnual: setDaAnnual,
      capexMode: setCapexMode,
      maintenanceCapexPct: setMaintenanceCapexPct,
      maintenanceCapexAmount: setMaintenanceCapexAmount,
      equipmentDevices: setEquipmentDevices,
      equipReplacementYears: setEquipReplacementYears,
      buildoutImprovements: setBuildoutImprovements,
      buildoutRefreshYears: setBuildoutRefreshYears,
      ffne: setFfne,
      ffneRefreshYears: setFfneRefreshYears,
      minorMaintPct: setMinorMaintPct,
      epvMethod: setEpvMethod,
      rfRate: setRfRate,
      erp: setErp,
      beta: setBeta,
      sizePrem: setSizePrem,
      specificPrem: setSpecificPrem,
      taxRate: setTaxRate,
      capmMode: setCapmMode,
      betaUnlevered: setBetaUnlevered,
      targetDE: setTargetDE,
      targetDebtWeight: setTargetDebtWeight,
      costDebt: setCostDebt,
      riskEarningsHaircut: setRiskEarningsHaircut,
      riskWaccPremium: setRiskWaccPremium,
      equipmentAssets: setEquipmentAssets,
      buildoutAssets: setBuildoutAssets,
      ffneAssets: setFfneAssets,
      dsoDays: setDsoDays,
      dsiDays: setDsiDays,
      dpoDays: setDpoDays,
      trainingCostPerProvider: setTrainingCostPerProvider,
      brandRebuildCost: setBrandRebuildCost,
      membershipCac: setMembershipCac,
      cashNonOperating: setCashNonOperating,
      debtInterestBearing: setDebtInterestBearing,
      enableCapacity: setEnableCapacity,
      numRooms: setNumRooms,
      hoursPerDay: setHoursPerDay,
      daysPerWeek: setDaysPerWeek,
      roomUtilization: setRoomUtilization,
    };

    Object.keys(data).forEach(key => {
      const setter = setters[key];
      if (setter && data[key] !== undefined) {
        setter(data[key]);
      }
    });
  }

  function resetDefaults() {
    setScenario("Base");
    setLocations(1);
    setEpvMethod("Owner Earnings");
    setCapexMode("model");
    setExitMultipleMode("EPV");
    setTransCostsPct(0.02);
    setExitCostsPct(0.01);
  }

  // ------------- Scenario adjustments -------------
  const scenarioAdj = useMemo(() => {
    if (scenario === "Bull") return { revenue: 1.08, ebitAdj: 1.06, waccAdj: -0.01 };
    if (scenario === "Bear") return { revenue: 0.92, ebitAdj: 0.95, waccAdj: 0.01 };
    return { revenue: 1.0, ebitAdj: 1.0, waccAdj: 0.0 };
  }, [scenario]);

  // ------------- Capacity model -------------
  const providerSlotsPerLoc = useMemo(() => {
    return providers.reduce((sum, p) => sum + p.fte * p.hoursPerWeek * p.utilization * p.apptsPerHour, 0) * 52;
  }, [providers]);

  const roomSlotsPerLoc = useMemo(() => {
    return numRooms * hoursPerDay * daysPerWeek * 52 * roomUtilization;
  }, [numRooms, hoursPerDay, daysPerWeek, roomUtilization]);

  const capSlotsPerLoc = useMemo(() => {
    if (providerSlotsPerLoc <= 0 || roomSlotsPerLoc <= 0) return 0;
    return Math.min(providerSlotsPerLoc, roomSlotsPerLoc);
  }, [providerSlotsPerLoc, roomSlotsPerLoc]);

  const visitsDemandPerLoc = useMemo(() =>
    serviceLines.reduce((s, l) => s + (l.visitUnits ?? 0) * l.volume, 0),
    [serviceLines]
  );

  const capUtilization = useMemo(() => (capSlotsPerLoc > 0 ? Math.min(1, visitsDemandPerLoc / capSlotsPerLoc) : 0), [capSlotsPerLoc, visitsDemandPerLoc]);

  const scaleForCapacity = useMemo(() => {
    if (!enableCapacity) return 1;
    if (visitsDemandPerLoc <= 0 || capSlotsPerLoc <= 0) return 1;
    return Math.min(1, capSlotsPerLoc / visitsDemandPerLoc);
  }, [enableCapacity, visitsDemandPerLoc, capSlotsPerLoc]);

  const effectiveVolumesPerLoc = useMemo(() => {
    return serviceLines.map((l) => ({
      id: l.id,
      vol: (l.visitUnits ?? 0) > 0 ? l.volume * scaleForCapacity : l.volume,
    }));
  }, [serviceLines, scaleForCapacity]);

  // ------------- Revenue & costs -------------
  const effectiveVolumesOverall = useMemo(() => {
    return new Map(effectiveVolumesPerLoc.map((x) => [x.id, x.vol * locations]));
  }, [effectiveVolumesPerLoc, locations]);

  const revenueByLine = useMemo(() => serviceLines.map(l => l.price * (effectiveVolumesOverall.get(l.id) ?? (l.volume * locations))), [serviceLines, effectiveVolumesOverall, locations]);
  const totalRevenueBase = useMemo(() => revenueByLine.reduce((a, b) => a + b, 0), [revenueByLine]);
  const retailRevenue = useMemo(() => serviceLines.filter(l => l.kind === "retail").reduce((a, l) => a + l.price * (effectiveVolumesOverall.get(l.id) ?? 0), 0), [serviceLines, effectiveVolumesOverall]);
  const serviceRevenue = useMemo(() => totalRevenueBase - retailRevenue, [totalRevenueBase, retailRevenue]);

  const totalCOGS = useMemo(() => serviceLines.reduce((sum, l) => sum + l.price * (effectiveVolumesOverall.get(l.id) ?? 0) * l.cogsPct, 0), [serviceLines, effectiveVolumesOverall]);
  const clinicalLaborPctEff = useMemo(() => clamp(clinicalLaborPct * laborMarketAdj, 0, 0.8), [clinicalLaborPct, laborMarketAdj]);
  const clinicalLaborCost = useMemo(() => clinicalLaborPctEff * serviceRevenue, [clinicalLaborPctEff, serviceRevenue]);

  const grossProfit = useMemo(() => totalRevenueBase - totalCOGS - clinicalLaborCost, [totalRevenueBase, totalCOGS, clinicalLaborCost]);

  const adminPctEff = useMemo(() => {
    const reduction = Math.max(0, (locations - 1) * sgnaSynergyPct);
    // Allow more flexible minimum admin percentage, especially for large chains
    const minFactor = clamp(minAdminPctFactor, 0.1, 1);
    return Math.max(adminPct * minFactor, adminPct * (1 - Math.min(0.7, reduction)));
  }, [adminPct, locations, sgnaSynergyPct, minAdminPctFactor]);

  const marketingPctEff = useMemo(() => {
    const red = Math.max(0, (locations - 1) * marketingSynergyPct);
    return Math.max(0.02, marketingPct * (1 - Math.min(0.5, red)));
  }, [marketingPct, locations, marketingSynergyPct]);

  const marketingCost = useMemo(() => marketingPctEff * totalRevenueBase, [marketingPctEff, totalRevenueBase]);
  const adminCost = useMemo(() => adminPctEff * totalRevenueBase, [adminPctEff, totalRevenueBase]);
  const msoFee = useMemo(() => msoFeePct * totalRevenueBase, [msoFeePct, totalRevenueBase]);
  const complianceCost = useMemo(() => complianceOverheadPct * totalRevenueBase, [complianceOverheadPct, totalRevenueBase]);

  const fixedOpex = useMemo(() => (rentAnnual + medDirectorAnnual + insuranceAnnual + softwareAnnual + utilitiesAnnual) * locations, [rentAnnual, medDirectorAnnual, insuranceAnnual, softwareAnnual, utilitiesAnnual, locations]);
  const otherOpexCost = useMemo(() => otherOpexPct * totalRevenueBase, [otherOpexPct, totalRevenueBase]);

  const opexTotal = useMemo(() => marketingCost + adminCost + msoFee + complianceCost + fixedOpex + otherOpexCost, [marketingCost, adminCost, msoFee, complianceCost, fixedOpex, otherOpexCost]);

  const ebitdaReported = useMemo(() => grossProfit - opexTotal, [grossProfit, opexTotal]);
  const ebitdaNormalized = useMemo(() => ebitdaReported + (ownerAddBack + otherAddBack) * locations, [ebitdaReported, ownerAddBack, otherAddBack, locations]);
  const daTotal = useMemo(() => daAnnual * locations, [daAnnual, locations]);
  const ebitNormalized = useMemo(() => ebitdaNormalized - daTotal, [ebitdaNormalized, daTotal]);
  const ebitMargin = useMemo(() => (totalRevenueBase > 0 ? ebitNormalized / totalRevenueBase : 0), [ebitNormalized, totalRevenueBase]);

  // Maintenance Capex (model)
  const maintCapexModelBase = useMemo(() => {
    // Use average annual capex but add validation for replacement years
    const devices = equipmentDevices * locations / Math.max(1, equipReplacementYears || 1);
    const buildout = buildoutImprovements * locations / Math.max(1, buildoutRefreshYears || 1);
    const f = ffne * locations / Math.max(1, ffneRefreshYears || 1);
    // Minor maintenance should be separate from equipment replacement to avoid double-counting
    const minor = minorMaintPct * totalRevenueBase;
    return devices + buildout + f + minor;
  }, [equipmentDevices, locations, equipReplacementYears, buildoutImprovements, buildoutRefreshYears, ffne, ffneRefreshYears, minorMaintPct, totalRevenueBase]);

  const maintCapexBase = useMemo(() => {
    if (capexMode === "percent") return maintenanceCapexPct * totalRevenueBase;
    if (capexMode === "amount") return maintenanceCapexAmount * locations;
    return maintCapexModelBase;
  }, [capexMode, maintenanceCapexPct, totalRevenueBase, maintenanceCapexAmount, locations, maintCapexModelBase]);

  // Taxes & earnings
  const nopat = useMemo(() => ebitNormalized * (1 - taxRate), [ebitNormalized, taxRate]);
  const ownerEarnings = useMemo(() => nopat + daTotal - maintCapexBase, [nopat, daTotal, maintCapexBase]);
  const adjustedEarnings = useMemo(() => (epvMethod === "Owner Earnings" ? ownerEarnings : nopat), [epvMethod, ownerEarnings, nopat]);

  // WACC
  const targetDEFromWeight = useMemo(() => {
    if (targetDebtWeight >= 1) return 99; // Very high leverage case
    if (targetDebtWeight <= 0) return 0; // All equity case  
    return targetDebtWeight / (1 - targetDebtWeight);
  }, [targetDebtWeight]);
  const leveredBetaFromAdvanced = useMemo(() => betaUnlevered * (1 + (1 - taxRate) * (targetDE || targetDEFromWeight)), [betaUnlevered, taxRate, targetDE, targetDEFromWeight]);
  const betaEff = useMemo(() => (capmMode === "advanced" ? leveredBetaFromAdvanced : beta), [capmMode, leveredBetaFromAdvanced, beta]);
  const costEquity = useMemo(() => rfRate + betaEff * erp + sizePrem + specificPrem, [rfRate, betaEff, erp, sizePrem, specificPrem]);
  const afterTaxCostDebt = useMemo(() => costDebt * (1 - taxRate), [costDebt, taxRate]);
  const baseWacc = useMemo(() => clamp(targetDebtWeight * afterTaxCostDebt + (1 - targetDebtWeight) * costEquity, 0.02, 0.50), [targetDebtWeight, afterTaxCostDebt, costEquity]);

  // Scenario & risk adjusted values
  const scenarioWacc = useMemo(() => clamp(baseWacc + scenarioAdj.waccAdj + riskWaccPremium, 0.03, 0.5), [baseWacc, scenarioAdj, riskWaccPremium]);
  const totalRevenue = useMemo(() => totalRevenueBase * scenarioAdj.revenue, [totalRevenueBase, scenarioAdj]);
  const ebitScenario = useMemo(() => ebitNormalized * scenarioAdj.ebitAdj * scenarioAdj.revenue, [ebitNormalized, scenarioAdj]);
  const nopatScenario = useMemo(() => ebitScenario * (1 - taxRate), [ebitScenario, taxRate]);
  const maintCapexScenario = useMemo(() => {
    if (capexMode === "percent") return maintenanceCapexPct * totalRevenue;
    if (capexMode === "amount") return maintenanceCapexAmount * locations;
    const devices = equipmentDevices * locations / Math.max(1, equipReplacementYears);
    const buildout = buildoutImprovements * locations / Math.max(1, buildoutRefreshYears);
    const f = ffne * locations / Math.max(1, ffneRefreshYears);
    const minor = minorMaintPct * totalRevenue;
    return devices + buildout + f + minor;
  }, [capexMode, maintenanceCapexPct, totalRevenue, maintenanceCapexAmount, locations, equipmentDevices, equipReplacementYears, buildoutImprovements, buildoutRefreshYears, ffne, ffneRefreshYears, minorMaintPct]);

  const ownerEarningsScenario = useMemo(() => (nopatScenario + daTotal - maintCapexScenario) * (1 - riskEarningsHaircut), [nopatScenario, daTotal, maintCapexScenario, riskEarningsHaircut]);
  const adjustedEarningsScenario = useMemo(() => (epvMethod === "Owner Earnings" ? ownerEarningsScenario : nopatScenario * (1 - riskEarningsHaircut)), [epvMethod, ownerEarningsScenario, nopatScenario, riskEarningsHaircut]);

  // EPV (Enterprise and Equity)
  const enterpriseEPV = useMemo(() => (scenarioWacc > 0 ? adjustedEarningsScenario / scenarioWacc : 0), [adjustedEarningsScenario, scenarioWacc]);
  const equityEPV = useMemo(() => enterpriseEPV + cashNonOperating - debtInterestBearing, [enterpriseEPV, cashNonOperating, debtInterestBearing]);

  // Simple component for now - just show basic results
  return (
    <div className={cx("min-h-screen", theme === "dark" ? "bg-black text-green-400" : "bg-white text-gray-900")}>
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">🏥 Medispa EPV Valuation Pro</h1>
          <p className="text-lg opacity-80">Advanced Earnings Power Value Analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className={cx("p-4 rounded-lg border", theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
            <h3 className="text-lg font-semibold mb-2">Revenue</h3>
            <div className="text-2xl font-bold">{fmt0.format(totalRevenueBase)}</div>
            <div className="text-sm opacity-70">{locations} location{locations > 1 ? 's' : ''}</div>
          </div>
          
          <div className={cx("p-4 rounded-lg border", theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
            <h3 className="text-lg font-semibold mb-2">EBITDA (Normalized)</h3>
            <div className="text-2xl font-bold">{fmt0.format(ebitdaNormalized)}</div>
            <div className="text-sm opacity-70">{pctFmt(ebitdaNormalized / totalRevenueBase)} margin</div>
          </div>
          
          <div className={cx("p-4 rounded-lg border", theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
            <h3 className="text-lg font-semibold mb-2">Enterprise Value (EPV)</h3>
            <div className="text-2xl font-bold">{fmt0.format(enterpriseEPV)}</div>
            <div className="text-sm opacity-70">WACC: {pctFmt(scenarioWacc)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={cx("p-6 rounded-lg border", theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
            <h3 className="text-xl font-semibold mb-4">Key Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>EBIT (Normalized):</span>
                <span className="font-mono">{fmt0.format(ebitNormalized)}</span>
              </div>
              <div className="flex justify-between">
                <span>NOPAT:</span>
                <span className="font-mono">{fmt0.format(nopat)}</span>
              </div>
              <div className="flex justify-between">
                <span>Owner Earnings:</span>
                <span className="font-mono">{fmt0.format(ownerEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span>Maintenance Capex:</span>
                <span className="font-mono">{fmt0.format(maintCapexBase)}</span>
              </div>
              <div className="flex justify-between">
                <span>Equity Value:</span>
                <span className="font-mono font-bold">{fmt0.format(equityEPV)}</span>
              </div>
            </div>
          </div>

          <div className={cx("p-6 rounded-lg border", theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
            <h3 className="text-xl font-semibold mb-4">Service Lines</h3>
            <div className="space-y-2">
              {serviceLines.map((line, i) => (
                <div key={line.id} className="flex justify-between text-sm">
                  <span>{line.name}:</span>
                  <span className="font-mono">{fmt0.format(revenueByLine[i])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm opacity-60">
          <p>Built for private equity-grade analysis • For education only; not investment advice.</p>
        </div>
      </div>
    </div>
  );
} 