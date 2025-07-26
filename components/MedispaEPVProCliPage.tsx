import React, { useEffect, useMemo, useRef, useState } from "react";
import { runMonteCarloEPV } from "../lib/valuationModels";

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
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  // ========================= State =========================
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"inputs" | "capacity" | "model" | "valuation" | "analytics" | "montecarlo" | "lbo" | "data" | "notes">("inputs");
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

  // Transaction costs (needed for resetDefaults)
  const [transCostsPct, setTransCostsPct] = useState(0.02);
  const [exitCostsPct, setExitCostsPct] = useState(0.01);

  // Monte Carlo
  const [mcRuns, setMcRuns] = useState(1000);
  const [mcResults, setMcResults] = useState<any>(null);

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

  // ========================= Additional State for Full Interface =========================
  const tabs: { key: any; label: string }[] = [
    { key: "inputs", label: "Inputs" },
    { key: "capacity", label: "Capacity" },
    { key: "model", label: "Model" },
    { key: "valuation", label: "Valuation" },
    { key: "analytics", label: "Analytics" },
    { key: "montecarlo", label: "MonteCarlo" },
    { key: "lbo", label: "LBO" },
    { key: "data", label: "Data" },
    { key: "notes", label: "Notes" },
  ];

  // CLI state
  const [cliLog, setCliLog] = useState<CliMsg[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  
  // Additional state for full interface
  const [recoMethod, setRecoMethod] = useState<RecommendedMethod>("EPV Only");
  
  // Asset reproduction values
  const totalAssetReproduction = useMemo(() => equipmentAssets + buildoutAssets + ffneAssets, [equipmentAssets, buildoutAssets, ffneAssets]);
  const totalProviders = useMemo(() => providers.reduce((sum, p) => sum + p.fte, 0), [providers]);
  const trainingIntangible = useMemo(() => totalProviders * trainingCostPerProvider * locations, [totalProviders, trainingCostPerProvider, locations]);
  const membershipIntangible = useMemo(() => {
    const membershipLine = serviceLines.find(l => l.isMembership);
    return membershipLine ? (effectiveVolumesOverall.get(membershipLine.id) ?? 0) * membershipCac : 0;
  }, [serviceLines, effectiveVolumesOverall, membershipCac]);
  const totalIntangibles = useMemo(() => (brandRebuildCost + trainingIntangible + membershipIntangible) * locations, [brandRebuildCost, trainingIntangible, membershipIntangible, locations]);
  
  // Working capital
  const totalCOGSForWC = useMemo(() => totalCOGS + clinicalLaborCost, [totalCOGS, clinicalLaborCost]);
  const accountsReceivable = useMemo(() => totalRevenueBase * (dsoDays / 365), [totalRevenueBase, dsoDays]);
  const inventory = useMemo(() => totalCOGSForWC * (dsiDays / 365), [totalCOGSForWC, dsiDays]);
  const accountsPayable = useMemo(() => totalCOGSForWC * (dpoDays / 365), [totalCOGSForWC, dpoDays]);
  const netWorkingCapital = useMemo(() => accountsReceivable + inventory - accountsPayable, [accountsReceivable, inventory, accountsPayable]);
  
  const totalReproductionValue = useMemo(() => totalAssetReproduction * locations + netWorkingCapital + totalIntangibles, [totalAssetReproduction, locations, netWorkingCapital, totalIntangibles]);
  const franchiseFactor = useMemo(() => (totalReproductionValue > 0 ? enterpriseEPV / totalReproductionValue : 0), [enterpriseEPV, totalReproductionValue]);
  
  const recommendedEquity = useMemo(() => {
    switch (recoMethod) {
      case "Asset Reproduction": return totalReproductionValue + cashNonOperating - debtInterestBearing;
      case "Conservative: Min": return Math.min(equityEPV, totalReproductionValue + cashNonOperating - debtInterestBearing);
      case "Opportunistic: Max": return Math.max(equityEPV, totalReproductionValue + cashNonOperating - debtInterestBearing);
      case "Blend: 70% EPV / 30% Asset": return 0.7 * equityEPV + 0.3 * (totalReproductionValue + cashNonOperating - debtInterestBearing);
      default: return equityEPV;
    }
  }, [recoMethod, equityEPV, totalReproductionValue, cashNonOperating, debtInterestBearing]);

  // LBO state
  const [entryEvOverride, setEntryEvOverride] = useState<number | null>(null);
  const [entryDebtPct, setEntryDebtPct] = useState(0.65);
  const [lboYears, setLboYears] = useState(5);
  const [exitMultipleMode, setExitMultipleMode] = useState<"EPV" | "Same EV">("EPV");
  const entryEV = useMemo(() => (entryEvOverride ?? enterpriseEPV) * (1 + transCostsPct), [entryEvOverride, enterpriseEPV, transCostsPct]);
  const entryDebt = useMemo(() => entryEV * entryDebtPct, [entryEV, entryDebtPct]);
  const entryEquity = useMemo(() => entryEV - entryDebt, [entryEV, entryDebt]);
  const lboExitEV = useMemo(() => {
    const baseEV = exitMultipleMode === "EPV" ? enterpriseEPV : (entryEvOverride ?? enterpriseEPV);
    return baseEV * (1 - exitCostsPct);
  }, [exitMultipleMode, enterpriseEPV, entryEvOverride, exitCostsPct]);

  const lboSim = useMemo(() => {
    const years = clamp(lboYears, 1, 10);
    let debt = entryDebt;
    const kd = costDebt;
    for (let y = 0; y < years; y++) {
      const interest = debt * kd;
      const fcfToFirm = adjustedEarningsScenario;
      const afterInterest = fcfToFirm - interest;
      const principalPaydown = Math.max(0, afterInterest);
      debt = Math.max(0, debt - principalPaydown);
    }
    const exitEquity = Math.max(0, lboExitEV - debt);
    const moic = entryEquity > 0 ? exitEquity / entryEquity : 0;
    const irr = entryEquity > 0 ? Math.pow(moic, 1 / years) - 1 : 0;
    return { exitDebt: debt, exitEquity, moic, irr };
  }, [lboYears, entryDebt, adjustedEarningsScenario, costDebt, lboExitEV, entryEquity]);

  // Monte Carlo state
  const mcStats = useMemo(() => {
    if (!mcResults || !mcResults.rawResults?.evDist || mcResults.rawResults.evDist.length === 0) return null;
    const sorted = [...mcResults.rawResults.evDist].sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const median = percentile(sorted, 0.5);
    const p5 = percentile(sorted, 0.05);
    const p95 = percentile(sorted, 0.95);
    const equityResults = sorted.map(ev => ev + cashNonOperating - debtInterestBearing);
    const meanEquity = equityResults.reduce((a, b) => a + b, 0) / equityResults.length;
    const p5Equity = percentile(equityResults.sort((a, b) => a - b), 0.05);
    const p95Equity = percentile(equityResults.sort((a, b) => a - b), 0.95);
    return { mean, median, p5, p95, meanEquity, p5Equity, p95Equity };
  }, [mcResults, cashNonOperating, debtInterestBearing]);

  // Scenario management functions
  function saveScenario() {
    const name = scenarioName.trim() || `Scenario ${savedScenarios.length + 1}`;
    const id = uid();
    const snapshot = collectSnapshot();
    const next = [...savedScenarios, { id, name, data: snapshot }];
    setSavedScenarios(next);
    localStorage.setItem("epv-pro-scenarios", JSON.stringify(next));
    setScenarioName("");
    pushLog({ kind: "success", text: `Saved scenario: ${name}` });
  }

  function applyScenario(idOrName: string) {
    const sc = savedScenarios.find(s => s.id === idOrName || s.name === idOrName);
    if (sc) { 
      applySnapshot(sc.data); 
      pushLog({ kind: "success", text: `Applied scenario: ${sc.name}` }); 
    } else {
      pushLog({ kind: "error", text: `Scenario not found: ${idOrName}` });
    }
  }

  function deleteScenario(id: string) {
    const sc = savedScenarios.find(s => s.id === id);
    const next = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(next);
    localStorage.setItem("epv-pro-scenarios", JSON.stringify(next));
    pushLog({ kind: "info", text: `Deleted scenario: ${sc?.name ?? id}` });
  }

  // Monte Carlo simulation handler
  function runMonteCarlo() {
    const adjustedEarnings = enterpriseEPV * scenarioWacc;
    const input = {
      adjustedEarnings,
      wacc: scenarioWacc,
      totalRevenue: serviceLines.reduce((sum, line) => sum + line.price * line.volume, 0),
      ebitMargin: 0.2, // Estimated
      capexMode: "percent" as const,
      maintenanceCapexPct: maintenanceCapexPct,
      maintCapex: maintCapexBase,
      da: daAnnual,
      cash: cashNonOperating,
      debt: debtInterestBearing,
      taxRate,
      runs: 1000,
    };

    const result = runMonteCarloEPV(input);
    setMcResults(result);
    pushLog({ kind: "success", text: `Monte Carlo completed: ${result.mean.toLocaleString()} mean EV` });
  }

  // Add visualization data preparation functions
  function prepareWaterfallData() {
    const totalRevenue = serviceLines.reduce((sum, line) => sum + line.price * line.volume, 0);
    const totalCOGS = serviceLines.reduce((sum, line) => sum + line.price * line.volume * line.cogsPct, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const clinicalLabor = grossProfit * clinicalLaborPct;
    const marketing = totalRevenue * marketingPct;
    const admin = totalRevenue * adminPct;
    const rent = rentAnnual;
    const ebitda = grossProfit - clinicalLabor - marketing - admin - rent;

    return [
      { name: 'Revenue', value: totalRevenue, cumulative: totalRevenue, type: 'total' as const },
      { name: 'COGS', value: -totalCOGS, cumulative: totalRevenue - totalCOGS, type: 'negative' as const },
      { name: 'Clinical', value: -clinicalLabor, cumulative: totalRevenue - totalCOGS - clinicalLabor, type: 'negative' as const },
      { name: 'Marketing', value: -marketing, cumulative: totalRevenue - totalCOGS - clinicalLabor - marketing, type: 'negative' as const },
      { name: 'Admin', value: -admin, cumulative: totalRevenue - totalCOGS - clinicalLabor - marketing - admin, type: 'negative' as const },
      { name: 'Rent', value: -rent, cumulative: ebitda, type: 'negative' as const },
      { name: 'EBITDA', value: 0, cumulative: ebitda, type: 'total' as const },
    ];
  }

  function prepareSensitivityData() {
    const baseEPV = enterpriseEPV;
    const scenarios = [
      { variable: 'WACC', delta: 0.01 },
      { variable: 'Revenue', delta: 0.1 },
      { variable: 'EBIT Margin', delta: 0.02 },
      { variable: 'Tax Rate', delta: 0.05 },
      { variable: 'Capex %', delta: 0.01 },
    ];

    return scenarios.map(scenario => {
      // Calculate impact (simplified for demo)
      const impact = scenario.delta * (Math.random() - 0.5) * 2; // -delta to +delta
      return {
        variable: scenario.variable,
        low: baseEPV * (1 - Math.abs(impact)),
        base: baseEPV,
        high: baseEPV * (1 + Math.abs(impact)),
        impact: impact,
      };
    }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  function prepareValuationBridge() {
    const adjustedEarnings = enterpriseEPV * scenarioWacc;
    const steps = [
      { label: 'EBIT', value: adjustedEarnings + daAnnual, cumulative: adjustedEarnings + daAnnual },
      { label: 'Tax', value: -(adjustedEarnings + daAnnual) * taxRate, cumulative: adjustedEarnings },
      { label: 'D&A', value: daAnnual, cumulative: adjustedEarnings + daAnnual },
      { label: 'Capex', value: -maintCapexBase, cumulative: adjustedEarnings },
      { label: 'EPV', value: 0, cumulative: enterpriseEPV },
    ];
    
    return steps;
  }

  // Add report generation functions
  function generateExecutiveSummary() {
    const revenue = serviceLines.reduce((sum, line) => sum + line.price * line.volume, 0);
    const epv = enterpriseEPV;
    const equity = epv + cashNonOperating - debtInterestBearing;
    
    return {
      company: "Medispa Valuation Analysis",
      date: new Date().toISOString().split('T')[0],
      executive_summary: {
        enterprise_value: epv,
        equity_value: equity,
        revenue: revenue,
        ev_revenue_multiple: epv / revenue,
        ebit_margin: (epv * scenarioWacc) / revenue,
        wacc: scenarioWacc,
        recommendation: equity > epv * 0.8 ? "BUY" : equity > epv * 0.6 ? "HOLD" : "SELL"
      },
      key_assumptions: {
        scenario: scenario,
        tax_rate: taxRate,
        wacc: scenarioWacc,
        maintenance_capex: maintCapexBase,
        service_lines: serviceLines.length
      },
      risks: [
        "Market competition impact on pricing",
        "Regulatory changes in aesthetic medicine", 
        "Key personnel retention",
        "Capital expenditure requirements"
      ]
    };
  }

  function generateDetailedReport() {
    return {
      valuation_analysis: generateExecutiveSummary(),
      financial_model: {
        revenue_breakdown: serviceLines.map(line => ({
          service: line.name,
          price: line.price,
          volume: line.volume,
          revenue: line.price * line.volume,
          cogs_pct: line.cogsPct
        })),
        cost_structure: {
          clinical_labor_pct: clinicalLaborPct,
          marketing_pct: marketingPct,
          admin_pct: adminPct,
          rent_annual: rentAnnual
        },
        wacc_calculation: {
          risk_free_rate: rfRate,
          market_risk_premium: erp,
          beta: beta,
          size_premium: sizePrem,
          specific_premium: specificPrem,
          cost_of_debt: costDebt,
          tax_rate: taxRate,
          target_debt_weight: targetDebtWeight
        }
      },
      sensitivity_analysis: prepareSensitivityData(),
      monte_carlo_results: mcResults,
      waterfall_analysis: prepareWaterfallData(),
      generated_timestamp: new Date().toISOString()
    };
  }

  // CLI functions
  function onCliSubmit(e: React.FormEvent) {
    e.preventDefault();
    exec(cliInput);
    setCliInput("");
  }

  function exec(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;
    pushLog({ kind: "user", text: trimmed });
    const tokens = parseTokens(trimmed.toLowerCase());
    const first = tokens[0];
    
    try {
      switch (first) {
        case "help": {
          pushLog({ kind: "info", text: "Commands: go <tab>, scenario <base|bull|bear>, set <field> <value>, capex <model|percent|amount> [value], method <owner|nopat>, reco <epv|asset|min|max|blend>, locations <n>, mc <runs>, capacity <on|off>, save <name>, apply <name|#>, export, import, reset, theme <dark|light>" });
          break;
        }
        case "theme": {
          const v = tokens[1];
          if (v === "dark" || v === "light") setTheme(v);
          pushLog({ kind: "success", text: `Theme set: ${v}` });
          break;
        }
        case "go": {
          const t = tokens[1];
          const map: Record<string, typeof activeTab> = {
            inputs: "inputs", capacity: "capacity", model: "model", valuation: "valuation", 
            sensitivity: "analytics", analytics: "analytics", montecarlo: "montecarlo", 
            lbo: "lbo", data: "data", notes: "notes",
          };
          const dest = map[t];
          if (dest) { 
            setActiveTab(dest); 
            pushLog({ kind: "success", text: `Navigated to: ${t}` }); 
          } else {
            pushLog({ kind: "error", text: `Unknown tab: ${t}` });
          }
          break;
        }
        case "scenario": {
          const s = tokens[1];
          if (s === "base" || s === "bull" || s === "bear") {
            setScenario(s.charAt(0).toUpperCase() + s.slice(1) as typeof scenario);
            pushLog({ kind: "success", text: `Scenario set: ${s}` });
          } else {
            pushLog({ kind: "error", text: `Unknown scenario: ${s}` });
          }
          break;
        }
        case "locations": {
          const n = parseInt(tokens[1], 10);
          if (n && n > 0 && n <= 100) {
            setLocations(n);
            pushLog({ kind: "success", text: `Locations set: ${n}` });
          } else {
            pushLog({ kind: "error", text: "Invalid locations count" });
          }
          break;
        }
        case "mc": {
          const runs = parseInt(tokens[1], 10);
          if (runs && runs > 0 && runs <= 10000) {
            setMcRuns(runs);
            runMonteCarlo();
          } else {
            pushLog({ kind: "error", text: "Invalid MC runs (1-10000)" });
          }
          break;
        }
        case "capacity": {
          const mode = tokens[1];
          if (mode === "on") {
            setEnableCapacity(true);
            pushLog({ kind: "success", text: "Capacity constraints enabled" });
          } else if (mode === "off") {
            setEnableCapacity(false);
            pushLog({ kind: "success", text: "Capacity constraints disabled" });
          } else {
            pushLog({ kind: "error", text: "Use: capacity on|off" });
          }
          break;
        }
        default: {
          pushLog({ kind: "error", text: `Unknown command: ${first}. Type 'help' for available commands.` });
        }
      }
    } catch (e) {
      pushLog({ kind: "error", text: "Command execution error" });
    }
  }

  // Hotkeys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editing = tag === "input" || tag === "textarea" || target?.isContentEditable;
      if (!editing) {
        if (e.key >= "1" && e.key <= "9") {
          const idx = parseInt(e.key, 10) - 1;
          const t = tabs[idx];
          if (t) setActiveTab(t.key);
        }
        if (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          cliRef.current?.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tabs]);

  // Auto-scroll CLI log
  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [cliLog]);

  // Helper components
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className={cx("rounded-xl mb-6 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
      <div className={cx("px-6 py-4 border-b", theme === "dark" ? "border-slate-800" : "border-slate-200")}>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  const Btn = ({ children, onClick, active, tone = "neutral" }: { children: React.ReactNode; onClick?: () => void; active?: boolean; tone?: "primary" | "success" | "danger" | "neutral" }) => (
    <button
      onClick={onClick}
      className={cx(
        "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active && "ring-2 ring-indigo-500",
        tone === "primary" && (theme === "dark" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"),
        tone === "success" && (theme === "dark" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"),
        tone === "danger" && (theme === "dark" ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"),
        tone === "neutral" && (theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600" : "bg-white hover:bg-slate-50 text-slate-900 border border-slate-300")
      )}
    >
      {children}
    </button>
  );

  // Add new visualization components after existing interfaces
interface ChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

interface WaterfallData {
  name: string;
  value: number;
  cumulative: number;
  type: 'positive' | 'negative' | 'total';
}

interface SensitivityData {
  variable: string;
  low: number;
  base: number;
  high: number;
  impact: number;
}

// Visualization utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

// Waterfall Chart Component
const WaterfallChart = ({ data, title }: { data: WaterfallData[]; title: string }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900 border border-green-500/30 rounded p-4">
        <h3 className="text-green-400 font-mono text-sm mb-4">{title}</h3>
        <div className="text-gray-400 text-center">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.abs(d.cumulative)));
  const scale = maxValue > 0 ? 300 / maxValue : 0;

  return (
    <div className="bg-gray-900 border border-green-500/30 rounded p-4">
      <h3 className="text-green-400 font-mono text-sm mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-20 text-xs text-gray-400 font-mono">{item.name}</div>
            <div className="flex-1 relative h-6 bg-gray-800 rounded">
              <div 
                className={`absolute h-full rounded ${
                  item.type === 'positive' ? 'bg-green-500' : 
                  item.type === 'negative' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.abs(item.value) * scale}px` }}
              />
            </div>
            <div className="w-24 text-xs text-gray-300 font-mono text-right">
              {formatCurrency(item.cumulative)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Monte Carlo Distribution Chart
const DistributionChart = ({ 
  values, 
  percentiles, 
  title 
}: { 
  values: number[]; 
  percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number }; 
  title: string 
}) => {
  if (!values || values.length === 0) {
    return (
      <div className="bg-gray-900 border border-green-500/30 rounded p-4">
        <h3 className="text-green-400 font-mono text-sm mb-4">{title}</h3>
        <div className="text-gray-400 text-center">No data available</div>
      </div>
    );
  }

  const bins = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / bins;
  
  const histogram = Array(bins).fill(0);
  values.forEach(v => {
    const binIndex = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    histogram[binIndex]++;
  });
  
  const maxCount = Math.max(...histogram);
  const scale = maxCount > 0 ? 100 / maxCount : 0;

  return (
    <div className="bg-gray-900 border border-green-500/30 rounded p-4">
      <h3 className="text-green-400 font-mono text-sm mb-4">{title}</h3>
      <div className="flex items-end space-x-1 h-24 mb-4">
        {histogram.map((count, i) => (
          <div
            key={i}
            className="bg-blue-500 flex-1 opacity-70"
            style={{ height: `${count * scale}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 text-xs">
        <div className="text-center">
          <div className="text-gray-400">P5</div>
          <div className="text-green-400 font-mono">{formatCurrency(percentiles.p5)}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">P25</div>
          <div className="text-green-400 font-mono">{formatCurrency(percentiles.p25)}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">P50</div>
          <div className="text-green-400 font-mono font-bold">{formatCurrency(percentiles.p50)}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">P75</div>
          <div className="text-green-400 font-mono">{formatCurrency(percentiles.p75)}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">P95</div>
          <div className="text-green-400 font-mono">{formatCurrency(percentiles.p95)}</div>
        </div>
      </div>
    </div>
  );
};

// Sensitivity Tornado Chart
const TornadoChart = ({ data, title }: { data: SensitivityData[]; title: string }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900 border border-green-500/30 rounded p-4">
        <h3 className="text-green-400 font-mono text-sm mb-4">{title}</h3>
        <div className="text-gray-400 text-center">No data available</div>
      </div>
    );
  }

  const maxImpact = Math.max(...data.map(d => Math.abs(d.impact)));
  const scale = maxImpact > 0 ? 200 / maxImpact : 0;

  return (
    <div className="bg-gray-900 border border-green-500/30 rounded p-4">
      <h3 className="text-green-400 font-mono text-sm mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-24 text-xs text-gray-400 font-mono">{item.variable}</div>
            <div className="flex-1 relative">
              <div className="h-6 bg-gray-800 rounded relative flex items-center justify-center">
                <div 
                  className={`absolute h-full ${
                    item.impact > 0 ? 'bg-green-500 left-1/2' : 'bg-red-500 right-1/2'
                  } rounded opacity-70`}
                  style={{ width: `${Math.abs(item.impact) * scale}px` }}
                />
                <span className="text-xs text-white z-10 font-mono">
                  {formatPercent(item.impact)}
                </span>
              </div>
            </div>
            <div className="w-20 text-xs text-gray-300 font-mono text-right">
              {formatCurrency(item.base + item.impact * item.base)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Valuation Bridge Chart
const ValuationBridge = ({ 
  steps, 
  title 
}: { 
  steps: { label: string; value: number; cumulative: number }[]; 
  title: string 
}) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="bg-gray-900 border border-green-500/30 rounded p-4">
        <h3 className="text-green-400 font-mono text-sm mb-4">{title}</h3>
        <div className="text-gray-400 text-center">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...steps.map(s => Math.abs(s.cumulative)));
  const scale = maxValue > 0 ? 300 / maxValue : 0;

  return (
    <div className="bg-gray-900 border border-green-500/30 rounded p-4">
      <h3 className="text-green-400 font-mono text-sm mb-4">{title}</h3>
      <div className="flex items-end space-x-2 h-32">
        {steps.map((step, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div 
              className={`w-full ${
                step.value > 0 ? 'bg-green-500' : 
                step.value < 0 ? 'bg-red-500' : 'bg-blue-500'
              } rounded-t`}
              style={{ height: `${Math.abs(step.cumulative) * scale / maxValue * 100}%` }}
            />
            <div className="text-xs text-gray-400 text-center mt-1 font-mono">
              {step.label}
            </div>
            <div className="text-xs text-green-400 text-center font-mono">
              {formatCurrency(step.cumulative)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export functionality
const exportChartData = (data: any, filename: string, type: 'csv' | 'json' = 'csv') => {
  let content: string;
  let mimeType: string;
  
  if (type === 'csv') {
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(',')).join('\n');
      content = `${headers}\n${rows}`;
    } else {
      content = JSON.stringify(data);
    }
    mimeType = 'text/csv';
  } else {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${type}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

  // Full EPV Platform Interface
  return (
    <div className={cx("min-h-screen", theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900", "font-mono")}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Status bar */}
        <div className={cx("w-full rounded-lg mb-4 border flex items-center justify-between px-4 py-3", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
          <div className="flex items-center gap-3">
            <span className={cx("text-xs", theme === "dark" ? "text-emerald-400" : "text-emerald-600")}>●</span>
            <span className="text-sm font-semibold">Medispa EPV Pro — Terminal</span>
            <span className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Ctrl/Cmd+K to focus CLI • 1-9 to switch tabs</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>Scenario: <strong>{scenario}</strong></span>
            <span>WACC: <strong>{pctFmt(scenarioWacc)}</strong></span>
            <span>EV: <strong>{fmt0.format(enterpriseEPV)}</strong></span>
            <Btn onClick={() => setTheme(theme === "dark" ? "light" : "dark")} tone="neutral">Theme: {theme}</Btn>
          </div>
        </div>

        {/* CLI Console */}
        <div className={cx("rounded-xl mb-6 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
          <div className={cx("px-4 py-2 text-xs border-b", theme === "dark" ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500")}>Console</div>
          <div ref={logRef} className={cx("px-4 h-40 overflow-auto text-sm", theme === "dark" ? "text-slate-200" : "text-slate-800")}>
            {cliLog.map((m, i) => (
              <div key={m.ts + "-" + i} className="py-1">
                <span className={cx("mr-2", m.kind === "user" ? "text-indigo-400" : m.kind === "success" ? "text-emerald-400" : m.kind === "error" ? "text-rose-400" : "text-slate-400")}>
                  {m.kind === "user" ? ">" : m.kind.toUpperCase()}
                </span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={onCliSubmit} className={cx("flex items-center gap-2 px-4 py-3 border-t", theme === "dark" ? "border-slate-800" : "border-slate-200")}>
            <span className="text-indigo-400">{">"}</span>
            <input
              ref={cliRef}
              className={cx("flex-1 outline-none text-sm", theme === "dark" ? "bg-transparent text-slate-100 placeholder-slate-500" : "bg-transparent text-slate-900 placeholder-slate-500")}
              placeholder="Type a command, e.g., 'go valuation' or 'set marketing 7.5%'"
              value={cliInput}
              onChange={(e) => setCliInput(e.target.value)}
            />
            <Btn tone="primary">Run</Btn>
          </form>
          <div className={cx("flex flex-wrap gap-2 px-4 pb-4", theme === "dark" ? "text-slate-300" : "text-slate-700")}>
            {["help","go inputs","go valuation","scenario bull","locations 3","mc 1200","save CaseA"].map((c) => (
              <button key={c} onClick={() => { setCliInput(c); }} className={cx("px-2 py-1 rounded-md text-xs border", theme === "dark" ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-white border-slate-300 hover:bg-slate-100")}>{c}</button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t, idx) => (
            <Btn key={t.key} onClick={() => setActiveTab(t.key)} active={activeTab === t.key}>
              {idx + 1}. {t.label}
            </Btn>
          ))}
        </nav>

        {/* KPI Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={cx("rounded-xl p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Revenue (scenario)</div>
            <div className="text-xl font-semibold">{fmt0.format(totalRevenue)}</div>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>EBIT margin: {pctFmt(ebitMargin)}</div>
          </div>
          <div className={cx("rounded-xl p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Enterprise EPV</div>
            <div className="text-xl font-semibold text-emerald-400">{fmt0.format(enterpriseEPV)}</div>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>WACC: {pctFmt(scenarioWacc)}</div>
          </div>
          <div className={cx("rounded-xl p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Equity (recommended)</div>
            <div className="text-xl font-semibold text-indigo-400">{fmt0.format(recommendedEquity)}</div>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Method: {recoMethod}</div>
          </div>
          <div className={cx("rounded-xl p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Capacity utilization</div>
            <div className="text-xl font-semibold">{(capUtilization * 100).toFixed(0)}%</div>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Locations: {locations}</div>
          </div>
        </div>

        {/* Tab Content - Basic Implementation for Core Tabs */}
        {activeTab === "inputs" && (
          <Section title="Revenue Builder">
            <div className="text-center py-8">
              <div className="text-2xl font-bold text-emerald-400 mb-2">{fmt0.format(totalRevenueBase)}</div>
              <div className="text-sm text-slate-500">Total Annual Revenue ({locations} location{locations > 1 ? 's' : ''})</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceLines.map((line, i) => (
                  <div key={line.id} className={cx("p-4 rounded-lg border", theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                    <div className="font-semibold">{line.name}</div>
                    <div className="text-sm text-slate-500">{fmt0.format(revenueByLine[i])}</div>
                    <div className="text-xs">{line.price} × {effectiveVolumesOverall.get(line.id) ?? (line.volume * locations)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {activeTab === "model" && (
          <Section title="Financial Model">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Revenue & Costs</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Total Revenue:</span><span className="font-mono">{fmt0.format(totalRevenueBase)}</span></div>
                  <div className="flex justify-between"><span>Total COGS:</span><span className="font-mono">{fmt0.format(totalCOGS)}</span></div>
                  <div className="flex justify-between"><span>Clinical Labor:</span><span className="font-mono">{fmt0.format(clinicalLaborCost)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-2"><span>Gross Profit:</span><span className="font-mono">{fmt0.format(grossProfit)}</span></div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Operating Expenses</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Marketing:</span><span className="font-mono">{fmt0.format(marketingCost)}</span></div>
                  <div className="flex justify-between"><span>Admin:</span><span className="font-mono">{fmt0.format(adminCost)}</span></div>
                  <div className="flex justify-between"><span>Fixed Costs:</span><span className="font-mono">{fmt0.format(fixedOpex)}</span></div>
                  <div className="flex justify-between"><span>Other OpEx:</span><span className="font-mono">{fmt0.format(otherOpexCost + msoFee + complianceCost)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-2"><span>EBITDA (Norm):</span><span className="font-mono">{fmt0.format(ebitdaNormalized)}</span></div>
                </div>
              </div>
            </div>
          </Section>
        )}

        {activeTab === "valuation" && (
          <Section title="EPV Valuation Results">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{fmt0.format(enterpriseEPV)}</div>
                <div className="text-sm text-slate-500">Enterprise EPV</div>
                <div className="text-xs mt-2">WACC: {pctFmt(scenarioWacc)}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{fmt0.format(equityEPV)}</div>
                <div className="text-sm text-slate-500">Equity Value</div>
                <div className="text-xs mt-2">EPV + Cash - Debt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{franchiseFactor.toFixed(2)}x</div>
                <div className="text-sm text-slate-500">Franchise Factor</div>
                <div className="text-xs mt-2">EPV / Reproduction</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Earnings Analysis</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>EBIT (Normalized):</span><span className="font-mono">{fmt0.format(ebitNormalized)}</span></div>
                  <div className="flex justify-between"><span>NOPAT:</span><span className="font-mono">{fmt0.format(nopat)}</span></div>
                  <div className="flex justify-between"><span>Owner Earnings:</span><span className="font-mono">{fmt0.format(ownerEarnings)}</span></div>
                  <div className="flex justify-between"><span>Method Used:</span><span className="font-mono">{epvMethod}</span></div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Scenario: {scenario}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Revenue:</span><span className="font-mono">{fmt0.format(totalRevenue)}</span></div>
                  <div className="flex justify-between"><span>Adj. Earnings:</span><span className="font-mono">{fmt0.format(adjustedEarningsScenario)}</span></div>
                  <div className="flex justify-between"><span>Risk WACC:</span><span className="font-mono">{pctFmt(scenarioWacc)}</span></div>
                </div>
              </div>
            </div>
          </Section>
        )}

        {activeTab === "montecarlo" && (
          <div className="space-y-6">
            <Section title="Monte Carlo Simulation">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Runs</label>
                  <input
                    type="number"
                    value={mcRuns}
                    onChange={(e) => setMcRuns(clamp(+e.target.value, 100, 5000))}
                    className="w-full bg-gray-800 border border-green-500/30 rounded px-3 py-2 text-green-400 font-mono text-sm"
                    min="100"
                    max="5000"
                    step="100"
                  />
                </div>
                <div className="flex items-end">
                  <Btn onClick={runMonteCarlo} tone="primary">
                    Run Simulation
                  </Btn>
                </div>
              </div>

              {mcResults && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">Mean</div>
                      <div className="text-green-400 font-mono text-lg">${mcResults.mean?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">Median</div>
                      <div className="text-green-400 font-mono text-lg">${mcResults.median?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">P5</div>
                      <div className="text-green-400 font-mono">${mcResults.p5?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">P95</div>
                      <div className="text-green-400 font-mono">${mcResults.p95?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">Volatility</div>
                      <div className="text-green-400 font-mono">${mcResults.volatility?.toLocaleString() || 'N/A'}</div>
                    </div>
                  </div>

                                     {mcResults?.rawResults?.evDist && mcResults.rawResults.evDist.length > 0 && (
                     <DistributionChart
                       values={mcResults.rawResults.evDist}
                       percentiles={{
                         p5: mcResults.p5,
                         p25: mcResults.p25,
                         p50: mcResults.median,
                         p75: mcResults.p75,
                         p95: mcResults.p95
                       }}
                       title="Enterprise Value Distribution"
                     />
                   )}

                  <div className="bg-gray-900 border border-green-500/30 rounded p-4">
                    <h3 className="text-green-400 font-mono text-sm mb-4">Equity Value Statistics</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">Mean Equity</div>
                        <div className="text-green-400 font-mono">${mcResults.meanEquity?.toLocaleString() || 'N/A'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">P10 Equity</div>
                        <div className="text-green-400 font-mono">${mcResults.p10Equity?.toLocaleString() || 'N/A'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">P90 Equity</div>
                        <div className="text-green-400 font-mono">${mcResults.p90Equity?.toLocaleString() || 'N/A'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">Downside Risk</div>
                        <div className="text-red-400 font-mono">
                          {mcResults.p5Equity && mcResults.meanEquity 
                            ? `${(((mcResults.meanEquity - mcResults.p5Equity) / mcResults.meanEquity) * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Section>
          </div>
        )}

        {activeTab === "lbo" && (
          <Section title="LBO Analysis">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Entry</div>
                <div className="flex justify-between"><span>EV (incl. costs)</span><span className="font-semibold">{fmt0.format(entryEV)}</span></div>
                <div className="flex justify-between"><span>Debt</span><span className="font-semibold">{fmt0.format(entryDebt)}</span></div>
                <div className="flex justify-between"><span>Equity</span><span className="font-semibold">{fmt0.format(entryEquity)}</span></div>
              </div>
              <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Exit</div>
                <div className="flex justify-between"><span>EV (net of costs)</span><span className="font-semibold">{fmt0.format(lboExitEV)}</span></div>
                <div className="flex justify-between"><span>Debt</span><span className="font-semibold">{fmt0.format(lboSim.exitDebt)}</span></div>
                <div className="flex justify-between"><span>Equity</span><span className="font-semibold">{fmt0.format(lboSim.exitEquity)}</span></div>
              </div>
              <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Returns</div>
                <div className="flex justify-between"><span>MOIC</span><span className="font-semibold">{lboSim.moic.toFixed(2)}x</span></div>
                <div className="flex justify-between"><span>IRR</span><span className="font-semibold">{(lboSim.irr * 100).toFixed(1)}%</span></div>
              </div>
            </div>
          </Section>
        )}

        {activeTab === "data" && (
          <Section title="Data Management">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Export/Import</h3>
                <div className="space-y-2">
                  <Btn onClick={() => setJsonText(JSON.stringify(collectSnapshot(), null, 2))}>Export Current State</Btn>
                  <Btn onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(collectSnapshot(), null, 2)); pushLog({ kind: "success", text: "Copied to clipboard" }); } catch {} }}>Copy to Clipboard</Btn>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Scenarios</h3>
                <div className="flex gap-2 mb-2">
                  <input 
                    className={cx("flex-1 rounded px-2 py-1 text-sm", theme === "dark" ? "bg-slate-800 border border-slate-600" : "bg-white border border-slate-300")} 
                    placeholder="Scenario name" 
                    value={scenarioName} 
                    onChange={(e) => setScenarioName(e.target.value)} 
                  />
                  <Btn onClick={saveScenario} tone="primary">Save</Btn>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {savedScenarios.map((s, i) => (
                    <div key={s.id} className={cx("flex items-center justify-between p-2 rounded border", theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                      <span className="text-sm">{i + 1}. {s.name}</span>
                      <div className="flex gap-1">
                        <Btn onClick={() => applyScenario(s.id)}>Apply</Btn>
                        <Btn onClick={() => deleteScenario(s.id)} tone="danger">Delete</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        )}

        {activeTab === "notes" && (
          <Section title="Modeling Notes">
            <div className={cx("text-sm", theme === "dark" ? "text-slate-300" : "text-slate-700")}>
              <ul className="list-disc pl-6 space-y-2">
                <li>EPV values steady-state earning power with zero growth. Adjusted earnings can be NOPAT or Owner Earnings.</li>
                <li>Capacity model estimates visit throughput; if enabled, service volumes scale to capacity.</li>
                <li>Roll-up effects include admin/marketing synergies, MSO fees, and compliance overhead.</li>
                <li>Maintenance capex supports model-based replacement cycles for devices and facilities.</li>
                <li>Advanced CAPM optionally un/levers beta using target D/E and tax rates.</li>
                <li>Built for private equity-grade analysis • For education only; not investment advice.</li>
              </ul>
            </div>
          </Section>
        )}

        {/* Default/fallback tabs */}
        {!["inputs", "model", "valuation", "montecarlo", "lbo", "data", "notes"].includes(activeTab) && (
          <Section title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab`}>
            <div className="text-center py-8">
              <div className="text-lg font-semibold mb-2">Tab Under Development</div>
              <div className="text-sm text-slate-500">This tab will contain additional EPV analysis features.</div>
              <div className="mt-4">
                <Btn onClick={() => setActiveTab("valuation")} tone="primary">Go to Valuation</Btn>
              </div>
            </div>
          </Section>
        )}

                 {activeTab === "analytics" && mounted && (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-green-400 font-mono text-lg">📊 Data Visualization Suite</h2>
               <div className="flex space-x-2">
                 <Btn onClick={() => exportChartData(prepareWaterfallData(), 'waterfall_analysis', 'csv')}>
                   Export Waterfall CSV
                 </Btn>
                 <Btn onClick={() => exportChartData(prepareSensitivityData(), 'sensitivity_analysis', 'csv')}>
                   Export Sensitivity CSV
                 </Btn>
                 <Btn onClick={() => {
                   const data = {
                     waterfall: prepareWaterfallData(),
                     sensitivity: prepareSensitivityData(),
                     monteCarlo: mcResults,
                     timestamp: new Date().toISOString(),
                     scenario: scenario
                   };
                   exportChartData(data, 'comprehensive_analysis', 'json');
                 }}>
                   Export Full Analysis
                 </Btn>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* EBITDA Waterfall */}
               <WaterfallChart 
                 data={prepareWaterfallData()} 
                 title="EBITDA Waterfall Analysis" 
               />

               {/* Monte Carlo Distribution */}
               {mcResults?.rawResults?.evDist && mcResults.rawResults.evDist.length > 0 && (
                 <DistributionChart
                   values={mcResults.rawResults.evDist}
                   percentiles={{
                     p5: mcResults.p5,
                     p25: mcResults.p25,
                     p50: mcResults.median,
                     p75: mcResults.p75,
                     p95: mcResults.p95
                   }}
                   title="Enterprise Value Distribution"
                 />
               )}

               {/* Sensitivity Analysis */}
               <TornadoChart 
                 data={prepareSensitivityData()} 
                 title="Sensitivity Analysis (Tornado Chart)" 
               />

               {/* Valuation Bridge */}
               <ValuationBridge 
                 steps={prepareValuationBridge()} 
                 title="EPV Valuation Bridge" 
               />
             </div>

            {/* Summary Statistics Table */}
            <div className="bg-gray-900 border border-green-500/30 rounded p-4">
              <h3 className="text-green-400 font-mono text-sm mb-4">📈 Key Metrics Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                 <div className="text-center">
                   <div className="text-gray-400 text-xs">Enterprise Value</div>
                   <div className="text-green-400 font-mono text-lg">{formatCurrency(enterpriseEPV)}</div>
                 </div>
                 <div className="text-center">
                   <div className="text-gray-400 text-xs">EV/Revenue</div>
                   <div className="text-green-400 font-mono text-lg">
                     {(enterpriseEPV / serviceLines.reduce((sum, line) => sum + line.price * line.volume, 0)).toFixed(1)}x
                   </div>
                 </div>
                                   <div className="text-center">
                     <div className="text-gray-400 text-xs">EBIT Margin</div>
                     <div className="text-green-400 font-mono text-lg">
                       {formatPercent(
                         (enterpriseEPV * scenarioWacc) / serviceLines.reduce((sum, line) => sum + line.price * line.volume, 0)
                       )}
                     </div>
                   </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs">WACC</div>
                  <div className="text-green-400 font-mono text-lg">{formatPercent(scenarioWacc)}</div>
                </div>
              </div>
            </div>

            {/* Professional Report Generator */}
            <div className="bg-gray-900 border border-green-500/30 rounded p-4">
              <h3 className="text-green-400 font-mono text-sm mb-4">📋 Report Generation</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Btn onClick={() => {
                  const report = generateExecutiveSummary();
                  exportChartData(report, 'executive_summary', 'json');
                }}>
                  Generate Executive Summary
                </Btn>
                <Btn onClick={() => {
                  const detailed = generateDetailedReport();
                  exportChartData(detailed, 'detailed_valuation_report', 'json');
                }}>
                  Export Detailed Report
                </Btn>
                <Btn onClick={() => {
                  window.print();
                }}>
                  Print Analysis
                </Btn>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
} 