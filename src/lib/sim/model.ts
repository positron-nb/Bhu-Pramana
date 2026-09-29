import { ASSUMPTIONS } from "@/data/assumptions";
import type { Assumption, Levers, OutputId, Region } from "@/lib/domain/schemas";
import { BASE_YEAR } from "@/lib/data/regions";
import { assumptionStrength, gradeOf, type Grade } from "@/lib/evidence/strength";

/**
 * Bhū-Pramāṇa Policy Lab model — v1.
 *
 * A transparent, deterministic scenario model. It is NOT a forecast and NOT
 * machine learning: every output is a closed-form function of (a) the region's
 * baseline indicators, (b) the policy levers and (c) twelve evidence-backed
 * coefficients (assumptions A01–A12). Uncertainty comes from each
 * coefficient's evidence range; confidence comes from the quality of the
 * evidence behind the coefficients that actually drive the result.
 */

export type Coefficients = Record<string, number>;

export const CENTRAL: Coefficients = Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, a.central]));

export interface OutputDef {
  id: OutputId;
  label: string;
  short: string;
  unit: string;
  decimals: number;
  higherIsBetter: boolean;
  formula: string;
  assumptions: string[];
}

export const OUTPUTS: OutputDef[] = [
  {
    id: "disputePressure", label: "Projected land-dispute pressure", short: "Dispute pressure", unit: "index", decimals: 1, higherIsBetter: false,
    formula: "P₀ · (1 + A11·g·t) · (1 + A01·ΔD/10) · (1 + A02·ΔC/10) · (1 + A03·ΔI/10·(1 − 0.8·D/100)) · (1 + A05·max(0, Z − 70)/10)",
    assumptions: ["A11", "A01", "A02", "A03", "A05"],
  },
  {
    id: "processingDays", label: "Estimated mutation processing time", short: "Processing time", unit: "days", decimals: 0, higherIsBetter: false,
    formula: "T₀ · (1 − 0.02·t) · (1 + A08·ΔD/10) · (1 + A09·ΔC/10)",
    assumptions: ["A08", "A09"],
  },
  {
    id: "digitizationCoverage", label: "Digitisation coverage", short: "Digitisation", unit: "%", decimals: 1, higherIsBetter: true,
    formula: "D₀ + drift·t + Δtarget · phase(t) · η   where η = 1 − A10 · overload",
    assumptions: ["A10"],
  },
  {
    id: "landUsePressure", label: "Land-use conversion pressure", short: "Land-use pressure", unit: "index", decimals: 1, higherIsBetter: false,
    formula: "L₀ · (1 + 0.5·g·t) · (1 + A06·ΔI/10) · (1 + A04·ΔZ/10)",
    assumptions: ["A06", "A04"],
  },
  {
    id: "climateResilience", label: "Climate resilience index", short: "Resilience", unit: "index", decimals: 1, higherIsBetter: true,
    formula: "R₀ + 0.3·t + (A07 · climate% · phase·η + A12 · ΔZ/10) · V/0.6",
    assumptions: ["A07", "A12"],
  },
  {
    id: "implementationScore", label: "Implementation feasibility", short: "Implementation", unit: "score", decimals: 0, higherIsBetter: true,
    formula: "100 · η · (0.55 + 0.45 · capacity/100)",
    assumptions: ["A10"],
  },
];
export const outputById = Object.fromEntries(OUTPUTS.map((o) => [o.id, o])) as Record<OutputId, OutputDef>;

export interface LeverDef {
  id: keyof Levers;
  label: string;
  help: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  assumptions: string[];
}

export const LEVERS: LeverDef[] = [
  { id: "digitization", label: "Land record digitisation", help: "Percentage-point increase in records that are digitised and linked to parcel maps.", min: 0, max: 40, step: 1, unit: "+pp", assumptions: ["A01", "A08", "A10"] },
  { id: "disputeCapacity", label: "Dispute-resolution capacity", help: "Increase in revenue-court, tribunal and mediation capacity.", min: 0, max: 100, step: 5, unit: "+%", assumptions: ["A02", "A09", "A10"] },
  { id: "rolloutYears", label: "Implementation speed", help: "Years over which the reform package is rolled out. Faster roll-outs strain administrative capacity.", min: 1, max: 5, step: 1, unit: "years", assumptions: ["A10"] },
  { id: "climateInvestment", label: "Climate-resilience investment", help: "Share of the land-sector budget directed to climate-resilient land use (watersheds, restoration, hazard zoning).", min: 0, max: 30, step: 1, unit: "% budget", assumptions: ["A07", "A10"] },
  { id: "infrastructure", label: "Infrastructure expansion", help: "Expansion of the rural road, utility and corridor network.", min: 0, max: 50, step: 5, unit: "+%", assumptions: ["A03", "A06", "A10"] },
  { id: "zoning", label: "Zoning strictness", help: "Target zoning-enforcement index (0 = none, 100 = strict). The region's current value is the starting point.", min: 0, max: 100, step: 1, unit: "index", assumptions: ["A04", "A05", "A12"] },
];

