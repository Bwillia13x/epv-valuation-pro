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
const idx = clamp(Math.floor((sorted.length - 1) \* p), 0, sorted.length - 1);
return sorted[idx];
}

function normalRand(mean: number, sd: number) {
// Box-Muller
let u = 0, v = 0;
while (u === 0) u = Math.random();
while (v === 0) v = Math.random();
const n = Math.sqrt(-2.0 _ Math.log(u)) _ Math.cos(2.0 _ Math.PI _ v);
return mean + sd \* n;
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

// ========================= Page =========================
export default function MedispaEPVProCliPage() {
// ------------- Theme -------------
const [theme, setTheme] = useState<"dark" | "light">("dark");

// ------------- Tabs -------------
const tabs: { key: any; label: string }[] = [
{ key: "inputs", label: "Inputs" },
{ key: "capacity", label: "Capacity" },
{ key: "model", label: "Model" },
{ key: "valuation", label: "Valuation" },
{ key: "analytics", label: "Sensitivity" },
{ key: "montecarlo", label: "MonteCarlo" },
{ key: "lbo", label: "LBO" },
{ key: "data", label: "Data" },
{ key: "notes", label: "Notes" },
];
const [activeTab, setActiveTab] = useState<typeof tabs[number]["key"]>("inputs");

// ------------- Core Inputs -------------
const [serviceLines, setServiceLines] = useState<ServiceLine[]>([
{ id: "inj", name: "Injectables", price: 575, volume: 2200, cogsPct: 0.28, kind: "service", visitUnits: 1.0 },
{ id: "laser", name: "Laser / Devices", price: 350, volume: 1800, cogsPct: 0.10, kind: "service", visitUnits: 1.0 },
{ id: "aesth", name: "Aesthetics / Facials", price: 200, volume: 1200, cogsPct: 0.15, kind: "service", visitUnits: 1.0 },
{ id: "retail", name: "Retail / Skincare", price: 90, volume: 3000, cogsPct: 0.55, kind: "retail", visitUnits: 0 },
{ id: "memb", name: "Memberships (annual)", price: 1188, volume: 400, cogsPct: 0.05, kind: "service", visitUnits: 0.3, isMembership: true },
{ id: "other", name: "Other", price: 150, volume: 400, cogsPct: 0.10, kind: "service", visitUnits: 1.0 },
]);

// Direct clinical labor for services
const [clinicalLaborPct, setClinicalLaborPct] = useState(0.28);

// Operating expenses (per location where reasonable)
const [marketingPct, setMarketingPct] = useState(0.08);
const [adminPct, setAdminPct] = useState(0.12);
const [rentAnnual, setRentAnnual] = useState(156000);
const [medDirectorAnnual, setMedDirectorAnnual] = useState(36000);
const [insuranceAnnual, setInsuranceAnnual] = useState(18000);
const [softwareAnnual, setSoftwareAnnual] = useState(24000);
const [utilitiesAnnual, setUtilitiesAnnual] = useState(18000);
const [otherOpexPct, setOtherOpexPct] = useState(0.02);

// Scale and MSO
const [locations, setLocations] = useState(1);
const [sgnaSynergyPct, setSgnaSynergyPct] = useState(0.1); // per additional location on admin
const [marketingSynergyPct, setMarketingSynergyPct] = useState(0.05); // per additional location on marketing
const [minAdminPctFactor, setMinAdminPctFactor] = useState(0.5); // floor 50% of original admin %
const [msoFeePct, setMsoFeePct] = useState(0.05); // management fee on revenue
const [complianceOverheadPct, setComplianceOverheadPct] = useState(0.005); // regulatory/compliance overhead on revenue
const [laborMarketAdj, setLaborMarketAdj] = useState(1.0); // multiplier on clinical labor %

// Normalizations & non-cash (per location unless noted)
const [ownerAddBack, setOwnerAddBack] = useState(120000);
const [otherAddBack, setOtherAddBack] = useState(0);
const [daAnnual, setDaAnnual] = useState(80000); // D&A baseline per location

// Maintenance capex
const [capexMode, setCapexMode] = useState<"percent" | "amount" | "model">("model");
const [maintenanceCapexPct, setMaintenanceCapexPct] = useState(0.04);
const [maintenanceCapexAmount, setMaintenanceCapexAmount] = useState(120000);
// model-based inputs
const [equipReplacementYears, setEquipReplacementYears] = useState(6);
const [buildoutRefreshYears, setBuildoutRefreshYears] = useState(10);
const [ffneRefreshYears, setFfneRefreshYears] = useState(7);
const [minorMaintPct, setMinorMaintPct] = useState(0.01);

// Working capital
const [dsoDays, setDsoDays] = useState(5);
const [dsiDays, setDsiDays] = useState(40);
const [dpoDays, setDpoDays] = useState(30);

// Capital & financing
const [cashNonOperating, setCashNonOperating] = useState(200000);
const [debtInterestBearing, setDebtInterestBearing] = useState(1200000);

// Tax & WACC
const [taxRate, setTaxRate] = useState(0.25);
const [rfRate, setRfRate] = useState(0.042);
const [erp, setErp] = useState(0.055);
const [beta, setBeta] = useState(1.1); // simple mode
const [capmMode, setCapmMode] = useState<"simple" | "advanced">("advanced");
const [betaUnlevered, setBetaUnlevered] = useState(0.7);
const [targetDE, setTargetDE] = useState(0.6); // Debt/Equity ratio for relevering
const [sizePrem, setSizePrem] = useState(0.02);
const [specificPrem, setSpecificPrem] = useState(0);
const [costDebt, setCostDebt] = useState(0.085);
const [targetDebtWeight, setTargetDebtWeight] = useState(0.35); // for WACC weighting

// EPV method & recommendation
const [epvMethod, setEpvMethod] = useState<EPVMethod>("Owner Earnings");
const [recoMethod, setRecoMethod] = useState<RecommendedMethod>("EPV Only");

// Asset reproduction (per location where applicable)
const [buildoutImprovements, setBuildoutImprovements] = useState(700000);
const [equipmentDevices, setEquipmentDevices] = useState(500000);
const [ffne, setFfne] = useState(150000);
const [startupIntangibles, setStartupIntangibles] = useState(120000);
const [brandRebuild, setBrandRebuild] = useState(50000);
const [trainingCostPerProvider, setTrainingCostPerProvider] = useState(5000);
const [membershipCAC, setMembershipCAC] = useState(120);
const [otherRepro, setOtherRepro] = useState(0);

// Capacity & staffing
const [enableCapacity, setEnableCapacity] = useState(false);
const [numRooms, setNumRooms] = useState(8);
const [hoursPerDay, setHoursPerDay] = useState(9);
const [daysPerWeek, setDaysPerWeek] = useState(6);
const [roomUtilization, setRoomUtilization] = useState(0.85);
const [providers, setProviders] = useState<ProviderType[]>([
{ id: "inj", name: "Injectors", fte: 4, hoursPerWeek: 35, apptsPerHour: 1.0, utilization: 0.85 },
{ id: "aest", name: "Aestheticians", fte: 3, hoursPerWeek: 35, apptsPerHour: 1.2, utilization: 0.8 },
]);

// Scenario toggles
const [scenario, setScenario] = useState<"Base" | "Bull" | "Bear">("Base");

// Risk overlays
const [riskEarningsHaircut, setRiskEarningsHaircut] = useState(0); // 0..1
const [riskWaccPremium, setRiskWaccPremium] = useState(0); // add to WACC

// Monte Carlo
const [mcRuns, setMcRuns] = useState(700);
const [mcStats, setMcStats] = useState<null | {
mean: number; median: number; p5: number; p95: number; meanEquity: number; p5Equity: number; p95Equity: number;
}>(null);

// LBO quick check
const [lboYears, setLboYears] = useState(5);
const [entryEvOverride, setEntryEvOverride] = useState<number | null>(null);
const [entryDebtPct, setEntryDebtPct] = useState(0.6);
const [exitMultipleMode, setExitMultipleMode] = useState<"EPV" | "Same EV">("EPV");
const [transCostsPct, setTransCostsPct] = useState(0.02); // buy-side costs as % EV
const [exitCostsPct, setExitCostsPct] = useState(0.01);

// Data management
const [jsonText, setJsonText] = useState("");
const [savedScenarios, setSavedScenarios] = useState<{ id: string; name: string; snapshot: any }[]>([]);
const [scenarioName, setScenarioName] = useState("");

// CLI state
const [cliLog, setCliLog] = useState<CliMsg[]>([
{ ts: Date.now(), kind: "system", text: "Welcome to EPV Pro CLI. Type 'help' for commands." },
]);
const [cliInput, setCliInput] = useState("");
const cliRef = useRef<HTMLInputElement | null>(null);
const logRef = useRef<HTMLDivElement | null>(null);

// ------------- Persistence -------------
useEffect(() => {
if (typeof window === "undefined") return;
try {
const raw = localStorage.getItem("medispa-epv-pro-state");
if (raw) applySnapshot(JSON.parse(raw));
const rawSc = localStorage.getItem("medispa-epv-pro-scenarios");
if (rawSc) setSavedScenarios(JSON.parse(rawSc));
const t = localStorage.getItem("medispa-epv-pro-theme");
if (t === "dark" || t === "light") setTheme(t);
} catch {}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
if (typeof window === "undefined") return;
localStorage.setItem("medispa-epv-pro-state", JSON.stringify(collectSnapshot()));
localStorage.setItem("medispa-epv-pro-scenarios", JSON.stringify(savedScenarios));
localStorage.setItem("medispa-epv-pro-theme", theme);
});

function collectSnapshot() {
return {
serviceLines,
clinicalLaborPct,
marketingPct,
adminPct,
rentAnnual,
medDirectorAnnual,
insuranceAnnual,
softwareAnnual,
utilitiesAnnual,
otherOpexPct,
locations,
sgnaSynergyPct,
marketingSynergyPct,
minAdminPctFactor,
msoFeePct,
complianceOverheadPct,
laborMarketAdj,
ownerAddBack,
otherAddBack,
daAnnual,
capexMode,
maintenanceCapexPct,
maintenanceCapexAmount,
equipReplacementYears,
buildoutRefreshYears,
ffneRefreshYears,
minorMaintPct,
dsoDays,
dsiDays,
dpoDays,
cashNonOperating,
debtInterestBearing,
taxRate,
rfRate,
erp,
beta,
capmMode,
betaUnlevered,
targetDE,
sizePrem,
specificPrem,
costDebt,
targetDebtWeight,
epvMethod,
recoMethod,
buildoutImprovements,
equipmentDevices,
ffne,
startupIntangibles,
brandRebuild,
trainingCostPerProvider,
membershipCAC,
otherRepro,
enableCapacity,
numRooms,
hoursPerDay,
daysPerWeek,
roomUtilization,
providers,
scenario,
riskEarningsHaircut,
riskWaccPremium,
mcRuns,
lboYears,
entryEvOverride,
entryDebtPct,
exitMultipleMode,
transCostsPct,
exitCostsPct,
};
}

function applySnapshot(s: any) {
try {
if (!s) return;
if (s.serviceLines) setServiceLines(s.serviceLines);
if (s.clinicalLaborPct !== undefined) setClinicalLaborPct(s.clinicalLaborPct);
if (s.marketingPct !== undefined) setMarketingPct(s.marketingPct);
if (s.adminPct !== undefined) setAdminPct(s.adminPct);
if (s.rentAnnual !== undefined) setRentAnnual(s.rentAnnual);
if (s.medDirectorAnnual !== undefined) setMedDirectorAnnual(s.medDirectorAnnual);
if (s.insuranceAnnual !== undefined) setInsuranceAnnual(s.insuranceAnnual);
if (s.softwareAnnual !== undefined) setSoftwareAnnual(s.softwareAnnual);
if (s.utilitiesAnnual !== undefined) setUtilitiesAnnual(s.utilitiesAnnual);
if (s.otherOpexPct !== undefined) setOtherOpexPct(s.otherOpexPct);
if (s.locations !== undefined) setLocations(s.locations);
if (s.sgnaSynergyPct !== undefined) setSgnaSynergyPct(s.sgnaSynergyPct);
if (s.marketingSynergyPct !== undefined) setMarketingSynergyPct(s.marketingSynergyPct);
if (s.minAdminPctFactor !== undefined) setMinAdminPctFactor(s.minAdminPctFactor);
if (s.msoFeePct !== undefined) setMsoFeePct(s.msoFeePct);
if (s.complianceOverheadPct !== undefined) setComplianceOverheadPct(s.complianceOverheadPct);
if (s.laborMarketAdj !== undefined) setLaborMarketAdj(s.laborMarketAdj);
if (s.ownerAddBack !== undefined) setOwnerAddBack(s.ownerAddBack);
if (s.otherAddBack !== undefined) setOtherAddBack(s.otherAddBack);
if (s.daAnnual !== undefined) setDaAnnual(s.daAnnual);
if (s.capexMode) setCapexMode(s.capexMode);
if (s.maintenanceCapexPct !== undefined) setMaintenanceCapexPct(s.maintenanceCapexPct);
if (s.maintenanceCapexAmount !== undefined) setMaintenanceCapexAmount(s.maintenanceCapexAmount);
if (s.equipReplacementYears !== undefined) setEquipReplacementYears(s.equipReplacementYears);
if (s.buildoutRefreshYears !== undefined) setBuildoutRefreshYears(s.buildoutRefreshYears);
if (s.ffneRefreshYears !== undefined) setFfneRefreshYears(s.ffneRefreshYears);
if (s.minorMaintPct !== undefined) setMinorMaintPct(s.minorMaintPct);
if (s.dsoDays !== undefined) setDsoDays(s.dsoDays);
if (s.dsiDays !== undefined) setDsiDays(s.dsiDays);
if (s.dpoDays !== undefined) setDpoDays(s.dpoDays);
if (s.cashNonOperating !== undefined) setCashNonOperating(s.cashNonOperating);
if (s.debtInterestBearing !== undefined) setDebtInterestBearing(s.debtInterestBearing);
if (s.taxRate !== undefined) setTaxRate(s.taxRate);
if (s.rfRate !== undefined) setRfRate(s.rfRate);
if (s.erp !== undefined) setErp(s.erp);
if (s.beta !== undefined) setBeta(s.beta);
if (s.capmMode) setCapmMode(s.capmMode);
if (s.betaUnlevered !== undefined) setBetaUnlevered(s.betaUnlevered);
if (s.targetDE !== undefined) setTargetDE(s.targetDE);
if (s.sizePrem !== undefined) setSizePrem(s.sizePrem);
if (s.specificPrem !== undefined) setSpecificPrem(s.specificPrem);
if (s.costDebt !== undefined) setCostDebt(s.costDebt);
if (s.targetDebtWeight !== undefined) setTargetDebtWeight(s.targetDebtWeight);
if (s.epvMethod) setEpvMethod(s.epvMethod);
if (s.recoMethod) setRecoMethod(s.recoMethod);
if (s.buildoutImprovements !== undefined) setBuildoutImprovements(s.buildoutImprovements);
if (s.equipmentDevices !== undefined) setEquipmentDevices(s.equipmentDevices);
if (s.ffne !== undefined) setFfne(s.ffne);
if (s.startupIntangibles !== undefined) setStartupIntangibles(s.startupIntangibles);
if (s.brandRebuild !== undefined) setBrandRebuild(s.brandRebuild);
if (s.trainingCostPerProvider !== undefined) setTrainingCostPerProvider(s.trainingCostPerProvider);
if (s.membershipCAC !== undefined) setMembershipCAC(s.membershipCAC);
if (s.otherRepro !== undefined) setOtherRepro(s.otherRepro);
if (s.enableCapacity !== undefined) setEnableCapacity(s.enableCapacity);
if (s.numRooms !== undefined) setNumRooms(s.numRooms);
if (s.hoursPerDay !== undefined) setHoursPerDay(s.hoursPerDay);
if (s.daysPerWeek !== undefined) setDaysPerWeek(s.daysPerWeek);
if (s.roomUtilization !== undefined) setRoomUtilization(s.roomUtilization);
if (s.providers) setProviders(s.providers);
if (s.scenario) setScenario(s.scenario);
if (s.riskEarningsHaircut !== undefined) setRiskEarningsHaircut(s.riskEarningsHaircut);
if (s.riskWaccPremium !== undefined) setRiskWaccPremium(s.riskWaccPremium);
if (s.mcRuns !== undefined) setMcRuns(s.mcRuns);
if (s.lboYears !== undefined) setLboYears(s.lboYears);
if (s.entryEvOverride !== undefined) setEntryEvOverride(s.entryEvOverride);
if (s.entryDebtPct !== undefined) setEntryDebtPct(s.entryDebtPct);
if (s.exitMultipleMode) setExitMultipleMode(s.exitMultipleMode);
if (s.transCostsPct !== undefined) setTransCostsPct(s.transCostsPct);
if (s.exitCostsPct !== undefined) setExitCostsPct(s.exitCostsPct);
} catch {}
}

function resetDefaults() {
applySnapshot(null);
setServiceLines([
{ id: "inj", name: "Injectables", price: 575, volume: 2200, cogsPct: 0.28, kind: "service", visitUnits: 1.0 },
{ id: "laser", name: "Laser / Devices", price: 350, volume: 1800, cogsPct: 0.10, kind: "service", visitUnits: 1.0 },
{ id: "aesth", name: "Aesthetics / Facials", price: 200, volume: 1200, cogsPct: 0.15, kind: "service", visitUnits: 1.0 },
{ id: "retail", name: "Retail / Skincare", price: 90, volume: 3000, cogsPct: 0.55, kind: "retail", visitUnits: 0 },
{ id: "memb", name: "Memberships (annual)", price: 1188, volume: 400, cogsPct: 0.05, kind: "service", visitUnits: 0.3, isMembership: true },
{ id: "other", name: "Other", price: 150, volume: 400, cogsPct: 0.10, kind: "service", visitUnits: 1.0 },
]);
setClinicalLaborPct(0.28);
setMarketingPct(0.08);
setAdminPct(0.12);
setRentAnnual(156000);
setMedDirectorAnnual(36000);
setInsuranceAnnual(18000);
setSoftwareAnnual(24000);
setUtilitiesAnnual(18000);
setOtherOpexPct(0.02);
setLocations(1);
setSgnaSynergyPct(0.1);
setMarketingSynergyPct(0.05);
setMinAdminPctFactor(0.5);
setMsoFeePct(0.05);
setComplianceOverheadPct(0.005);
setLaborMarketAdj(1.0);
setOwnerAddBack(120000);
setOtherAddBack(0);
setDaAnnual(80000);
setCapexMode("model");
setMaintenanceCapexPct(0.04);
setMaintenanceCapexAmount(120000);
setEquipReplacementYears(6);
setBuildoutRefreshYears(10);
setFfneRefreshYears(7);
setMinorMaintPct(0.01);
setDsoDays(5);
setDsiDays(40);
setDpoDays(30);
setCashNonOperating(200000);
setDebtInterestBearing(1200000);
setTaxRate(0.25);
setRfRate(0.042);
setErp(0.055);
setBeta(1.1);
setCapmMode("advanced");
setBetaUnlevered(0.7);
setTargetDE(0.6);
setSizePrem(0.02);
setSpecificPrem(0);
setCostDebt(0.085);
setTargetDebtWeight(0.35);
setEpvMethod("Owner Earnings");
setRecoMethod("EPV Only");
setBuildoutImprovements(700000);
setEquipmentDevices(500000);
setFfne(150000);
setStartupIntangibles(120000);
setBrandRebuild(50000);
setTrainingCostPerProvider(5000);
setMembershipCAC(120);
setOtherRepro(0);
setEnableCapacity(false);
setNumRooms(8);
setHoursPerDay(9);
setDaysPerWeek(6);
setRoomUtilization(0.85);
setProviders([
{ id: "inj", name: "Injectors", fte: 4, hoursPerWeek: 35, apptsPerHour: 1.0, utilization: 0.85 },
{ id: "aest", name: "Aestheticians", fte: 3, hoursPerWeek: 35, apptsPerHour: 1.2, utilization: 0.8 },
]);
setScenario("Base");
setRiskEarningsHaircut(0);
setRiskWaccPremium(0);
setMcRuns(700);
setLboYears(5);
setEntryEvOverride(null);
setEntryDebtPct(0.6);
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
return providers.reduce((sum, p) => sum + p.fte _ p.hoursPerWeek _ p.utilization _ p.apptsPerHour, 0) _ 52;
}, [providers]);

const roomSlotsPerLoc = useMemo(() => {
return numRooms _ hoursPerDay _ daysPerWeek _ 52 _ roomUtilization;
}, [numRooms, hoursPerDay, daysPerWeek, roomUtilization]);

const capSlotsPerLoc = useMemo(() => {
if (providerSlotsPerLoc <= 0 || roomSlotsPerLoc <= 0) return 0;
return Math.min(providerSlotsPerLoc, roomSlotsPerLoc);
}, [providerSlotsPerLoc, roomSlotsPerLoc]);

const visitsDemandPerLoc = useMemo(() =>
serviceLines.reduce((s, l) => s + (l.visitUnits ?? 0) \* l.volume, 0),
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
vol: (l.visitUnits ?? 0) > 0 ? l.volume \* scaleForCapacity : l.volume,
}));
}, [serviceLines, scaleForCapacity]);

