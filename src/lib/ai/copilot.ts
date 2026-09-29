import { evidenceById } from "@/data/evidence";
import { indicatorById } from "@/data/indicators";
import { interventionById, outcomeById } from "@/data/taxonomy";
import type { Evidence, Finding, IndicatorId, InterventionId, Levers, OutcomeId } from "@/lib/domain/schemas";
import { DISTRICTS, getRegion, regionByCode, regionLabel } from "@/lib/data/regions";
import { bodyStrength, type Grade } from "@/lib/evidence/strength";
import type { QueryUnderstanding } from "@/lib/search/query";
import type { SearchHit, SearchResponse } from "@/lib/search/engine";

/**
 * Research Copilot — deterministic evidence synthesis.
 *
 * retrieve → group findings by intervention → detect recurring and
 * conflicting findings → suggest datasets, geography and a Policy Lab preset.
 * Every sentence carries the IDs of the sources it rests on. An optional LLM
 * may *rephrase* the summary, but only with citations to retrieved sources
 * (validated server-side); otherwise this deterministic text is used.
 */

export interface Cited { text: string; cites: string[] }

export interface ApproachOutcome {
  outcome: OutcomeId;
  direction: Finding["direction"];
  beneficial: boolean | null;
  n: number;
  agree: number;
  effect?: string;
}

export interface Approach {
  intervention: InterventionId;
  label: string;
  role: "remedy" | "risk-factor" | "context";
  sources: string[];
  outcomes: ApproachOutcome[];
  strength: { score: number; grade: Grade };
  note: Cited;
  lever?: keyof Levers;
}

export interface Recurring { intervention: InterventionId; outcome: OutcomeId; direction: Finding["direction"]; sources: string[]; statement: string }
export interface Conflict { intervention: InterventionId; outcome: OutcomeId; sides: { direction: Finding["direction"]; sources: string[]; context?: string }[]; statement: string }
export interface GeoSuggestion { code: string; name: string; reason: string; layer: IndicatorId; values: { id: IndicatorId; value: number }[] }

export interface SourceRef { id: string; title: string; type: Evidence["type"]; year: number; provenance: Evidence["provenance"]; score: number; explanation: string }

export interface CopilotAnswer {
  question: string;
  understanding: QueryUnderstanding;
  mode: "deterministic" | "llm";
  provider: string;
  model?: string;
  sources: SourceRef[];
  summary: Cited[];
  approaches: Approach[];
  recurring: Recurring[];
  conflicts: Conflict[];
  datasets: { id: string; title: string; provenance: Evidence["provenance"] }[];
  instruments: { id: string; title: string; type: Evidence["type"] }[];
  geography: GeoSuggestion[];
  labPreset: { region: string; levers: Partial<Levers>; interventions: InterventionId[]; rationale: string };
  limitations: string[];
  trace: { retrievalMs: number; synthesisMs: number; llmMs?: number; retrieved: number; note?: string };
}

/** Is a finding direction good news for this outcome? */
export function beneficial(outcome: OutcomeId, direction: Finding["direction"]): boolean | null {
  if (direction === "mixed" || direction === "no-effect") return null;
  const lowerIsBetter: OutcomeId[] = ["dispute-incidence", "processing-time", "land-use-change"];
  return lowerIsBetter.includes(outcome) ? direction === "decrease" : direction === "increase";
}