export function statusQuoLevers(region: Region): Levers {
  return { digitization: 0, disputeCapacity: 0, rolloutYears: 3, climateInvestment: 0, infrastructure: 0, zoning: Math.round(region.indicators.zoningStrictness) };
}

export type Snapshot = Record<OutputId, number>;

export interface Trajectory {
  years: number[];
  values: Record<OutputId, number[]>;
}

export interface RunDiagnostics {
  load: number;
  absorptive: number;
  overload: number;
  efficiency: number;
  effectiveDigitization: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Core deterministic model. Pure: same inputs → same outputs. */
export function runModel(region: Region, levers: Levers, horizon = 5, k: Coefficients = CENTRAL): { trajectory: Trajectory; diagnostics: RunDiagnostics } {
  const ind = region.indicators;
  const D0 = ind.digitization;
  const P0 = ind.disputePressure;
  const T0 = ind.mutationDays;
  const L0 = ind.landUsePressure;
  const R0 = ind.climateResilience;
  const V = ind.climateVulnerability;
  const g = ind.urbanGrowth; // %/yr built-up growth
  const cap = ind.adminCapacity;
  const Z0 = ind.zoningStrictness;

  const effDig = clamp(levers.digitization, 0, Math.max(0, 99 - D0));
  const zoningDelta = levers.zoning - Z0;

  // implementation load in "reform units per year" vs absorptive capacity
  const load = (effDig / 15 + levers.disputeCapacity / 40 + levers.climateInvestment / 12 + levers.infrastructure / 25 + Math.abs(zoningDelta) / 40) / levers.rolloutYears;
  const absorptive = (cap / 100) * 1.6;
  const overload = Math.max(0, load - absorptive);
  const eta = clamp(1 - k.absorption * overload, 0.35, 1);

  const years: number[] = [];
  const values = Object.fromEntries(OUTPUTS.map((o) => [o.id, [] as number[]])) as Record<OutputId, number[]>;

  for (let t = 0; t <= horizon; t++) {
    const phase = Math.min(1, t / levers.rolloutYears);
    const a = phase * eta;
    const dD = effDig * a;
    const dC = levers.disputeCapacity * a;
    const dI = levers.infrastructure * a;
    const Zt = Z0 + zoningDelta * a;
    const dZ = Zt - Z0;
    const drift = (100 - D0) * 0.03;
    const D = clamp(D0 + drift * t + dD, 0, 100);

    const P =
      P0 *
      (1 + ((k.urbanDrift / 100) * g) * t) *
      (1 + (k.digDispute / 100) * (dD / 10)) *
      (1 + (k.capDispute / 100) * (dC / 10)) *
      (1 + (k.infraDispute / 100) * (dI / 10) * (1 - 0.8 * (D / 100))) *
      (1 + (k.zoningInformal / 100) * (Math.max(0, Zt - 70) / 10));

    const T = T0 * (1 - 0.02 * t) * (1 + (k.digProcessing / 100) * (dD / 10)) * (1 + (k.capProcessing / 100) * (dC / 10));

    const L = L0 * (1 + (0.5 * g * t) / 100) * (1 + (k.infraConversion / 100) * (dI / 10)) * (1 + (k.zoningConversion / 100) * (dZ / 10));

    const R = R0 + 0.3 * t + (k.climateResilience * levers.climateInvestment * a + k.zoningResilience * (dZ / 10)) * (V / 0.6);

    const I = 100 * eta * (0.55 + (0.45 * cap) / 100);

    years.push(BASE_YEAR + t);
    values.disputePressure.push(clamp(P, 0, 100));
    values.processingDays.push(clamp(T, 2, 200));
    values.digitizationCoverage.push(D);
    values.landUsePressure.push(clamp(L, 0, 100));
    values.climateResilience.push(clamp(R, 0, 100));
    values.implementationScore.push(clamp(I, 0, 100));
  }

  return { trajectory: { years, values }, diagnostics: { load, absorptive, overload, efficiency: eta, effectiveDigitization: effDig } };
}

const last = (xs: number[]) => xs[xs.length - 1];
function snapshotOf(tr: Trajectory): Snapshot {
  return Object.fromEntries(OUTPUTS.map((o) => [o.id, last(tr.values[o.id])])) as Snapshot;
}

export interface SensitivityRow {
  assumption: string;
  label: string;
  low: number;
  high: number;
  swing: number;
  share: number;
}

export interface OutputResult {
  id: OutputId;
  baseline: number;
  scenario: number;
  delta: number;
  deltaPct: number;
  low: number;
  high: number;
  confidence: number | null;
  grade: Grade | null;
  sensitivity: SensitivityRow[];
  improves: boolean | null;
}

export interface ResearchPriority {
  assumption: Assumption;
  valueOfInformation: number;
  strength: number;
  drives: OutputId[];
  question: string;
}

export interface SimulationResult {
  region: string;
  levers: Levers;
  horizon: number;
  years: number[];
  baseline: Trajectory;
  scenario: Trajectory;
  outputs: OutputResult[];
  /** Per-year root-sum-square uncertainty band of the scenario trajectory. */
  bands: Record<OutputId, { low: number[]; high: number[] }>;
  diagnostics: RunDiagnostics;
  confidence: { score: number | null; grade: Grade | null };
  assumptionStrengths: Record<string, { score: number; grade: Grade }>;
  priorities: ResearchPriority[];
  modelVersion: string;
}

export const MODEL_VERSION = "bp-policy-lab/1.0";

/**
 * Full simulation: baseline vs scenario, one-at-a-time sensitivity over all
 * twelve coefficients, root-sum-square uncertainty band, evidence-weighted
 * confidence and value-of-information research priorities.
 */
export function simulate(region: Region, levers: Levers, horizon = 5): SimulationResult {
  const sq = statusQuoLevers(region);
  const base = runModel(region, sq, horizon);
  const scen = runModel(region, levers, horizon);
  const baseSnap = snapshotOf(base.trajectory);
  const scenSnap = snapshotOf(scen.trajectory);

  const strengths = Object.fromEntries(ASSUMPTIONS.map((a) => {
    const s = assumptionStrength(a, region.code);
    return [a.id, { score: s.score, grade: s.grade }];
  }));

  // one-at-a-time sensitivity of the *policy effect* (scenario − baseline)
  const effect = (k: Coefficients) => {
    const tr = runModel(region, levers, horizon, k).trajectory;
    return { s: snapshotOf(tr), tr };
  };
  const yearSq = Object.fromEntries(OUTPUTS.map((o) => [o.id, new Array(horizon + 1).fill(0)])) as Record<OutputId, number[]>;
  const swings: Record<OutputId, SensitivityRow[]> = Object.fromEntries(OUTPUTS.map((o) => [o.id, []])) as unknown as Record<OutputId, SensitivityRow[]>;
  for (const a of ASSUMPTIONS) {
    const lo = effect({ ...CENTRAL, [a.key]: a.low });
    const hi = effect({ ...CENTRAL, [a.key]: a.high });
    for (const o of OUTPUTS) {
      const vLo = lo.s[o.id];
      const vHi = hi.s[o.id];
      const swing = Math.abs(vHi - vLo);
      if (swing > 1e-6) swings[o.id].push({ assumption: a.id, label: a.label, low: vLo, high: vHi, swing, share: 0 });
      for (let t = 0; t <= horizon; t++) yearSq[o.id][t] += ((hi.tr.values[o.id][t] - lo.tr.values[o.id][t]) / 2) ** 2;
    }
  }

  const outputs: OutputResult[] = OUTPUTS.map((o) => {
    const rows = swings[o.id].sort((x, y) => y.swing - x.swing);
    const ss = rows.reduce((s, r) => s + r.swing * r.swing, 0);
    for (const r of rows) r.share = ss ? (r.swing * r.swing) / ss : 0;
    const half = Math.sqrt(rows.reduce((s, r) => s + (r.swing / 2) ** 2, 0));
    const b = baseSnap[o.id];
    const s = scenSnap[o.id];
    const delta = s - b;
    const policyMoved = Math.abs(delta) > 1e-6;
    // confidence: evidence strength of the coefficients weighted by how much they drive this output
    const conf = ss && policyMoved ? rows.reduce((acc, r) => acc + r.share * strengths[r.assumption].score, 0) : null;
    return {
      id: o.id,
      baseline: b,
      scenario: s,
      delta,
      deltaPct: b ? (delta / b) * 100 : 0,
      low: Math.min(s - half, s + half),
      high: Math.max(s - half, s + half),
      confidence: conf,
      grade: conf === null ? null : gradeOf(conf),
      sensitivity: rows,
      improves: policyMoved ? (o.higherIsBetter ? delta > 0 : delta < 0) : null,
    };
  });

  const bands = Object.fromEntries(OUTPUTS.map((o) => {
    const v = scen.trajectory.values[o.id];
    return [o.id, { low: v.map((x, t) => x - Math.sqrt(yearSq[o.id][t])), high: v.map((x, t) => x + Math.sqrt(yearSq[o.id][t])) }];
  })) as SimulationResult["bands"];

  const moved = outputs.filter((o) => o.confidence !== null);
  const overall = moved.length ? moved.reduce((s, o) => s + (o.confidence ?? 0), 0) / moved.length : null;

  // value of information: relative uncertainty each coefficient creates in the
  // outputs this policy actually moves, discounted by how well evidenced that
  // coefficient already is (status quo → no decision → no priorities)
  const voi = new Map<string, { v: number; drives: Set<OutputId> }>();
  for (const o of outputs) {
    if (o.improves === null) continue;
    for (const r of o.sensitivity) {
      const cur = voi.get(r.assumption) ?? { v: 0, drives: new Set<OutputId>() };
      cur.v += (r.swing / Math.max(Math.abs(o.scenario), 1)) * (1 - strengths[r.assumption].score) * 100;
      if (r.share > 0.2) cur.drives.add(o.id);
      voi.set(r.assumption, cur);
    }
  }
  const priorities: ResearchPriority[] = [...voi.entries()]
    .map(([id, { v, drives }]) => {
      const a = ASSUMPTIONS.find((x) => x.id === id)!;
      return { assumption: a, valueOfInformation: v, strength: strengths[id].score, drives: [...drives], question: researchQuestion(a, region) };
    })
    .filter((p) => p.valueOfInformation > 0.5)
    .sort((x, y) => y.valueOfInformation - x.valueOfInformation)
    .slice(0, 3);

  return {
    region: region.code,
    levers,
    horizon,
    years: scen.trajectory.years,
    baseline: base.trajectory,
    scenario: scen.trajectory,
    outputs,
    bands,
    diagnostics: scen.diagnostics,
    confidence: { score: overall, grade: overall === null ? null : gradeOf(overall) },
    assumptionStrengths: strengths,
    priorities,
    modelVersion: MODEL_VERSION,
  };
}

function researchQuestion(a: Assumption, region: Region): string {
  const place = region.level === "country" ? "Indian districts" : region.name;
  const templates: Record<string, string> = {
    A01: `How much does record digitisation reduce land disputes in ${place}, and does prior resurvey change the effect?`,
    A02: `What is the net effect of added adjudication capacity on land-case pendency in ${place}, after induced filings?`,
    A03: `Do infrastructure corridors raise land disputes in ${place}, and do mature records neutralise the effect?`,
    A04: `How strongly does zoning enforcement slow farmland conversion in ${place}?`,
    A05: `At what level does strict zoning push conversion into informal, dispute-prone subdivision in ${place}?`,
    A06: `How much conversion pressure do new roads and corridors create in ${place}?`,
    A07: `What resilience return does climate-resilient land-use investment deliver in ${place}?`,
    A08: `How much does digitisation shorten mutation time in ${place}, given staffing constraints?`,
    A09: `How much does added revenue-court capacity shorten processing time in ${place}?`,
    A10: `What reform pace can revenue administration in ${place} absorb without losing effectiveness?`,
    A11: `How fast do land disputes rise with urbanisation in ${place} without policy change?`,
    A12: `Does hazard zoning measurably improve land-system resilience in ${place}?`,
  };
  return templates[a.id] ?? `Improve the evidence for “${a.label}” in ${place}.`;
}