// ------------- Revenue & costs -------------
const effectiveVolumesOverall = useMemo(() => {
return new Map(effectiveVolumesPerLoc.map((x) => [x.id, x.vol * locations]));
}, [effectiveVolumesPerLoc, locations]);

const revenueByLine = useMemo(() => serviceLines.map(l => l.price _ (effectiveVolumesOverall.get(l.id) ?? (l.volume _ locations))), [serviceLines, effectiveVolumesOverall, locations]);
const totalRevenueBase = useMemo(() => revenueByLine.reduce((a, b) => a + b, 0), [revenueByLine]);
const retailRevenue = useMemo(() => serviceLines.filter(l => l.kind === "retail").reduce((a, l) => a + l.price \* (effectiveVolumesOverall.get(l.id) ?? 0), 0), [serviceLines, effectiveVolumesOverall]);
const serviceRevenue = useMemo(() => totalRevenueBase - retailRevenue, [totalRevenueBase, retailRevenue]);

const totalCOGS = useMemo(() => serviceLines.reduce((sum, l) => sum + l.price _ (effectiveVolumesOverall.get(l.id) ?? 0) _ l.cogsPct, 0), [serviceLines, effectiveVolumesOverall]);
const clinicalLaborPctEff = useMemo(() => clamp(clinicalLaborPct _ laborMarketAdj, 0, 0.8), [clinicalLaborPct, laborMarketAdj]);
const clinicalLaborCost = useMemo(() => clinicalLaborPctEff _ serviceRevenue, [clinicalLaborPctEff, serviceRevenue]);