const DIR_WORD: Record<Finding["direction"], string> = { decrease: "a decrease", increase: "an increase", "no-effect": "no measurable effect", mixed: "mixed effects" };

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function effectLabel(fs: Finding[]): string | undefined {
  const withEff = fs.filter((f) => f.effect && f.effect.per);
  if (!withEff.length) return undefined;
  // group by (unit, per) and take the most common
  const groups = new Map<string, number[]>();
  for (const f of withEff) {
    const k = `${f.effect!.unit}|${f.effect!.per}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(f.effect!.value);
  }
  const [key, vals] = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const [unit, per] = key.split("|");
  const m = median(vals);
  const sign = m > 0 ? "+" : m < 0 ? "−" : "";
  return `${vals.length > 1 ? "median " : ""}${sign}${Math.abs(m)}${unit === "%" ? "%" : ` ${unit}`} ${per.startsWith("per ") ? per : `per ${per}`}`;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const verb = (n: number, v: string) => (n === 1 ? `${v}s` : v);

const LEVER_OF: Partial<Record<InterventionId, keyof Levers>> = {
  "record-digitization": "digitization",
  "e-mutation": "digitization",
  "dispute-resolution": "disputeCapacity",
  zoning: "zoning",
  "climate-adaptation": "climateInvestment",
  infrastructure: "infrastructure",
};

const CONCEPT_LAYERS: [string[], IndicatorId, string][] = [
  [["land-disputes", "litigation", "revenue-courts", "adr", "encroachment"], "disputePressure", "high land-dispute pressure"],
  [["urban-expansion", "peri-urban", "land-pooling", "land-value"], "urbanGrowth", "rapid built-up growth"],
  [["land-conversion", "zoning", "land-use-planning", "lulc"], "landUsePressure", "high conversion pressure"],
  [["climate-vulnerability", "flood", "drought", "cyclone", "land-degradation", "watershed"], "climateVulnerability", "high climate vulnerability"],
  [["mutation", "service-delivery", "administrative-capacity"], "mutationDays", "slow mutation"],
  [["digitization", "land-records", "dilrmp", "cadastral-map", "ulpin"], "mapLinkage", "low record–map linkage"],
  [["gender", "inheritance"], "womenOwnership", "low women's ownership"],
];

export function suggestGeography(u: QueryUnderstanding, limit = 5): GeoSuggestion[] {
  const cids = new Set(u.concepts.filter((c) => c.weight >= 0.5).map((c) => c.id));
  const layers = CONCEPT_LAYERS.filter(([cs]) => cs.some((c) => cids.has(c)));
  const use = layers.length ? layers.slice(0, 2) : [CONCEPT_LAYERS[0]];
  const stateFilter = u.regions.map((r) => regionByCode[r.code]).find((r) => r?.level === "state")?.code;
  const pool = DISTRICTS.filter((d) => !stateFilter || d.parent === stateFilter);
  const stats = use.map(([, id]) => {
    const vals = pool.map((d) => d.indicators[id]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const def = indicatorById[id];
    return { id, min, max, invert: def.higherIsBetter };
  });
  const scored = pool.map((d) => {
    let s = 1;
    for (const st of stats) {
      let n = (d.indicators[st.id] - st.min) / (st.max - st.min || 1);
      if (st.invert) n = 1 - n;
      s *= 0.15 + n;
    }
    return { d, s };
  });
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ d }) => ({
      code: d.code,
      name: `${d.name}, ${regionByCode[d.parent!]?.name}`,
      reason: use.map(([, id, why]) => `${why} (${indicatorById[id].short.toLowerCase()} ${d.indicators[id].toFixed(indicatorById[id].decimals)}${indicatorById[id].unit === "%" ? "%" : ""})`).join(" and "),
      layer: use[0][1],
      values: use.map(([, id]) => ({ id, value: d.indicators[id] })),
    }));
}

export function synthesise(question: string, retrieval: SearchResponse, opts: { regionCode?: string } = {}): CopilotAnswer {
  const t0 = performance.now();
  const u = retrieval.understanding;
  const hits = retrieval.hits.slice(0, 14);
  const docs = hits.map((h) => evidenceById[h.id]).filter(Boolean);
  const scoreOf = new Map(hits.map((h) => [h.id, h.score]));
  const regionCode = opts.regionCode ?? u.regions[0]?.code;

  // ---- group findings by intervention, weighted by retrieval score
  const byIv = new Map<InterventionId, { sources: Set<string>; findings: { f: Finding; src: string }[]; weight: number }>();
  for (const d of docs) {
    for (const f of d.findings) {
      const g = byIv.get(f.intervention) ?? { sources: new Set(), findings: [], weight: 0 };
      g.sources.add(d.id);
      g.findings.push({ f, src: d.id });
      g.weight += (scoreOf.get(d.id) ?? 0.1) * (u.outcomes.length && u.outcomes.includes(f.outcome) ? 1.5 : 1);
      byIv.set(f.intervention, g);
    }
  }
  // the outcome(s) the question is about, primary first (earliest mention in the question);
  // default to the most frequent outcome among retrieved findings
  const lowerQ = question.toLowerCase();
  const posOf = (o: OutcomeId) => {
    const idx = u.concepts.filter((c) => c.via === "direct" && outcomeById[o].concepts.includes(c.id)).map((c) => lowerQ.indexOf(c.matched.toLowerCase())).filter((i) => i >= 0);
    return idx.length ? Math.min(...idx) : 999;
  };
  const focusOutcomes: OutcomeId[] = u.outcomes.length
    ? [...u.outcomes].sort((a, b) => posOf(a) - posOf(b))
    : ([...docs.flatMap((d) => d.findings.map((f) => f.outcome)).reduce((m, o) => m.set(o, (m.get(o) ?? 0) + 1), new Map<OutcomeId, number>())].sort((a, b) => b[1] - a[1]).slice(0, 1).map(([o]) => o));
  const primary = focusOutcomes[0];

  const approaches: Approach[] = [...byIv.entries()]
    .map(([iv, g]) => {
      const outcomes = new Map<OutcomeId, { f: Finding; src: string }[]>();
      for (const it of g.findings) (outcomes.get(it.f.outcome) ?? outcomes.set(it.f.outcome, []).get(it.f.outcome)!).push(it);
      const outs: ApproachOutcome[] = [...outcomes.entries()].map(([o, items]) => {
        const fs = items.map((i) => i.f);
        const counts = new Map<Finding["direction"], number>();
        for (const f of fs) counts.set(f.direction, (counts.get(f.direction) ?? 0) + 1);
        const [topDir, topN] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        // majority direction if ≥ 60% of findings agree; otherwise "mixed"
        const direction: Finding["direction"] = topN / fs.length >= 0.6 ? topDir : "mixed";
        return { outcome: o, direction, beneficial: beneficial(o, direction), n: fs.length, agree: direction === "mixed" ? 0 : topN, effect: effectLabel(fs.filter((f) => f.direction === direction)) };
      }).sort((a, b) => focusOutcomes.indexOf(a.outcome) + (focusOutcomes.includes(a.outcome) ? 0 : 99) - (focusOutcomes.indexOf(b.outcome) + (focusOutcomes.includes(b.outcome) ? 0 : 99)) || b.n - a.n);
      const sources = [...g.sources];
      const strength = bodyStrength(sources, regionCode);
      const main = outs[0];
      const onPrimary = outs.find((o) => o.outcome === primary);
      const role: Approach["role"] = onPrimary?.beneficial ? "remedy" : onPrimary?.beneficial === false ? "risk-factor" : outs.some((o) => focusOutcomes.includes(o.outcome) && o.beneficial) ? "remedy" : "context";
      const agreeTxt = main.n > 1 ? ` (${main.agree || "no clear majority"} of ${main.n} findings agree)` : "";
      const note: Cited = {
        text: `${plural(sources.length, "source")} ${verb(sources.length, "link")} ${interventionById[iv].short.toLowerCase()} to ${DIR_WORD[main.direction]} in ${outcomeById[main.outcome].label.toLowerCase()}${main.effect ? `, ${main.effect}` : ""}${agreeTxt}${outs.length > 1 ? `; also examined for ${outs.slice(1, 3).map((o) => outcomeById[o.outcome].short.toLowerCase()).join(" and ")}` : ""}.`,
        cites: sources,
      };
      const rank = (role === "remedy" ? 2 : role === "context" ? 1 : 0) + (onPrimary?.beneficial ? 1 : 0);
      return { intervention: iv, label: interventionById[iv].label, role, sources, outcomes: outs, strength, note, lever: LEVER_OF[iv], _rank: rank, _w: g.weight * (0.5 + strength.score) };
    })
    .sort((a, b) => b._rank - a._rank || b._w - a._w)
    .slice(0, 6)
    .map(({ _w, _rank, ...rest }) => { void _w; void _rank; return rest; });

  // ---- recurring and conflicting findings
  const pairs = new Map<string, { iv: InterventionId; o: OutcomeId; items: { f: Finding; src: string }[] }>();
  for (const d of docs) for (const f of d.findings) {
    const k = `${f.intervention}|${f.outcome}`;
    const p = pairs.get(k) ?? { iv: f.intervention, o: f.outcome, items: [] };
    p.items.push({ f, src: d.id });
    pairs.set(k, p);
  }
  const recurring: Recurring[] = [];
  const conflicts: Conflict[] = [];
  for (const p of pairs.values()) {
    const byDir = new Map<Finding["direction"], { sources: Set<string>; ctx?: string }>();
    for (const { f, src } of p.items) {
      const x = byDir.get(f.direction) ?? { sources: new Set<string>(), ctx: f.context };
      x.sources.add(src);
      if (!x.ctx && f.context) x.ctx = f.context;
      byDir.set(f.direction, x);
    }
    const dominant = [...byDir.entries()].sort((a, b) => b[1].sources.size - a[1].sources.size)[0];
    if (dominant && dominant[1].sources.size >= 2) {
      recurring.push({
        intervention: p.iv, outcome: p.o, direction: dominant[0], sources: [...dominant[1].sources],
        statement: `${dominant[1].sources.size} independent sources associate ${interventionById[p.iv].short.toLowerCase()} with ${DIR_WORD[dominant[0]]} in ${outcomeById[p.o].label.toLowerCase()}.`,
      });
    }
    const directional = [...byDir.keys()].filter((d) => d !== "mixed");
    const disagree = byDir.size > 1 && (directional.length > 1 || byDir.has("mixed"));
    if (disagree) {
      const sides = [...byDir.entries()].map(([direction, v]) => ({ direction, sources: [...v.sources], context: v.ctx }));
      const minority = sides.sort((a, b) => b.sources.length - a.sources.length)[sides.length - 1];
      conflicts.push({
        intervention: p.iv, outcome: p.o, sides,
        statement: `On ${interventionById[p.iv].short.toLowerCase()} → ${outcomeById[p.o].short.toLowerCase()}, ${sides[0].sources.length} source(s) find ${DIR_WORD[sides[0].direction]} but ${minority.sources.join(", ")} report${minority.sources.length > 1 ? "" : "s"} ${DIR_WORD[minority.direction]}${minority.context ? ` — ${minority.context.replace(/\.$/, "").toLowerCase()}` : ""}.`,
      });
    }
  }
  recurring.sort((a, b) => b.sources.length - a.sources.length);

  // ---- datasets
  const dsIds = new Set<string>();
  for (const d of docs) if (d.type === "dataset") dsIds.add(d.id);
  for (const d of docs) for (const id of d.datasets) dsIds.add(id);
  const datasets = [...dsIds].map((id) => evidenceById[id]).filter(Boolean).slice(0, 6).map((d) => ({ id: d.id, title: d.title, provenance: d.provenance }));

  // ---- geography
  const geography = suggestGeography(u);

  // ---- policy instruments linked to the retrieved evidence (laws, programmes)
  const instScore = new Map<string, number>();
  for (const d of docs) {
    if (d.type === "policy" || d.type === "law") instScore.set(d.id, (instScore.get(d.id) ?? 0) + 3);
    for (const id of d.related) if (/^(PO|LW)-/.test(id)) instScore.set(id, (instScore.get(id) ?? 0) + 1);
  }
  const instruments = [...instScore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => evidenceById[id]).filter(Boolean).map((e) => ({ id: e.id, title: e.title, type: e.type }));

  // ---- policy lab preset: levers for the best-supported remedies
  const presetRegion = regionCode ?? geography[0]?.code ?? "IN";
  const levers: Partial<Levers> = { rolloutYears: 3 };
  const used: InterventionId[] = [];
  const questionAboutInfra = u.interventions.includes("infrastructure");
  for (const a of approaches) {
    if (!a.lever || used.length >= 3) continue;
    if (a.lever === "infrastructure" && !questionAboutInfra) continue;
    if (a.role !== "remedy" && a.lever !== "infrastructure") continue;
    if (used.some((u2) => LEVER_OF[u2] === a.lever)) continue;
    const r = getRegion(presetRegion);
    if (a.lever === "digitization") levers.digitization = 20;
    if (a.lever === "disputeCapacity") levers.disputeCapacity = 40;
    if (a.lever === "climateInvestment") levers.climateInvestment = 10;
    if (a.lever === "infrastructure") levers.infrastructure = 20;
    if (a.lever === "zoning" && r) {
      // stay below the over-strict threshold (A05) where zoning starts to generate informal disputes
      const z = Math.round(r.indicators.zoningStrictness);
      if (z >= 68) continue;
      levers.zoning = Math.min(70, z + 15);
    }
    used.push(a.intervention);
  }
  if (!used.length) { levers.digitization = 20; levers.disputeCapacity = 30; used.push("record-digitization", "dispute-resolution"); }

  // ---- summary (deterministic, cited)
  const nStudies = docs.filter((d) => d.type === "research" || d.type === "case-study" || d.type === "report").length;
  const nNorm = docs.filter((d) => d.type === "policy" || d.type === "law").length;
  const nData = docs.filter((d) => d.type === "dataset").length;
  const remedies = approaches.filter((a) => a.role === "remedy");
  const risks = approaches.filter((a) => a.role === "risk-factor");
  const summary: Cited[] = [];
  const groups = [
    nStudies ? plural(nStudies, "study, case or report", "studies, cases and reports") : "",
    nNorm ? plural(nNorm, "policy or law", "policies and laws") : "",
    nData ? plural(nData, "dataset") : "",
  ].filter(Boolean).join("; ");
  const linkedInstruments = instruments.filter((i) => !docs.some((d) => d.id === i.id)).length;
  const lcFirst = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
  summary.push({
    text: `Retrieved ${plural(docs.length, "source")} (${groups})${linkedInstruments ? `, linked to ${plural(linkedInstruments, "policy instrument")}` : ""}. ${remedies.length ? `${plural(remedies.length, "policy approach", "policy approaches")} show${remedies.length === 1 ? "s" : ""} evidence of improving ${primary ? outcomeById[primary].label.toLowerCase() : "the outcome in question"}` : "No approach shows consistent improvement in the outcome in question"}${risks.length ? `, while ${risks.map((r) => lcFirst(r.label)).join(" and ")} ${risks.length === 1 ? "acts" : "act"} as a risk factor` : ""}.`,
    cites: docs.slice(0, 4).map((d) => d.id),
  });
  for (const a of remedies.slice(0, 3)) {
    const main = a.outcomes[0];
    summary.push({
      text: `${a.label} has ${a.strength.grade.toLowerCase()}-strength support: ${plural(a.sources.length, "source")} ${verb(a.sources.length, "associate")} it with ${DIR_WORD[main.direction]} in ${outcomeById[main.outcome].label.toLowerCase()}${main.effect ? ` (${main.effect})` : ""}${main.n > 1 ? `, with ${main.agree} of ${main.n} findings agreeing` : ""}.`,
      cites: a.sources.slice(0, 5),
    });
  }
  for (const a of risks.slice(0, 1)) {
    const main = a.outcomes.find((o) => o.outcome === primary) ?? a.outcomes[0];
    summary.push({ text: `${a.label} works the other way: ${plural(a.sources.length, "source")} ${verb(a.sources.length, "link")} it to ${DIR_WORD[main.direction]} in ${outcomeById[main.outcome].label.toLowerCase()}${main.effect ? ` (${main.effect})` : ""}, which reforms in growing districts need to offset.`, cites: a.sources.slice(0, 5) });
  }
  if (conflicts[0]) summary.push({ text: `Evidence is contested: ${conflicts[0].statement.charAt(0).toLowerCase()}${conflicts[0].statement.slice(1)}`, cites: conflicts[0].sides.flatMap((s) => s.sources).slice(0, 5) });
  if (geography.length) summary.push({ text: `In the demonstration dataset this matters most in ${geography.slice(0, 3).map((g) => g.name).join("; ")} — districts with ${geography[0].reason.replace(/ \([^)]*\)/g, "")}.`, cites: ["DS-011"] });

  // ---- limitations
  const limitations: string[] = [];
  const synth = docs.filter((d) => d.provenance === "synthetic").length;
  if (synth) limitations.push(`${synth} of ${docs.length} retrieved sources are demonstration records with illustrative findings; reference records (laws, programmes, portals) carry metadata only.`);
  const causal = approaches.filter((a) => !a.sources.some((id) => ["quasi-experimental", "rct", "systematic-review"].includes(evidenceById[id]?.design)));
  if (causal.length) limitations.push(`No causal-design evidence (L1–L2) was retrieved for: ${causal.map((a) => a.label.toLowerCase()).join("; ")}.`);
  if (conflicts.length) limitations.push(`${conflicts.length} intervention–outcome pair${conflicts.length > 1 ? "s show" : " shows"} conflicting findings; see the conflicts panel before relying on a single estimate.`);
  if (regionCode && regionCode !== "IN") {
    const local = docs.filter((d) => d.geography.regions.some((r) => r === regionCode || regionByCode[r]?.parent === regionCode || regionByCode[regionCode]?.parent === r));
    if (local.length < 3) limitations.push(`Only ${local.length} source${local.length === 1 ? "" : "s"} directly cover ${regionLabel(regionCode)}; most evidence is transferred from other states.`);
  }

  const t1 = performance.now();
  return {
    question,
    understanding: u,
    mode: "deterministic",
    provider: "deterministic",
    sources: hits.map((h: SearchHit) => {
      const e = evidenceById[h.id];
      return { id: h.id, title: e.title, type: e.type, year: e.year, provenance: e.provenance, score: h.score, explanation: h.explanation };
    }),
    summary,
    approaches,
    recurring: recurring.slice(0, 5),
    conflicts: conflicts.slice(0, 4),
    datasets,
    instruments,
    geography,
    labPreset: { region: presetRegion, levers, interventions: used, rationale: `Levers set from the ${used.length} best-supported approaches (${used.map((i) => interventionById[i].short.toLowerCase()).join(", ")}) for ${regionLabel(presetRegion)}.` },
    limitations,
    trace: { retrievalMs: retrieval.tookMs, synthesisMs: Math.round((t1 - t0) * 10) / 10, retrieved: retrieval.total },
  };
}