const grossProfit = useMemo(() => totalRevenueBase - totalCOGS - clinicalLaborCost, [totalRevenueBase, totalCOGS, clinicalLaborCost]);

const adminPctEff = useMemo(() => {
const reduction = Math.max(0, (locations - 1) _ sgnaSynergyPct);
// Allow more flexible minimum admin percentage, especially for large chains
const minFactor = clamp(minAdminPctFactor, 0.1, 1);
return Math.max(adminPct _ minFactor, adminPct \* (1 - Math.min(0.7, reduction)));
}, [adminPct, locations, sgnaSynergyPct, minAdminPctFactor]);

const marketingPctEff = useMemo(() => {
const red = Math.max(0, (locations - 1) _ marketingSynergyPct);
return Math.max(0.02, marketingPct _ (1 - Math.min(0.5, red)));
}, [marketingPct, locations, marketingSynergyPct]);

const marketingCost = useMemo(() => marketingPctEff _ totalRevenueBase, [marketingPctEff, totalRevenueBase]);
const adminCost = useMemo(() => adminPctEff _ totalRevenueBase, [adminPctEff, totalRevenueBase]);
const msoFee = useMemo(() => msoFeePct _ totalRevenueBase, [msoFeePct, totalRevenueBase]);
const complianceCost = useMemo(() => complianceOverheadPct _ totalRevenueBase, [complianceOverheadPct, totalRevenueBase]);

const fixedOpex = useMemo(() => (rentAnnual + medDirectorAnnual + insuranceAnnual + softwareAnnual + utilitiesAnnual) _ locations, [rentAnnual, medDirectorAnnual, insuranceAnnual, softwareAnnual, utilitiesAnnual, locations]);
const otherOpexCost = useMemo(() => otherOpexPct _ totalRevenueBase, [otherOpexPct, totalRevenueBase]);

const opexTotal = useMemo(() => marketingCost + adminCost + msoFee + complianceCost + fixedOpex + otherOpexCost, [marketingCost, adminCost, msoFee, complianceCost, fixedOpex, otherOpexCost]);

const ebitdaReported = useMemo(() => grossProfit - opexTotal, [grossProfit, opexTotal]);
const ebitdaNormalized = useMemo(() => ebitdaReported + (ownerAddBack + otherAddBack) _ locations, [ebitdaReported, ownerAddBack, otherAddBack, locations]);
const daTotal = useMemo(() => daAnnual _ locations, [daAnnual, locations]);
const ebitNormalized = useMemo(() => ebitdaNormalized - daTotal, [ebitdaNormalized, daTotal]);
const ebitMargin = useMemo(() => (totalRevenueBase > 0 ? ebitNormalized / totalRevenueBase : 0), [ebitNormalized, totalRevenueBase]);

// Maintenance Capex (model)
const maintCapexModelBase = useMemo(() => {
// Use average annual capex but add validation for replacement years
const devices = equipmentDevices _ locations / Math.max(1, equipReplacementYears || 1);
const buildout = buildoutImprovements _ locations / Math.max(1, buildoutRefreshYears || 1);
const f = ffne _ locations / Math.max(1, ffneRefreshYears || 1);
// Minor maintenance should be separate from equipment replacement to avoid double-counting
const minor = minorMaintPct _ totalRevenueBase;
return devices + buildout + f + minor;
}, [equipmentDevices, locations, equipReplacementYears, buildoutImprovements, buildoutRefreshYears, ffne, ffneRefreshYears, minorMaintPct, totalRevenueBase]);

const maintCapexBase = useMemo(() => {
if (capexMode === "percent") return maintenanceCapexPct _ totalRevenueBase;
if (capexMode === "amount") return maintenanceCapexAmount _ locations;
return maintCapexModelBase;
}, [capexMode, maintenanceCapexPct, totalRevenueBase, maintenanceCapexAmount, locations, maintCapexModelBase]);

// Taxes & earnings
const nopat = useMemo(() => ebitNormalized \* (1 - taxRate), [ebitNormalized, taxRate]);
const ownerEarnings = useMemo(() => nopat + daTotal - maintCapexBase, [nopat, daTotal, maintCapexBase]);
const adjustedEarnings = useMemo(() => (epvMethod === "Owner Earnings" ? ownerEarnings : nopat), [epvMethod, ownerEarnings, nopat]);

// WACC
const targetDEFromWeight = useMemo(() => {
if (targetDebtWeight >= 1) return 99; // Very high leverage case
if (targetDebtWeight <= 0) return 0; // All equity case  
 return targetDebtWeight / (1 - targetDebtWeight);
}, [targetDebtWeight]);
const leveredBetaFromAdvanced = useMemo(() => betaUnlevered _ (1 + (1 - taxRate) _ (targetDE || targetDEFromWeight)), [betaUnlevered, taxRate, targetDE, targetDEFromWeight]);
const betaEff = useMemo(() => (capmMode === "advanced" ? leveredBetaFromAdvanced : beta), [capmMode, leveredBetaFromAdvanced, beta]);
const costEquity = useMemo(() => rfRate + betaEff _ erp + sizePrem + specificPrem, [rfRate, betaEff, erp, sizePrem, specificPrem]);
const afterTaxCostDebt = useMemo(() => costDebt _ (1 - taxRate), [costDebt, taxRate]);
const baseWacc = useMemo(() => clamp(targetDebtWeight _ afterTaxCostDebt + (1 - targetDebtWeight) _ costEquity, 0.02, 0.50), [targetDebtWeight, afterTaxCostDebt, costEquity]);

// Scenario & risk adjusted values
const scenarioWacc = useMemo(() => clamp(baseWacc + scenarioAdj.waccAdj + riskWaccPremium, 0.03, 0.5), [baseWacc, scenarioAdj, riskWaccPremium]);
const totalRevenue = useMemo(() => totalRevenueBase _ scenarioAdj.revenue, [totalRevenueBase, scenarioAdj]);
const ebitScenario = useMemo(() => ebitNormalized _ scenarioAdj.ebitAdj _ scenarioAdj.revenue, [ebitNormalized, scenarioAdj]);
const nopatScenario = useMemo(() => ebitScenario _ (1 - taxRate), [ebitScenario, taxRate]);
const maintCapexScenario = useMemo(() => {
if (capexMode === "percent") return maintenanceCapexPct _ totalRevenue;
if (capexMode === "amount") return maintenanceCapexAmount _ locations;
const devices = equipmentDevices _ locations / Math.max(1, equipReplacementYears);
const buildout = buildoutImprovements _ locations / Math.max(1, buildoutRefreshYears);
const f = ffne _ locations / Math.max(1, ffneRefreshYears);
const minor = minorMaintPct _ totalRevenue;
return devices + buildout + f + minor;
}, [capexMode, maintenanceCapexPct, totalRevenue, maintenanceCapexAmount, locations, equipmentDevices, equipReplacementYears, buildoutImprovements, buildoutRefreshYears, ffne, ffneRefreshYears, minorMaintPct]);

const ownerEarningsScenario = useMemo(() => (nopatScenario + daTotal - maintCapexScenario) _ (1 - riskEarningsHaircut), [nopatScenario, daTotal, maintCapexScenario, riskEarningsHaircut]);
const adjustedEarningsScenario = useMemo(() => (epvMethod === "Owner Earnings" ? ownerEarningsScenario : nopatScenario _ (1 - riskEarningsHaircut)), [epvMethod, ownerEarningsScenario, nopatScenario, riskEarningsHaircut]);

// EPV (Enterprise and Equity)
const enterpriseEPV = useMemo(() => (scenarioWacc > 0 ? adjustedEarningsScenario / scenarioWacc : 0), [adjustedEarningsScenario, scenarioWacc]);
const equityEPV = useMemo(() => enterpriseEPV + cashNonOperating - debtInterestBearing, [enterpriseEPV, cashNonOperating, debtInterestBearing]);

// Reproduction value (Enterprise)
const totalCOGSforWC = useMemo(() => totalCOGS + clinicalLaborCost, [totalCOGS, clinicalLaborCost]);
const ar = useMemo(() => totalRevenue _ (dsoDays / 365), [totalRevenue, dsoDays]);
const inv = useMemo(() => totalCOGSforWC _ (dsiDays / 365), [totalCOGSforWC, dsiDays]);
const ap = useMemo(() => totalCOGSforWC \* (dpoDays / 365), [totalCOGSforWC, dpoDays]);
const nwcRequired = useMemo(() => Math.max(0, ar + inv - ap), [ar, inv, ap]);

// Intangibles for reproduction
const providersFteTotal = useMemo(() => providers.reduce((s, p) => s + p.fte, 0) _ locations, [providers, locations]);
const membershipUnits = useMemo(() => serviceLines.filter(l => l.isMembership).reduce((s, l) => s + (effectiveVolumesOverall.get(l.id) ?? 0), 0), [serviceLines, effectiveVolumesOverall]);
const intangiblesRebuild = useMemo(() => startupIntangibles + brandRebuild + trainingCostPerProvider _ providersFteTotal + membershipCAC \* membershipUnits, [startupIntangibles, brandRebuild, trainingCostPerProvider, providersFteTotal, membershipCAC, membershipUnits]);

const enterpriseRepro = useMemo(() => buildoutImprovements _ locations + equipmentDevices _ locations + ffne \* locations + intangiblesRebuild + otherRepro + nwcRequired, [buildoutImprovements, equipmentDevices, ffne, intangiblesRebuild, otherRepro, nwcRequired, locations]);
const equityRepro = useMemo(() => enterpriseRepro + cashNonOperating - debtInterestBearing, [enterpriseRepro, cashNonOperating, debtInterestBearing]);
const franchiseRatio = useMemo(() => (enterpriseRepro > 0 ? enterpriseEPV / enterpriseRepro : 0), [enterpriseEPV, enterpriseRepro]);

const recommendedEquity = useMemo(() => {
switch (recoMethod) {
case "EPV Only":
return equityEPV;
case "Asset Reproduction":
return equityRepro;
case "Conservative: Min":
return Math.min(equityEPV, equityRepro);
case "Opportunistic: Max":
return Math.max(equityEPV, equityRepro);
case "Blend: 70% EPV / 30% Asset":
return 0.7 _ equityEPV + 0.3 _ equityRepro;
default:
return equityEPV;
}
}, [recoMethod, equityEPV, equityRepro]);

const evToRevenue = useMemo(() => (totalRevenue > 0 ? enterpriseEPV / totalRevenue : 0), [enterpriseEPV, totalRevenue]);
const evToEbitda = useMemo(() => (ebitdaNormalized > 0 ? enterpriseEPV / ebitdaNormalized : 0), [enterpriseEPV, ebitdaNormalized]);

// Sensitivity table (WACC x EBIT margin)
const waccRange = useMemo(() => {
const base = scenarioWacc;
const arr: number[] = [];
for (let i = -3; i <= 3; i++) arr.push(clamp(base + i \* 0.01, 0.03, 0.5));
return arr;
}, [scenarioWacc]);

const ebitMarginRange = useMemo(() => {
const base = ebitMargin;
const arr: number[] = [];
for (let i = -2; i <= 2; i++) arr.push(clamp(base + i \* 0.02, 0, 0.6));
return arr;
}, [ebitMargin]);

function epvAt(ebitMarginGuess: number, waccGuess: number) {
const ebitGuess = totalRevenue _ ebitMarginGuess;
const nopatGuess = ebitGuess _ (1 - taxRate);
let maint = 0;
if (capexMode === "percent") maint = maintenanceCapexPct _ totalRevenue;
else if (capexMode === "amount") maint = maintenanceCapexAmount _ locations;
else maint = (equipmentDevices _ locations / Math.max(1, equipReplacementYears)) + (buildoutImprovements _ locations / Math.max(1, buildoutRefreshYears)) + (ffne _ locations / Math.max(1, ffneRefreshYears)) + minorMaintPct _ totalRevenue;
const adj = epvMethod === "Owner Earnings" ? (nopatGuess + daTotal - maint) _ (1 - riskEarningsHaircut) : nopatGuess _ (1 - riskEarningsHaircut);
const ev = waccGuess > 0 ? adj / waccGuess : 0;
return ev + cashNonOperating - debtInterestBearing;
}

// ------------- Monte Carlo -------------
function runMonteCarlo() {
const runs = clamp(Math.floor(mcRuns), 100, 8000);
const evs: number[] = [];
const eqs: number[] = [];
for (let i = 0; i < runs; i++) {
const wacc = clamp(normalRand(scenarioWacc, 0.01), 0.03, 0.5);
const rev = Math.max(0, normalRand(totalRevenue, totalRevenue _ 0.05));
const ebitM = clamp(normalRand(ebitMargin, 0.02), 0, 0.6);
const ebit = rev _ ebitM;
const nop = ebit _ (1 - taxRate);
let maint = 0;
if (capexMode === "percent") maint = clamp(normalRand(maintenanceCapexPct, 0.01), 0, 0.2) _ rev;
else if (capexMode === "amount") maint = maintenanceCapexAmount _ locations;
else maint = (equipmentDevices _ locations / Math.max(1, equipReplacementYears)) + (buildoutImprovements _ locations / Math.max(1, buildoutRefreshYears)) + (ffne _ locations / Math.max(1, ffneRefreshYears)) + minorMaintPct _ rev;
const adj = epvMethod === "Owner Earnings" ? (nop + daTotal - maint) _ (1 - riskEarningsHaircut) : nop \* (1 - riskEarningsHaircut);
const ev = wacc > 0 ? adj / wacc : 0;
const eq = ev + cashNonOperating - debtInterestBearing;
evs.push(ev);
eqs.push(eq);
}
evs.sort((a, b) => a - b);
eqs.sort((a, b) => a - b);
setMcStats({
mean: evs.reduce((a, b) => a + b, 0) / evs.length,
median: percentile(evs, 0.5),
p5: percentile(evs, 0.05),
p95: percentile(evs, 0.95),
meanEquity: eqs.reduce((a, b) => a + b, 0) / eqs.length,
p5Equity: percentile(eqs, 0.05),
p95Equity: percentile(eqs, 0.95),
});
}

// ------------- LBO quick check -------------
const entryEVBase = useMemo(() => (entryEvOverride !== null ? entryEvOverride : enterpriseEPV), [entryEvOverride, enterpriseEPV]);
const entryEV = useMemo(() => entryEVBase _ (1 + transCostsPct), [entryEVBase, transCostsPct]);
const entryDebt = useMemo(() => clamp(entryDebtPct, 0, 0.9) _ entryEV, [entryDebtPct, entryEV]);
const entryEquity = useMemo(() => Math.max(0, entryEV - entryDebt), [entryEV, entryDebt]);
const lboExitEV = useMemo(() => (exitMultipleMode === "EPV" ? enterpriseEPV : entryEVBase) \* (1 - exitCostsPct), [exitMultipleMode, enterpriseEPV, entryEVBase, exitCostsPct]);

const lboSim = useMemo(() => {
const years = clamp(lboYears, 1, 10);
let debt = entryDebt;
const kd = costDebt;
for (let y = 0; y < years; y++) {
const interest = debt \* kd;
const fcfToFirm = adjustedEarningsScenario; // constant EPV framework
const afterInterest = fcfToFirm - interest;
const principalPaydown = Math.max(0, afterInterest);
debt = Math.max(0, debt - principalPaydown);
}
const exitEquity = Math.max(0, lboExitEV - debt);
const moic = entryEquity > 0 ? exitEquity / entryEquity : 0;
const irr = entryEquity > 0 ? Math.pow(moic, 1 / years) - 1 : 0;
return { exitDebt: debt, exitEquity, moic, irr };
}, [lboYears, entryDebt, adjustedEarningsScenario, costDebt, lboExitEV, entryEquity]);

// ------------- Scenario management -------------
function saveScenario() {
const name = scenarioName.trim() || `Scenario ${savedScenarios.length + 1}`;
const id = uid();
const snapshot = collectSnapshot();
const next = [...savedScenarios, { id, name, snapshot }];
setSavedScenarios(next);
setScenarioName("");
pushLog({ kind: "success", text: `Saved scenario: ${name}` });
}
function applyScenario(idOrName: string) {
const sc = savedScenarios.find(s => s.id === idOrName || s.name === idOrName);
if (sc) { applySnapshot(sc.snapshot); pushLog({ kind: "success", text: `Applied scenario: ${sc.name}` }); }
else pushLog({ kind: "error", text: `Scenario not found: ${idOrName}` });
}
function deleteScenario(id: string) {
const sc = savedScenarios.find(s => s.id === id);
setSavedScenarios(savedScenarios.filter(s => s.id !== id));
pushLog({ kind: "info", text: `Deleted scenario: ${sc?.name ?? id}` });
}

// ------------- Hotkeys -------------
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
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [tabs]);

// ------------- CLI -------------
function pushLog(m: Omit<CliMsg, "ts">) {
setCliLog((prev) => [...prev, { ts: Date.now(), ...m }]);
}

useEffect(() => {
if (!logRef.current) return;
logRef.current.scrollTop = logRef.current.scrollHeight;
}, [cliLog]);

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
inputs: "inputs", capacity: "capacity", model: "model", valuation: "valuation", sensitivity: "analytics", analytics: "analytics", montecarlo: "montecarlo", lbo: "lbo", data: "data", notes: "notes",
};
const dest = map[t];
if (dest) { setActiveTab(dest); pushLog({ kind: "success", text: `Navigated to: ${t}` }); }
else pushLog({ kind: "error", text: `Unknown tab: ${t}` });
break;
}
case "scenario": {
const v = tokens[1];
const val = v === "bull" ? "Bull" : v === "bear" ? "Bear" : "Base";
setScenario(val);
pushLog({ kind: "success", text: `Scenario: ${val}` });
break;
}
case "locations": {
const n = parseInt(tokens[1]);
if (isNaN(n) || n < 1) return pushLog({ kind: "error", text: "Usage: locations <n>" });
setLocations(n);
pushLog({ kind: "success", text: `Locations set to ${n}` });
break;
}
case "method": {
const m = tokens[1];
if (m === "owner") setEpvMethod("Owner Earnings");
else if (m === "nopat") setEpvMethod("NOPAT (EBIT-based)");
else return pushLog({ kind: "error", text: "Usage: method <owner|nopat>" });
pushLog({ kind: "success", text: `Method set: ${m}` });
break;
}
case "reco": {
const m = tokens[1];
const map: Record<string, RecommendedMethod> = {
epv: "EPV Only", asset: "Asset Reproduction", min: "Conservative: Min", max: "Opportunistic: Max", blend: "Blend: 70% EPV / 30% Asset",
};
const r = map[m];
if (!r) return pushLog({ kind: "error", text: "Usage: reco <epv|asset|min|max|blend>" });
setRecoMethod(r);
pushLog({ kind: "success", text: `Recommendation set: ${r}` });
break;
}
case "capex": {
const mode = tokens[1];
if (mode === "model") setCapexMode("model");
else if (mode === "percent") { setCapexMode("percent"); const v = tokens[2]; if (v) { const n = parsePercentOrNumber(v); if (n !== null) setMaintenanceCapexPct(n); } }
else if (mode === "amount") { setCapexMode("amount"); const v = tokens[2]; if (v) { const n = parseDollars(v); if (n !== null) setMaintenanceCapexAmount(n); } }
else return pushLog({ kind: "error", text: "Usage: capex <model|percent|amount> [value]" });
pushLog({ kind: "success", text: `Capex mode: ${mode}` });
break;
}
case "capacity": {
const v = tokens[1];
setEnableCapacity(v === "on");
pushLog({ kind: "success", text: `Capacity ${v === "on" ? "enabled" : "disabled"}` });
break;
}
case "mc": {
const n = parseInt(tokens[1]);
if (isNaN(n) || n < 100) return pushLog({ kind: "error", text: "Usage: mc <runs> (>=100)" });
setMcRuns(n);
runMonteCarlo();
pushLog({ kind: "success", text: `Monte Carlo run: ${n}` });
break;
}
case "save": {
const name = line.slice(line.toLowerCase().indexOf("save") + 4).trim().replace(/^\"|\"$/g, "");
          if (!name) return pushLog({ kind: "error", text: "Usage: save <name>" });
          setScenarioName(name);
          saveScenario();
          break;
        }
        case "apply": {
          const nameOrIndex = line.slice(line.toLowerCase().indexOf("apply") + 5).trim().replace(/^\"|\"$/g, "");
if (!nameOrIndex) return pushLog({ kind: "error", text: "Usage: apply <name|#>" });
const idx = parseInt(nameOrIndex);
if (!isNaN(idx)) {
const s = savedScenarios[idx - 1];
if (s) applyScenario(s.id); else pushLog({ kind: "error", text: `No scenario at index ${idx}` });
} else {
applyScenario(nameOrIndex);
}
break;
}
case "export": {
const json = JSON.stringify(collectSnapshot(), null, 2);
setJsonText(json);
setActiveTab("data");
try { navigator.clipboard.writeText(json); pushLog({ kind: "success", text: "Exported JSON copied to clipboard." }); } catch { pushLog({ kind: "info", text: "JSON ready in Data tab." }); }
break;
}
case "import": {
try {
const obj = JSON.parse(jsonText || "{}");
applySnapshot(obj);
pushLog({ kind: "success", text: "Imported JSON from Data tab textarea." });
} catch {
pushLog({ kind: "error", text: "Invalid JSON in Data tab textarea." });
}
break;
}
case "reset": {
resetDefaults();
pushLog({ kind: "success", text: "Reset to defaults." });
break;
}
case "set": {
// set <field> <value>
const field = tokens[1];
const valueRaw = tokens[2];
if (!field || valueRaw === undefined) return pushLog({ kind: "error", text: "Usage: set <field> <value>" });
const setMap: Record<string, (n: number) => void> = {
marketing: (n) => setMarketingPct(n),
admin: (n) => setAdminPct(n),
labor: (n) => setClinicalLaborPct(n),
rent: (n) => setRentAnnual(n),
tax: (n) => setTaxRate(n),
rf: (n) => setRfRate(n),
erp: (n) => setErp(n),
beta: (n) => setBeta(n),
size: (n) => setSizePrem(n),
specific: (n) => setSpecificPrem(n),
costdebt: (n) => setCostDebt(n),
debtw: (n) => setTargetDebtWeight(n),
waccd: (n) => setTargetDebtWeight(n),
msofee: (n) => setMsoFeePct(n),
compliance: (n) => setComplianceOverheadPct(n),
};
let n: number | null = null;
if (["rent"].includes(field)) n = parseDollars(valueRaw);
else n = parsePercentOrNumber(valueRaw);
if (n === null) return pushLog({ kind: "error", text: "Could not parse value. Use % or $ where applicable." });
const fn = setMap[field];
if (!fn) return pushLog({ kind: "error", text: `Unknown field: ${field}` });
fn(n);
pushLog({ kind: "success", text: `Set ${field} to ${valueRaw}` });
break;
}
case "add": {
// add line name=... price=... volume=... cogs=... kind=service|retail visit=... membership=true|false
if (tokens[1] !== "line") return pushLog({ kind: "error", text: "Usage: add line name=... price=... volume=... cogs=... kind=... visit=..." });
const argStr = line.slice(line.toLowerCase().indexOf("line") + 4);
const parts = argStr.split(/\s+/);
const args: Record<string, string> = {};
parts.forEach(p => { const [k, v] = p.split("="); if (k && v !== undefined) args[k.toLowerCase()] = v.replace(/^\"|\"$/g, ""); });
const nl: ServiceLine = {
id: uid(),
name: args.name || "New Line",
price: parseFloat(args.price) || 100,
volume: parseFloat(args.volume) || 100,
cogsPct: args.cogs?.endsWith("%") ? parseFloat(args.cogs) / 100 : (parseFloat(args.cogs) || 0.1),
kind: (args.kind === "retail" ? "retail" : "service"),
visitUnits: parseFloat(args.visit) || 1,
isMembership: args.membership === "true" ? true : args.membership === "false" ? false : undefined,
};
setServiceLines([...serviceLines, nl]);
pushLog({ kind: "success", text: `Added line: ${nl.name}` });
break;
}
case "del": {
if (tokens[1] !== "line") return pushLog({ kind: "error", text: "Usage: del line <index|id>" });
const key = tokens[2];
if (!key) return pushLog({ kind: "error", text: "Usage: del line <index|id>" });
let idx = parseInt(key);
let copy = [...serviceLines];
if (isNaN(idx)) {
copy = copy.filter(l => l.id !== key);
} else {
if (idx > 0 && idx <= copy.length) copy.splice(idx - 1, 1);
}
setServiceLines(copy);
pushLog({ kind: "success", text: `Deleted line: ${key}` });
break;
}
default: {
pushLog({ kind: "error", text: `Unknown command: ${first}. Try 'help'.` });
}
}
} catch (e) {
pushLog({ kind: "error", text: `Error executing command.` });
}
}

function onCliSubmit(e: React.FormEvent) {
e.preventDefault();
const line = cliInput;
setCliInput("");
exec(line);
}

// ------------- UI helpers -------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
return (
<div className={cx("rounded-xl p-6 mb-6 shadow-sm", theme === "dark" ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200") }>
<div className="flex items-center justify-between mb-4">
<h2 className={cx("text-sm font-semibold tracking-wide", theme === "dark" ? "text-slate-100" : "text-slate-800")}>{title}</h2>
<span className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>EPV•Pro</span>
</div>
{children}
</div>
);
}

function LabeledNumber({ label, value, onChange, step = 1, min, max, suffix, prefix, help }: {
label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string; prefix?: string; help?: string;
}) {
return (
<label className="flex flex-col gap-1 text-sm">
<span className={cx("flex items-center justify-between", theme === "dark" ? "text-slate-300" : "text-slate-700") }>
<span>{label}</span>
{help ? <span className={cx(theme === "dark" ? "text-slate-500" : "text-slate-400")}>{help}</span> : null}
</span>
<div className={cx("flex items-center rounded-lg px-3 py-2", theme === "dark" ? "border border-slate-700 bg-slate-800" : "border border-slate-300 bg-white") }>
{prefix ? <span className={cx("mr-2", theme === "dark" ? "text-slate-400" : "text-slate-500")}>{prefix}</span> : null}
<input
type="number"
className={cx("w-full outline-none", theme === "dark" ? "bg-transparent text-slate-100" : "text-slate-900")}
value={Number.isFinite(value) ? value : 0}
step={step}
min={min}
max={max}
onChange={(e) => onChange(Number(e.target.value))}
/>
{suffix ? <span className={cx("ml-2", theme === "dark" ? "text-slate-400" : "text-slate-500")}>{suffix}</span> : null}
</div>
</label>
);
}

function PercentField(p: { label: string; value: number; onChange: (v: number) => void; step?: number; help?: string }) {
return <LabeledNumber label={p.label} value={+(p.value \* 100).toFixed(4)} onChange={(v) => p.onChange(v / 100)} step={p.step ?? 0.1} suffix="%" help={p.help} />;
}
function DollarsField(p: { label: string; value: number; onChange: (v: number) => void; step?: number; help?: string }) {
return <LabeledNumber label={p.label} value={p.value} onChange={p.onChange} step={p.step ?? 1000} prefix="$" help={p.help} />;
}

function Btn({ children, onClick, active, tone = "neutral" }: { children: React.ReactNode; onClick?: () => void; active?: boolean; tone?: "neutral" | "primary" | "success" | "danger" }) {
const tones: Record<string, string> = {
neutral: theme === "dark" ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200" : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700",
primary: theme === "dark" ? "border-indigo-600 bg-indigo-600 hover:bg-indigo-500 text-white" : "border-indigo-600 bg-indigo-600 hover:bg-indigo-500 text-white",
success: theme === "dark" ? "border-emerald-600 bg-emerald-600 hover:bg-emerald-500 text-white" : "border-emerald-600 bg-emerald-600 hover:bg-emerald-500 text-white",
danger: theme === "dark" ? "border-rose-600 bg-rose-600 hover:bg-rose-500 text-white" : "border-rose-600 bg-rose-600 hover:bg-rose-500 text-white",
};
const toneCls = active ? tones.primary : tones[tone];
return (
<button onClick={onClick} className={cx("px-3 py-2 rounded-lg border text-sm", toneCls)}>
{children}
</button>
);
}

// ------------- Render -------------
return (
<div className={cx("min-h-screen", theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900", "font-mono") }>
<div className="max-w-7xl mx-auto px-6 py-6">
{/_ Status bar _/}
<div className={cx("w-full rounded-lg mb-4 border flex items-center justify-between px-4 py-3", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
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
        <div className={cx("rounded-xl mb-6 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
          <div className={cx("px-4 py-2 text-xs border-b", theme === "dark" ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500")}>Console</div>
          <div ref={logRef} className={cx("px-4 h-40 overflow-auto text-sm", theme === "dark" ? "text-slate-200" : "text-slate-800") }>
            {cliLog.map((m, i) => (
              <div key={m.ts + "-" + i} className="py-1">
                <span className={cx("mr-2", m.kind === "user" ? "text-indigo-400" : m.kind === "success" ? "text-emerald-400" : m.kind === "error" ? "text-rose-400" : "text-slate-400") }>
                  {m.kind === "user" ? ">" : m.kind.toUpperCase()}
                </span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={onCliSubmit} className={cx("flex items-center gap-2 px-4 py-3 border-t", theme === "dark" ? "border-slate-800" : "border-slate-200") }>
            <span className={cx("text-indigo-400")}>{">"}</span>
            <input
              ref={cliRef}
              className={cx("flex-1 outline-none text-sm", theme === "dark" ? "bg-transparent text-slate-100 placeholder-slate-500" : "bg-transparent text-slate-900 placeholder-slate-500")}
              placeholder="Type a command, e.g., 'go valuation' or 'set marketing 7.5%'"
              value={cliInput}
              onChange={(e) => setCliInput(e.target.value)}
            />
            <Btn tone="primary">Run</Btn>
          </form>
          <div className={cx("flex flex-wrap gap-2 px-4 pb-4", theme === "dark" ? "text-slate-300" : "text-slate-700") }>
            {["help","go inputs","go valuation","scenario bull","set marketing 7.5%","capex model","mc 1200","save CaseA"].map((c) => (
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
          <div className={cx("rounded-xl p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Revenue (scenario)</div>
            <div className="text-xl font-semibold">{fmt0.format(totalRevenue)}</div>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>EBIT margin: {pctFmt(ebitMargin)}</div>
          </div>
          <div className={cx("rounded-xl p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Enterprise EPV</div>
            <div className="text-xl font-semibold text-emerald-400">{fmt0.format(enterpriseEPV)}</div>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>WACC: {pctFmt(scenarioWacc)}</div>
          </div>
          <div className={cx("rounded-xl p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Equity (recommended)</div>
            <div className="text-xl font-semibold text-indigo-400">{fmt0.format(recommendedEquity)}</div>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Method: {recoMethod}</div>
          </div>
          <div className={cx("rounded-xl p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Capacity utilization</div>
            <div className="text-xl font-semibold">{(capUtilization * 100).toFixed(0)}%</div>
            <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Locations: {locations}</div>
          </div>
        </div>

        {activeTab === "inputs" && (
          <>
            <Section title="Revenue Builder (Annual per Location)">
              <div className="overflow-auto">
                <table className={cx("min-w-full text-xs", theme === "dark" ? "text-slate-200" : "text-slate-800") }>
                  <thead>
                    <tr className={cx(theme === "dark" ? "text-slate-400" : "text-slate-600") }>
                      <th className="py-2 pr-4 text-left">Line</th>
                      <th className="py-2 pr-4 text-left">Kind</th>
                      <th className="py-2 pr-4 text-left">Price ($)</th>
                      <th className="py-2 pr-4 text-left">Volume</th>
                      <th className="py-2 pr-4 text-left">COGS %</th>
                      <th className="py-2 pr-4 text-left">Visit units</th>
                      <th className="py-2 pr-4 text-left">Membership?</th>
                      <th className="py-2 pr-4 text-left">Revenue (all locs)</th>
                      <th className="py-2 pr-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceLines.map((l, idx) => (
                      <tr key={l.id} className={cx("border-t", theme === "dark" ? "border-slate-800" : "border-slate-200") }>
                        <td className="py-2 pr-4">
                          <input
                            className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")}
                            value={l.name}
                            onChange={(e) => {
                              const copy = [...serviceLines];
                              copy[idx] = { ...l, name: e.target.value };
                              setServiceLines(copy);
                            }}
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <select
                            className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")}
                            value={l.kind}
                            onChange={(e) => {
                              const copy = [...serviceLines];
                              copy[idx] = { ...l, kind: e.target.value as ServiceLine["kind"] };
                              setServiceLines(copy);
                            }}
                          >
                            <option value="service">Service</option>
                            <option value="retail">Retail</option>
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")}
                            value={l.price}
                            step={1}
                            onChange={(e) => {
                              const copy = [...serviceLines];
                              copy[idx] = { ...l, price: Number(e.target.value) };
                              setServiceLines(copy);
                            }}
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")}
                            value={l.volume}
                            step={1}
                            onChange={(e) => {
                              const copy = [...serviceLines];
                              copy[idx] = { ...l, volume: Number(e.target.value) };
                              setServiceLines(copy);
                            }}
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")}
                            value={+(l.cogsPct * 100).toFixed(2)}
                            step={0.5}
                            onChange={(e) => {
                              const copy = [...serviceLines];
                              copy[idx] = { ...l, cogsPct: Number(e.target.value) / 100 };
                              setServiceLines(copy);
                            }}
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")}
                            value={l.visitUnits}
                            step={0.1}
                            onChange={(e) => {
                              const copy = [...serviceLines];
                              copy[idx] = { ...l, visitUnits: Number(e.target.value) };
                              setServiceLines(copy);
                            }}
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="checkbox"
                            checked={!!l.isMembership}
                            onChange={(e) => {
                              const copy = [...serviceLines];
                              copy[idx] = { ...l, isMembership: e.target.checked };
                              setServiceLines(copy);
                            }}
                          />
                        </td>
                        <td className="py-2 pr-4">{fmt0.format(l.price * (effectiveVolumesOverall.get(l.id) ?? 0))}</td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-2">
                            <Btn onClick={() => { const copy = [...serviceLines]; copy.splice(idx, 1); setServiceLines(copy); }}>Remove</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>Total Revenue (all locations): <span className="font-semibold">{fmt0.format(totalRevenueBase)}</span></div>
                <div className="flex gap-2">
                  <Btn onClick={() => setLocations(Math.max(1, locations - 1))}>- Location</Btn>
                  <Btn onClick={() => setLocations(locations + 1)}>+ Location</Btn>
                  <Btn tone="primary" onClick={() => { const nid = uid(); setServiceLines([...serviceLines, { id: nid, name: "New Line", price: 100, volume: 100, cogsPct: 0.1, kind: "service", visitUnits: 1 }]); }}>Add Line</Btn>
                </div>
              </div>
            </Section>

            <Section title="Cost Structure & MSO">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PercentField label="Clinical labor % (services)" value={clinicalLaborPct} onChange={setClinicalLaborPct} help="Commission + provider wages" />
                <PercentField label="Labor market factor" value={laborMarketAdj} onChange={setLaborMarketAdj} help="Regional wage adjustment" />
                <PercentField label="Marketing % of revenue" value={marketingPct} onChange={setMarketingPct} />
                <PercentField label="Admin wages % of revenue" value={adminPct} onChange={setAdminPct} />
                <PercentField label="MSO fee % of revenue" value={msoFeePct} onChange={setMsoFeePct} />
                <PercentField label="Compliance overhead % of revenue" value={complianceOverheadPct} onChange={setComplianceOverheadPct} />
                <DollarsField label="Rent (annual, per location)" value={rentAnnual} onChange={setRentAnnual} />
                <DollarsField label="Medical director (per location)" value={medDirectorAnnual} onChange={setMedDirectorAnnual} />
                <DollarsField label="Insurance (per location)" value={insuranceAnnual} onChange={setInsuranceAnnual} />
                <DollarsField label="Software (per location)" value={softwareAnnual} onChange={setSoftwareAnnual} />
                <DollarsField label="Utilities (per location)" value={utilitiesAnnual} onChange={setUtilitiesAnnual} />
                <PercentField label="Other opex % of revenue" value={otherOpexPct} onChange={setOtherOpexPct} />
              </div>
              <div className={cx("mt-4 rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                <div className={cx("text-sm mb-2", theme === "dark" ? "text-slate-300" : "text-slate-700")}>Roll-up synergies</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <LabeledNumber label="Locations" value={locations} onChange={setLocations} step={1} min={1} />
                  <PercentField label="Admin synergy per extra loc" value={sgnaSynergyPct} onChange={setSgnaSynergyPct} />
                  <PercentField label="Marketing synergy per extra loc" value={marketingSynergyPct} onChange={setMarketingSynergyPct} />
                  <PercentField label="Admin % floor factor" value={minAdminPctFactor} onChange={setMinAdminPctFactor} help="E.g., 50% floor" />
                </div>
              </div>
            </Section>

            <Section title="Normalizations & Capital Intensity">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DollarsField label="Owner add-backs (per loc)" value={ownerAddBack} onChange={setOwnerAddBack} />
                <DollarsField label="Other add-backs (per loc)" value={otherAddBack} onChange={setOtherAddBack} />
                <DollarsField label="D&A (per loc)" value={daAnnual} onChange={setDaAnnual} />
                <div className="flex flex-col gap-2">
                  <span className={cx("text-sm", theme === "dark" ? "text-slate-300" : "text-slate-700")}>Maintenance capex mode</span>
                  <div className="flex gap-2 flex-wrap">
                    {["model","percent","amount"].map((m) => (
                      <Btn key={m} onClick={() => setCapexMode(m as any)} active={capexMode === (m as any)}>{m}</Btn>
                    ))}
                  </div>
                </div>
                {capexMode === "percent" && <PercentField label="Maintenance capex % of revenue" value={maintenanceCapexPct} onChange={setMaintenanceCapexPct} />}
                {capexMode === "amount" && <DollarsField label="Maintenance capex (per loc)" value={maintenanceCapexAmount} onChange={setMaintenanceCapexAmount} />}
              </div>
              {capexMode === "model" && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <LabeledNumber label="Device replacement (yrs)" value={equipReplacementYears} onChange={setEquipReplacementYears} step={1} />
                  <LabeledNumber label="Buildout refresh (yrs)" value={buildoutRefreshYears} onChange={setBuildoutRefreshYears} step={1} />
                  <LabeledNumber label="FF&E refresh (yrs)" value={ffneRefreshYears} onChange={setFfneRefreshYears} step={1} />
                  <PercentField label="Minor maint % of revenue" value={minorMaintPct} onChange={setMinorMaintPct} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <PercentField label="Effective tax rate" value={taxRate} onChange={setTaxRate} />
              </div>
            </Section>

            <Section title="Capital & WACC">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DollarsField label="Cash & equivalents (non-operating)" value={cashNonOperating} onChange={setCashNonOperating} />
                <DollarsField label="Interest-bearing debt" value={debtInterestBearing} onChange={setDebtInterestBearing} />
                <div className="flex flex-col gap-2">
                  <span className={cx("text-sm", theme === "dark" ? "text-slate-300" : "text-slate-700")}>EPV method</span>
                  <div className="flex gap-2 flex-wrap">
                    {(["Owner Earnings", "NOPAT (EBIT-based)"] as EPVMethod[]).map((m) => (
                      <Btn key={m} onClick={() => setEpvMethod(m)} active={epvMethod === m}>{m}</Btn>
                    ))}
                  </div>
                </div>
                <PercentField label="Target debt weight (WACC)" value={targetDebtWeight} onChange={setTargetDebtWeight} />
                <PercentField label="Risk-free rate" value={rfRate} onChange={setRfRate} />
                <PercentField label="Equity risk premium" value={erp} onChange={setErp} />
                <div className="flex flex-col gap-2">
                  <span className={cx("text-sm", theme === "dark" ? "text-slate-300" : "text-slate-700")}>CAPM mode</span>
                  <div className="flex gap-2">
                    {(["advanced","simple"] as ("advanced"|"simple")[]).map((m) => (
                      <Btn key={m} onClick={() => setCapmMode(m)} active={capmMode === m}>{m}</Btn>
                    ))}
                  </div>
                </div>
                {capmMode === "simple" ? (
                  <LabeledNumber label="Beta (levered)" value={beta} onChange={setBeta} step={0.05} />
                ) : (
                  <>
                    <LabeledNumber label="Beta (unlevered)" value={betaUnlevered} onChange={setBetaUnlevered} step={0.05} />
                    <LabeledNumber label="Target D/E" value={targetDE} onChange={setTargetDE} step={0.05} />
                    <div className={cx("rounded-lg p-4 border col-span-1 md:col-span-3", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>Levered beta: <span className="font-semibold">{leveredBetaFromAdvanced.toFixed(2)}</span></div>
                        <div>Cost of equity: <span className="font-semibold">{pctFmt(costEquity)}</span></div>
                        <div>After-tax cost of debt: <span className="font-semibold">{pctFmt(afterTaxCostDebt)}</span></div>
                      </div>
                    </div>
                  </>
                )}
                <PercentField label="Size premium" value={sizePrem} onChange={setSizePrem} />
                <PercentField label="Specific risk premium" value={specificPrem} onChange={setSpecificPrem} />
                <PercentField label="Cost of debt (pre-tax)" value={costDebt} onChange={setCostDebt} />
                <div className={cx("rounded-lg p-4 border col-span-1 md:col-span-3", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>Base WACC: <span className="font-semibold">{pctFmt(baseWacc)}</span></div>
                    <div>Risk WACC premium: <span className="font-semibold">{pctFmt(riskWaccPremium)}</span></div>
                    <div>Scenario WACC: <span className="font-semibold">{pctFmt(scenarioWacc)}</span></div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Asset Reproduction Inputs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DollarsField label="Buildout & improvements (per loc)" value={buildoutImprovements} onChange={setBuildoutImprovements} />
                <DollarsField label="Devices & equipment (per loc)" value={equipmentDevices} onChange={setEquipmentDevices} />
                <DollarsField label="FF&E (per loc)" value={ffne} onChange={setFfne} />
                <DollarsField label="Startup intangibles (one-time)" value={startupIntangibles} onChange={setStartupIntangibles} />
                <DollarsField label="Brand rebuild (one-time)" value={brandRebuild} onChange={setBrandRebuild} />
                <DollarsField label="Other reproduction cost" value={otherRepro} onChange={setOtherRepro} />
                <DollarsField label="Training cost per provider" value={trainingCostPerProvider} onChange={setTrainingCostPerProvider} />
                <DollarsField label="Membership CAC per unit" value={membershipCAC} onChange={setMembershipCAC} />
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className={cx("text-sm", theme === "dark" ? "text-slate-300" : "text-slate-700")}>Working capital assumptions</div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                    <LabeledNumber label="DSO (days)" value={dsoDays} onChange={setDsoDays} step={1} />
                    <LabeledNumber label="DSI (days)" value={dsiDays} onChange={setDsiDays} step={1} />
                    <LabeledNumber label="DPO (days)" value={dpoDays} onChange={setDpoDays} step={1} />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Scenario & Risk Overlays">
              <div className="flex gap-2 mb-4">
                {["Base","Bull","Bear"].map((s) => (
                  <Btn key={s} onClick={() => setScenario(s as any)} active={scenario === s}>{s}</Btn>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PercentField label="Earnings haircut (risk)" value={riskEarningsHaircut} onChange={setRiskEarningsHaircut} />
                <PercentField label="WACC premium (risk)" value={riskWaccPremium} onChange={setRiskWaccPremium} />
              </div>
            </Section>
          </>
        )}

        {activeTab === "capacity" && (
          <>
            <Section title="Capacity & Staffing (per Location)">
              <div className="flex items-center gap-3 mb-3">
                <span className={cx("text-sm", theme === "dark" ? "text-slate-300" : "text-slate-700")}>Capacity constraint</span>
                <Btn onClick={() => setEnableCapacity(!enableCapacity)} active={enableCapacity}>{enableCapacity ? "Enabled" : "Disabled"}</Btn>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <LabeledNumber label="Rooms" value={numRooms} onChange={setNumRooms} step={1} />
                <LabeledNumber label="Hours per day" value={hoursPerDay} onChange={setHoursPerDay} step={0.5} />
                <LabeledNumber label="Days per week" value={daysPerWeek} onChange={setDaysPerWeek} step={1} />
                <PercentField label="Room utilization" value={roomUtilization} onChange={setRoomUtilization} />
              </div>
              <div className="mt-4 overflow-auto">
                <table className={cx("min-w-full text-xs", theme === "dark" ? "text-slate-200" : "text-slate-800") }>
                  <thead>
                    <tr className={cx(theme === "dark" ? "text-slate-400" : "text-slate-600") }>
                      <th className="py-2 pr-4 text-left">Provider</th>
                      <th className="py-2 pr-4 text-left">FTE</th>
                      <th className="py-2 pr-4 text-left">Hours/week</th>
                      <th className="py-2 pr-4 text-left">Appts/hour</th>
                      <th className="py-2 pr-4 text-left">Utilization</th>
                      <th className="py-2 pr-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((p, idx) => (
                      <tr key={p.id} className={cx("border-t", theme === "dark" ? "border-slate-800" : "border-slate-200") }>
                        <td className="py-2 pr-4">
                          <input className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")} value={p.name} onChange={(e) => { const copy = [...providers]; copy[idx] = { ...p, name: e.target.value }; setProviders(copy); }} />
                        </td>
                        <td className="py-2 pr-4"><input type="number" className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")} value={p.fte} step={0.1} onChange={(e) => { const copy = [...providers]; copy[idx] = { ...p, fte: Number(e.target.value) }; setProviders(copy); }} /></td>
                        <td className="py-2 pr-4"><input type="number" className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")} value={p.hoursPerWeek} step={1} onChange={(e) => { const copy = [...providers]; copy[idx] = { ...p, hoursPerWeek: Number(e.target.value) }; setProviders(copy); }} /></td>
                        <td className="py-2 pr-4"><input type="number" className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")} value={p.apptsPerHour} step={0.1} onChange={(e) => { const copy = [...providers]; copy[idx] = { ...p, apptsPerHour: Number(e.target.value) }; setProviders(copy); }} /></td>
                        <td className="py-2 pr-4"><input type="number" className={cx("w-full rounded-md px-2 py-1", theme === "dark" ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-300 bg-white")} value={+(p.utilization * 100).toFixed(1)} step={1} onChange={(e) => { const copy = [...providers]; copy[idx] = { ...p, utilization: Number(e.target.value) / 100 }; setProviders(copy); }} /></td>
                        <td className="py-2 pr-4"><Btn onClick={() => { const copy = [...providers]; copy.splice(idx, 1); setProviders(copy); }}>Remove</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm">Provider slots/loc: <span className="font-semibold">{Math.round(providerSlotsPerLoc).toLocaleString()}</span> — Room slots/loc: <span className="font-semibold">{Math.round(roomSlotsPerLoc).toLocaleString()}</span> — Capacity/loc: <span className="font-semibold">{Math.round(capSlotsPerLoc).toLocaleString()}</span></div>
                <div className="flex gap-2">
                  <Btn onClick={() => setProviders([...providers, { id: uid(), name: "New Provider", fte: 1, hoursPerWeek: 35, apptsPerHour: 1, utilization: 0.8 }])}>Add Provider</Btn>
                </div>
              </div>
              <div className={cx("mt-3 text-xs", theme === "dark" ? "text-slate-400" : "text-slate-600")}>Volumes that consume visit units scale down if demand exceeds capacity when constraint is enabled.</div>
            </Section>
          </>
        )}

        {activeTab === "model" && (
          <>
            <Section title="P&L Summary (Normalized, All Locations)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className="flex justify-between"><span>Revenue</span><span className="font-semibold">{fmt0.format(totalRevenueBase)}</span></div>
                  <div className="flex justify-between"><span>COGS (by line)</span><span className="font-semibold">{fmt0.format(totalCOGS)}</span></div>
                  <div className="flex justify-between"><span>Clinical labor</span><span className="font-semibold">{fmt0.format(clinicalLaborCost)}</span></div>
                  <div className="flex justify-between border-t mt-2 pt-2"><span>Gross profit</span><span className="font-semibold">{fmt0.format(grossProfit)}</span></div>
                  <div className="mt-3">Operating expenses</div>
                  <div className="flex justify-between"><span>Marketing</span><span className="font-semibold">{fmt0.format(marketingCost)}</span></div>
                  <div className="flex justify-between"><span>Admin wages</span><span className="font-semibold">{fmt0.format(adminCost)}</span></div>
                  <div className="flex justify-between"><span>MSO fee</span><span className="font-semibold">{fmt0.format(msoFee)}</span></div>
                  <div className="flex justify-between"><span>Compliance</span><span className="font-semibold">{fmt0.format(complianceCost)}</span></div>
                  <div className="flex justify-between"><span>Fixed opex</span><span className="font-semibold">{fmt0.format(fixedOpex)}</span></div>
                  <div className="flex justify-between"><span>Other opex</span><span className="font-semibold">{fmt0.format(otherOpexCost)}</span></div>
                  <div className="flex justify-between border-t mt-2 pt-2"><span>EBITDA (reported)</span><span className={cx("font-semibold", ebitdaReported >= 0 ? "text-emerald-400" : "text-rose-400")}>{fmt0.format(ebitdaReported)}</span></div>
                  <div className="flex justify-between"><span>Add-backs (all locs)</span><span className="font-semibold">{fmt0.format((ownerAddBack + otherAddBack) * locations)}</span></div>
                  <div className="flex justify-between"><span>EBITDA (normalized)</span><span className={cx("font-semibold", ebitdaNormalized >= 0 ? "text-emerald-400" : "text-rose-400")}>{fmt0.format(ebitdaNormalized)}</span></div>
                  <div className="flex justify-between"><span>D&A</span><span className="font-semibold">{fmt0.format(daTotal)}</span></div>
                  <div className="flex justify-between border-t mt-2 pt-2"><span>EBIT (normalized)</span><span className="font-semibold">{fmt0.format(ebitNormalized)}</span></div>
                </div>
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className="flex justify-between"><span>Tax rate</span><span className="font-semibold">{pctFmt(taxRate)}</span></div>
                  <div className="flex justify-between"><span>NOPAT</span><span className="font-semibold">{fmt0.format(nopat)}</span></div>
                  <div className="flex justify-between"><span>Maintenance capex</span><span className="font-semibold">{fmt0.format(maintCapexBase)}</span></div>
                  <div className="flex justify-between"><span>Owner earnings</span><span className="font-semibold">{fmt0.format(ownerEarnings)}</span></div>
                  <div className="flex justify-between border-t mt-2 pt-2"><span>Adjusted earnings ({epvMethod})</span><span className="font-semibold">{fmt0.format(adjustedEarnings)}</span></div>
                  <div className="mt-3">Working capital (scenario)</div>
                  <div className="flex justify-between"><span>A/R</span><span className="font-semibold">{fmt0.format(ar)}</span></div>
                  <div className="flex justify-between"><span>Inventory</span><span className="font-semibold">{fmt0.format(inv)}</span></div>
                  <div className="flex justify-between"><span>A/P</span><span className="font-semibold">{fmt0.format(ap)}</span></div>
                  <div className="flex justify-between border-t mt-2 pt-2"><span>Net working capital</span><span className="font-semibold">{fmt0.format(nwcRequired)}</span></div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "valuation" && (
          <>
            <Section title="EPV Valuation (Scenario)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className="flex justify-between"><span>Revenue (scenario)</span><span className="font-semibold">{fmt0.format(totalRevenue)}</span></div>
                  <div className="flex justify-between"><span>Adjusted earnings</span><span className="font-semibold">{fmt0.format(adjustedEarningsScenario)}</span></div>
                  <div className="flex justify-between"><span>WACC (scenario)</span><span className="font-semibold">{pctFmt(scenarioWacc)}</span></div>
                  <div className="flex justify-between border-t mt-2 pt-2"><span>Enterprise EPV</span><span className="font-semibold text-emerald-400">{fmt0.format(enterpriseEPV)}</span></div>
                </div>
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className="flex justify-between"><span>Cash & equivalents</span><span className="font-semibold">{fmt0.format(cashNonOperating)}</span></div>
                  <div className="flex justify-between"><span>Debt</span><span className="font-semibold">{fmt0.format(debtInterestBearing)}</span></div>
                  <div className="flex justify-between border-t mt-2 pt-2"><span>Equity value (EPV)</span><span className="font-semibold text-indigo-400">{fmt0.format(equityEPV)}</span></div>
                  <div className="flex justify-between mt-2"><span>EV / Revenue</span><span className="font-semibold">{evToRevenue.toFixed(2)}x</span></div>
                  <div className="flex justify-between"><span>EV / EBITDA</span><span className="font-semibold">{evToEbitda.toFixed(2)}x</span></div>
                </div>
              </div>
            </Section>

            <Section title="Asset Reproduction & Franchise">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className="flex justify-between"><span>Buildout & improvements</span><span className="font-semibold">{fmt0.format(buildoutImprovements * locations)}</span></div>
                  <div className="flex justify-between"><span>Devices & equipment</span><span className="font-semibold">{fmt0.format(equipmentDevices * locations)}</span></div>
                  <div className="flex justify-between"><span>FF&E</span><span className="font-semibold">{fmt0.format(ffne * locations)}</span></div>
                  <div className="flex justify-between"><span>Intangibles rebuild</span><span className="font-semibold">{fmt0.format(intangiblesRebuild)}</span></div>
                  <div className="flex justify-between"><span>Net working capital</span><span className="font-semibold">{fmt0.format(nwcRequired)}</span></div>
                  <div className="flex justify-between"><span>Other reproduction</span><span className="font-semibold">{fmt0.format(otherRepro)}</span></div>
                  <div className="flex justify-between border-t mt-2 pt-2"><span>Enterprise Reproduction Value</span><span className="font-semibold">{fmt0.format(enterpriseRepro)}</span></div>
                </div>
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className="flex justify-between"><span>Equity (Reproduction)</span><span className="font-semibold">{fmt0.format(equityRepro)}</span></div>
                  <div className="flex justify-between"><span>Equity (EPV)</span><span className="font-semibold">{fmt0.format(equityEPV)}</span></div>
                  <div className="flex justify-between"><span>Franchise factor (EV / Repro)</span><span className="font-semibold">{franchiseRatio.toFixed(2)}x</span></div>
                  <div className="mt-3">
                    <span className={cx("text-sm", theme === "dark" ? "text-slate-300" : "text-slate-700")}>Recommended method</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(["EPV Only", "Asset Reproduction", "Conservative: Min", "Opportunistic: Max", "Blend: 70% EPV / 30% Asset"] as RecommendedMethod[]).map((m) => (
                        <Btn key={m} onClick={() => setRecoMethod(m)} active={recoMethod === m}>{m}</Btn>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between border-t mt-3 pt-2"><span>Recommended Equity Value</span><span className="font-semibold text-indigo-400">{fmt0.format(recommendedEquity)}</span></div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "analytics" && (
          <>
            <Section title="Valuation Sensitivity (Equity, $)">
              <div className="overflow-auto">
                <table className={cx("min-w-full text-xs", theme === "dark" ? "text-slate-200" : "text-slate-800") }>
                  <thead>
                    <tr className={cx(theme === "dark" ? "text-slate-400" : "text-slate-600") }>
                      <th className="py-2 pr-4 text-left">WACC → / EBIT margin ↓</th>
                      {waccRange.map((w) => (
                        <th key={w} className="py-2 px-2 text-right">{(w * 100).toFixed(1)}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ebitMarginRange.map((m) => (
                      <tr key={m} className={cx("border-t", theme === "dark" ? "border-slate-800" : "border-slate-200") }>
                        <td className="py-2 pr-4">{(m * 100).toFixed(1)}%</td>
                        {waccRange.map((w) => (
                          <td key={`${m}-${w}`} className="py-2 px-2 text-right font-medium">
                            {fmt2.format(epvAt(m, w))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Scenario Overview">
              <div className="grid grid-cols-1 md-grid-cols-3 md:grid-cols-3 gap-4 text-sm">
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
                  <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Base case</div>
                  <div className="mt-2 flex justify-between"><span>Revenue</span><span className="font-semibold">{fmt0.format(totalRevenueBase)}</span></div>
                  <div className="flex justify-between"><span>EBIT margin</span><span className="font-semibold">{pctFmt(ebitMargin)}</span></div>
                  <div className="flex justify-between"><span>Base WACC</span><span className="font-semibold">{pctFmt(baseWacc)}</span></div>
                </div>
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
                  <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Scenario adjustments</div>
                  <div className="mt-2 flex justify-between"><span>Revenue x</span><span className="font-semibold">{scenarioAdj.revenue.toFixed(2)}x</span></div>
                  <div className="flex justify-between"><span>EBIT x</span><span className="font-semibold">{scenarioAdj.ebitAdj.toFixed(2)}x</span></div>
                  <div className="flex justify-between"><span>WACC shift</span><span className="font-semibold">{pctFmt(scenarioAdj.waccAdj)}</span></div>
                </div>
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
                  <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Scenario results</div>
                  <div className="mt-2 flex justify-between"><span>Enterprise EPV</span><span className="font-semibold">{fmt0.format(enterpriseEPV)}</span></div>
                  <div className="flex justify-between"><span>Equity (EPV)</span><span className="font-semibold">{fmt0.format(equityEPV)}</span></div>
                  <div className="flex justify-between"><span>EV / EBITDA</span><span className="font-semibold">{evToEbitda.toFixed(2)}x</span></div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "montecarlo" && (
          <>
            <Section title="Monte Carlo (No growth, EPV)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <LabeledNumber label="Runs" value={mcRuns} onChange={setMcRuns} step={50} help="100 - 8000" />
                <Btn tone="primary" onClick={runMonteCarlo}>Run simulation</Btn>
                {mcStats && (
                  <div className={cx("text-sm rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                    <div className="font-semibold">Enterprise Value</div>
                    <div className="flex justify-between"><span>Mean</span><span className="font-semibold">{fmt0.format(mcStats.mean)}</span></div>
                    <div className="flex justify-between"><span>Median</span><span className="font-semibold">{fmt0.format(mcStats.median)}</span></div>
                    <div className="flex justify-between"><span>5th - 95th</span><span className="font-semibold">{fmt0.format(mcStats.p5)} - {fmt0.format(mcStats.p95)}</span></div>
                    <div className="font-semibold mt-3">Equity Value</div>
                    <div className="flex justify-between"><span>Mean</span><span className="font-semibold">{fmt0.format(mcStats.meanEquity)}</span></div>
                    <div className="flex justify-between"><span>5th - 95th</span><span className="font-semibold">{fmt0.format(mcStats.p5Equity)} - {fmt0.format(mcStats.p95Equity)}</span></div>
                  </div>
                )}
              </div>
              {!mcStats && <div className={cx("text-sm mt-3", theme === "dark" ? "text-slate-400" : "text-slate-600")}>Tip: Increase runs for smoother statistics. EPV uses zero growth by definition.</div>}
            </Section>
          </>
        )}

        {activeTab === "lbo" && (
          <>
            <Section title="LBO Quick Check (Constant EPV earnings)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <DollarsField label="Entry EV (override)" value={entryEvOverride ?? 0} onChange={(v) => setEntryEvOverride(v === 0 ? null : v)} help="0 = use EPV" />
                <PercentField label="Entry debt % of EV" value={entryDebtPct} onChange={setEntryDebtPct} />
                <LabeledNumber label="Hold years" value={lboYears} onChange={setLboYears} step={1} />
                <PercentField label="Transaction costs %" value={transCostsPct} onChange={setTransCostsPct} />
                <PercentField label="Exit costs %" value={exitCostsPct} onChange={setExitCostsPct} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={cx("text-sm", theme === "dark" ? "text-slate-300" : "text-slate-700")}>Exit EV basis:</span>
                <Btn onClick={() => setExitMultipleMode("EPV")} active={exitMultipleMode === "EPV"}>EPV (scenario)</Btn>
                <Btn onClick={() => setExitMultipleMode("Same EV")} active={exitMultipleMode === "Same EV"}>Same as entry</Btn>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Entry</div>
                  <div className="flex justify-between"><span>EV (incl. costs)</span><span className="font-semibold">{fmt0.format(entryEV)}</span></div>
                  <div className="flex justify-between"><span>Debt</span><span className="font-semibold">{fmt0.format(entryDebt)}</span></div>
                  <div className="flex justify-between"><span>Equity</span><span className="font-semibold">{fmt0.format(entryEquity)}</span></div>
                </div>
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Exit</div>
                  <div className="flex justify-between"><span>EV (net of costs)</span><span className="font-semibold">{fmt0.format(lboExitEV)}</span></div>
                  <div className="flex justify-between"><span>Debt</span><span className="font-semibold">{fmt0.format(lboSim.exitDebt)}</span></div>
                  <div className="flex justify-between"><span>Equity</span><span className="font-semibold">{fmt0.format(lboSim.exitEquity)}</span></div>
                </div>
                <div className={cx("rounded-lg p-4 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200") }>
                  <div className={cx("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Returns</div>
                  <div className="flex justify-between"><span>MOIC</span><span className="font-semibold">{lboSim.moic.toFixed(2)}x</span></div>
                  <div className="flex justify-between"><span>IRR</span><span className="font-semibold">{(lboSim.irr * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "data" && (
          <>
            <Section title="Import / Export & Scenarios">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2">
                  <div className={cx("text-sm mb-2", theme === "dark" ? "text-slate-300" : "text-slate-700")}>Export current state</div>
                  <textarea className={cx("w-full h-40 rounded-lg p-3 text-xs", theme === "dark" ? "border border-slate-700 bg-slate-900 text-slate-100" : "border border-slate-300 bg-white")} value={jsonText || JSON.stringify(collectSnapshot(), null, 2)} onChange={(e) => setJsonText(e.target.value)} />
                  <div className="flex gap-2 mt-2">
                    <Btn onClick={() => setJsonText(JSON.stringify(collectSnapshot(), null, 2))}>Refresh</Btn>
                    <Btn tone="primary" onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(collectSnapshot(), null, 2)); pushLog({ kind: "success", text: "Copied JSON to clipboard." }); } catch {} }}>Copy</Btn>
                    <Btn tone="success" onClick={() => { try { const obj = JSON.parse(jsonText || "{}"); applySnapshot(obj); pushLog({ kind: "success", text: "Imported from textarea JSON." }); } catch { pushLog({ kind: "error", text: "Invalid JSON." }); } }}>Import</Btn>
                    <Btn onClick={resetDefaults}>Reset defaults</Btn>
                  </div>
                </div>
                <div>
                  <div className={cx("text-sm mb-2", theme === "dark" ? "text-slate-300" : "text-slate-700")}>Saved scenarios</div>
                  <div className="flex gap-2 mb-2">
                    <input className={cx("flex-1 rounded-md px-2 py-1 text-sm", theme === "dark" ? "border border-slate-700 bg-slate-900 text-slate-100" : "border border-slate-300 bg-white")} placeholder="Scenario name" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
                    <Btn tone="primary" onClick={saveScenario}>Save</Btn>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {savedScenarios.map((s, i) => (
                      <div key={s.id} className={cx("flex items-center justify-between rounded-lg px-3 py-2 border", theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200") }>
                        <div className="text-sm">{i + 1}. {s.name}</div>
                        <div className="flex gap-2">
                          <Btn onClick={() => applyScenario(s.id)}>Apply</Btn>
                          <Btn tone="danger" onClick={() => deleteScenario(s.id)}>Delete</Btn>
                        </div>
                      </div>
                    ))}
                    {savedScenarios.length === 0 && <div className={cx("text-xs", theme === "dark" ? "text-slate-500" : "text-slate-500")}>No scenarios saved.</div>}
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "notes" && (
          <>
            <Section title="Modeling Notes & Assumptions">
              <ul className={cx("list-disc pl-6 text-sm", theme === "dark" ? "text-slate-300" : "text-slate-700") }>
                <li>EPV values steady-state earning power with zero growth. Adjusted earnings can be NOPAT or Owner Earnings (NOPAT + D&A - Maintenance Capex).</li>
                <li>Capacity model estimates visit throughput; if enabled, service volumes scale to capacity. Volumes are per location then scaled by number of locations.</li>
                <li>Roll-up effects: admin/marketing synergies, MSO management fee, compliance overhead, and labor market adjustment.</li>
                <li>Maintenance capex supports model-based replacement/refresh cycles for devices, buildout, and FF&E plus minor maintenance percent of revenue.</li>
                <li>Advanced CAPM optionally un/levers beta using target D/E and tax rate. WACC includes size and specific premia.</li>
                <li>Reproduction value includes buildout, equipment, FF&E, working capital, and intangibles for training, brand rebuild, and membership CAC.</li>
                <li>Risk overlays haircut earnings and add a WACC premium for key-person, regulatory, or concentration risks.</li>
                <li>Monte Carlo samples WACC, revenue, and EBIT margin. LBO check assumes owner earnings reduce debt annually with exit at EPV or entry EV.</li>
                <li>Use the CLI for fast changes: e.g., 'set marketing 7.5%', 'capex model', 'scenario bull', 'mc 2000', 'save Case A'.</li>
              </ul>
            </Section>
          </>
        )}

        <footer className={cx("mt-10 text-center text-xs", theme === "dark" ? "text-slate-500" : "text-slate-500") }>
          Built for private equity-grade analysis • For education only; not investment advice.
        </footer>
      </div>
    </div>

);
}
