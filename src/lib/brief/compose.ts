import { assumptionById, ASSUMPTIONS } from "@/data/assumptions";
import { evidenceById } from "@/data/evidence";
import { indicatorById } from "@/data/indicators";
import { interventionById, outcomeById } from "@/data/taxonomy";
import type { IndicatorId, Levers, OutputId, Role } from "@/lib/domain/schemas";
import { DATA_NOTICE, getRegion, NATIONAL, REGION_YEARS, regionByCode, regionLabel, stateOf } from "@/lib/data/regions";
import { assumptionStrength, DESIGN_LABEL, evidenceLevel, sourceWeight } from "@/lib/evidence/strength";
import type { Cited, CopilotAnswer } from "@/lib/ai/copilot";
import { LEVERS, MODEL_VERSION, OUTPUTS, simulate, statusQuoLevers } from "@/lib/sim/model";
import { decide, type Verdict } from "@/lib/sim/decision";

export interface BriefInput {
  question: string;
  regionCode: string;
  evidenceIds: string[];
  levers: Levers;
  role: Role;
  /** Optional synthesis (possibly LLM-phrased) to use for the evidence summary. */
  synthesis?: Pick<CopilotAnswer, "summary" | "mode" | "provider" | "model" | "conflicts" | "approaches">;
  notes?: string[];
  createdAt?: string;
}

export interface BriefIndicatorRow { id: IndicatorId; label: string; unit: string; region: number; state?: number; national: number; trend?: number[]; better: "higher" | "lower"; cite: string }
export interface BriefStudyRow { id: string; title: string; design: string; level: string; year: number; where: string; finding: string; weight: number; provenance: string }
export interface BriefOutputRow { id: OutputId; label: string; unit: string; decimals: number; baseline: number; scenario: number; deltaPct: number; low: number; high: number; grade: string | null; improves: boolean | null; baseSeries: number[]; scenSeries: number[] }
export interface BriefAssumptionRow { id: string; label: string; central: number; low: number; high: number; unit: string; grade: string; score: number; supporting: string[]; contradicting: string[] }
export interface BriefReference { n: number; id: string; title: string; source: string; year: number; type: string; provenance: string; url?: string }

export interface Brief {
  id: string;
  fingerprint: string;
  title: string;
  question: string;
  region: { code: string; name: string; level: string };
  createdAt: string;
  role: Role;
  synthesisMode: string;
  keyMessages: Cited[];
  baseline: { narrative: Cited[]; rows: BriefIndicatorRow[] };
  evidenceSummary: Cited[];
  studies: BriefStudyRow[];
  scenario: { levers: { label: string; value: string; statusQuo: string; changed: boolean }[]; assumptions: BriefAssumptionRow[] };
  simulation: { years: number[]; outputs: BriefOutputRow[]; confidence: { score: number | null; grade: string | null }; diagnostics: { efficiency: number; overload: number } };
  decision: { verdict: Verdict; label: string; headline: string; nextStudy: string | null; headlineOutput: OutputId | null };
  insight: Cited[];
  limitations: string[];
  furtherResearch: { question: string; assumption: string; why: string }[];
  references: BriefReference[];
  notes: string[];
  modelVersion: string;
  dataNotice: string;
}

/** FNV-1a — stable fingerprint of the brief's inputs (reproducibility, not security). */
export function fingerprint(s: string): string {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 ^ s.charCodeAt(s.length - 1 - i), 2246822519);
  }
  const hex = (n: number) => (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `BP-${hex(h1).slice(0, 4)}-${hex(h1).slice(4)}-${hex(h2).slice(0, 4)}`;
}

const OUTPUT_INDICATOR: Partial<Record<OutputId, IndicatorId>> = {
  disputePressure: "disputePressure",
  processingDays: "mutationDays",
  digitizationCoverage: "digitization",
  landUsePressure: "landUsePressure",
  climateResilience: "climateResilience",
};

export function composeBrief(input: BriefInput): Brief {
  const region = getRegion(input.regionCode) ?? NATIONAL;
  const st = stateOf(region.code);
  const evidence = [...new Set(input.evidenceIds)].map((id) => evidenceById[id]).filter(Boolean);
  const sim = simulate(region, input.levers, 5);
  const sq = statusQuoLevers(region);

  // indicators relevant to moved outputs + headline set
  const movedOutputs = sim.outputs.filter((o) => o.improves !== null).map((o) => o.id);
  const indIds = [...new Set<IndicatorId>([
    ...movedOutputs.map((o) => OUTPUT_INDICATOR[o]).filter((x): x is IndicatorId => !!x),
    "disputePressure", "digitization", "mutationDays", "urbanGrowth", "climateVulnerability", "adminCapacity",
  ])].slice(0, 8);
  const rows: BriefIndicatorRow[] = indIds.map((id) => {
    const def = indicatorById[id];
    return {
      id, label: def.label, unit: def.unit, region: region.indicators[id], state: st && st.code !== region.code ? st.indicators[id] : undefined,
      national: NATIONAL.indicators[id], trend: region.series[id], better: def.higherIsBetter ? "higher" : "lower", cite: "DS-011",
    };
  });

  const fmt = (id: IndicatorId, v: number) => `${v.toFixed(indicatorById[id].decimals)}${indicatorById[id].unit === "%" ? "%" : indicatorById[id].unit === "days" ? " days" : ""}`;
  const compare = (id: IndicatorId) => {
    const v = region.indicators[id], n = NATIONAL.indicators[id];
    const def = indicatorById[id];
    const worse = def.higherIsBetter ? v < n : v > n;
    return `${def.short.toLowerCase()} is ${fmt(id, v)} (${worse ? "worse than" : "better than"} the national ${fmt(id, n)})`;
  };
  const trendTxt = (id: IndicatorId) => {
    const s = region.series[id];
    if (!s) return "";
    return `${indicatorById[id].short.toLowerCase()} moved from ${fmt(id, s[0])} in ${REGION_YEARS[0]} to ${fmt(id, s[s.length - 1])} in ${REGION_YEARS[REGION_YEARS.length - 1]}`;
  };
  const baselineNarrative: Cited[] = [
    { text: `In ${regionLabel(region.code)}, ${compare("disputePressure")}, ${compare("digitization")} and ${compare("mutationDays")}.`, cites: ["DS-011"] },
    { text: `Between ${REGION_YEARS[0]} and ${REGION_YEARS[REGION_YEARS.length - 1]}, ${trendTxt("disputePressure")} while ${trendTxt("digitization")}; built-up area is growing ${region.indicators.urbanGrowth.toFixed(1)}% a year and climate vulnerability is ${region.indicators.climateVulnerability.toFixed(2)}.`, cites: ["DS-011", ...(region.indicators.urbanGrowth > 4 ? ["DS-013"] : []), ...(region.indicators.climateVulnerability > 0.65 ? ["DS-014"] : [])] },
  ];

  // studies table
  const studies: BriefStudyRow[] = evidence
    .filter((e) => e.type === "research" || e.type === "case-study" || e.type === "report")
    .map((e) => {
      const f = e.findings[0];
      return {
        id: e.id, title: e.title, design: e.type === "case-study" ? "Case study" : e.type === "report" ? "Report" : DESIGN_LABEL[e.design], level: evidenceLevel(e.design).level, year: e.year,
        where: e.geography.regions.slice(0, 3).map((r) => regionByCode[r]?.name ?? r).join(", "), finding: f?.statement ?? e.summary, weight: Math.round(sourceWeight(e, region.code) * 100) / 100, provenance: e.provenance,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  // evidence summary — use provided synthesis, else build from findings of attached evidence
  let evidenceSummary: Cited[] = input.synthesis?.summary?.filter((s) => !s.text.startsWith("Retrieved")) ?? [];
  if (!evidenceSummary.length) {
    const byPair = new Map<string, { iv: string; o: string; dir: string; ids: string[] }>();
    for (const e of evidence) for (const f of e.findings) {
      const k = `${f.intervention}|${f.outcome}|${f.direction}`;
      const p = byPair.get(k) ?? { iv: f.intervention, o: f.outcome, dir: f.direction, ids: [] };
      if (!p.ids.includes(e.id)) p.ids.push(e.id);
      byPair.set(k, p);
    }
    evidenceSummary = [...byPair.values()].sort((a, b) => b.ids.length - a.ids.length).slice(0, 5).map((p) => ({
      text: `${p.ids.length} source${p.ids.length > 1 ? "s" : ""} associate ${interventionById[p.iv as keyof typeof interventionById].short.toLowerCase()} with ${p.dir === "decrease" ? "lower" : p.dir === "increase" ? "higher" : p.dir === "mixed" ? "mixed effects on" : "no measurable change in"} ${outcomeById[p.o as keyof typeof outcomeById].label.toLowerCase()}.`,
      cites: p.ids,
    }));
  }

  // scenario
  const leverRows = LEVERS.map((l) => {
    const v = input.levers[l.id];
    const s = sq[l.id];
    const show = (x: number) => (l.id === "rolloutYears" ? `${x} years` : l.id === "zoning" ? `${x} / 100` : `${l.unit.startsWith("+") ? "+" : ""}${x}${l.unit.replace("+", "").startsWith("%") ? "%" : ` ${l.unit.replace("+", "")}`}`);
    return { label: l.label, value: show(v), statusQuo: show(s), changed: v !== s };
  });
  const usedAssumptions = new Set<string>();
  for (const o of sim.outputs) if (o.improves !== null) for (const r of o.sensitivity) if (r.share > 0.02) usedAssumptions.add(r.assumption);
  const assumptions: BriefAssumptionRow[] = ASSUMPTIONS.filter((a) => usedAssumptions.has(a.id)).map((a) => {
    const s = assumptionStrength(a, region.code);
    return { id: a.id, label: a.label, central: a.central, low: a.low, high: a.high, unit: a.unit, grade: s.grade, score: Math.round(s.score * 100) / 100, supporting: a.supporting, contradicting: a.contradicting };
  });

  const outputs: BriefOutputRow[] = OUTPUTS.map((def) => {
    const o = sim.outputs.find((x) => x.id === def.id)!;
    return { id: def.id, label: def.label, unit: def.unit, decimals: def.decimals, baseline: o.baseline, scenario: o.scenario, deltaPct: o.deltaPct, low: o.low, high: o.high, grade: o.grade, improves: o.improves, baseSeries: sim.baseline.values[def.id], scenSeries: sim.scenario.values[def.id] };
  });

  // decision: the same evidence-to-decision rule the casefile shows
  const decision = decide(sim, region, input.levers);
  const insight: Cited[] = decision.reasons;

  // key messages (top of brief)
  const keyMessages: Cited[] = [];
  if (decision.verdict !== "none") {
    keyMessages.push({ text: `${decision.label}. ${decision.headline}`, cites: [...(decision.driver ? [decision.driver.assumption.id] : []), ...(decision.driver?.localContradicting ?? [])] });
  }
  const remedies = input.synthesis?.approaches?.filter((a) => a.role === "remedy").slice(0, 2);
  if (remedies?.length) keyMessages.push({ text: `The strongest-supported approaches in the retrieved evidence are ${remedies.map((a) => `${a.label.charAt(0).toLowerCase() + a.label.slice(1)} (${a.strength.grade.toLowerCase()} strength)`).join(" and ")}.`, cites: remedies.flatMap((a) => a.sources.slice(0, 3)) });
  if (decision.nextStudy) keyMessages.push({ text: `What would change this decision: ${decision.nextStudy.charAt(0).toLowerCase() + decision.nextStudy.slice(1)}`, cites: decision.driver ? [decision.driver.assumption.id] : [] });
  if (sim.confidence.grade) keyMessages.push({ text: `Overall evidence confidence is ${sim.confidence.grade.toLowerCase()} (${Math.round((sim.confidence.score ?? 0) * 100)}/100): this is an illustrative scenario, not an official forecast.`, cites: [] });

  // limitations
  const limitations: string[] = [
    `${DATA_NOTICE}. Indicator values, study findings and effect sizes in this prototype are synthetic and illustrative.`,
    "The simulation model is a transparent deterministic scenario model with evidence-derived coefficients; it does not estimate causal effects and is not an official forecast.",
  ];
  const weak = assumptions.filter((a) => a.grade === "Low" || a.grade === "Very low");
  if (weak.length) limitations.push(`Result depends on weakly evidenced assumptions: ${weak.map((a) => `${a.id} (${a.label}, ${a.grade.toLowerCase()})`).join("; ")}.`);
  const conflicted = assumptions.filter((a) => a.contradicting.length);
  if (conflicted.length) limitations.push(`Contradicting evidence exists for ${conflicted.map((a) => a.id).join(", ")}; see references ${conflicted.flatMap((a) => a.contradicting).join(", ")}.`);
  const nonLocal = studies.filter((s) => s.weight < 0.5).length;
  if (studies.length && nonLocal / studies.length > 0.4) limitations.push(`${nonLocal} of ${studies.length} supporting studies come from other geographies or weaker designs and were down-weighted for ${region.name}.`);
  if (input.synthesis?.mode === "llm") limitations.push(`Evidence-summary wording was drafted by an LLM (${input.synthesis.model}) and validated to cite only retrieved sources.`);

  const furtherResearch = sim.priorities.map((p) => ({
    question: p.question,
    assumption: `${p.assumption.id} · ${p.assumption.label}`,
    why: `Carries a large share of the uncertainty in ${p.drives.map((d) => OUTPUTS.find((o) => o.id === d)?.short.toLowerCase()).filter(Boolean).join(" and ") || "the projection"} and its evidence is ${p.strength >= 0.5 ? "moderate" : "weak"} (${Math.round(p.strength * 100)}/100).`,
  }));

  // references in order of first citation
  const order: string[] = [];
  const cite = (ids: string[]) => { for (const id of ids) if (!order.includes(id) && (evidenceById[id] || assumptionById[id])) order.push(id); };
  for (const c of keyMessages) cite(c.cites);
  for (const c of baselineNarrative) cite(c.cites);
  for (const c of evidenceSummary) cite(c.cites);
  cite(studies.map((s) => s.id));
  for (const a of assumptions) cite([...a.supporting, ...a.contradicting]);
  for (const c of insight) cite(c.cites);
  cite(evidence.map((e) => e.id));
  const references: BriefReference[] = order.filter((id) => evidenceById[id]).map((id, i) => {
    const e = evidenceById[id];
    return { n: i + 1, id, title: e.title, source: e.source, year: e.year, type: e.type, provenance: e.provenance, url: e.url };
  });

  const createdAt = input.createdAt ?? new Date().toISOString();
  const fp = fingerprint(JSON.stringify({ q: input.question.trim().toLowerCase(), r: region.code, e: [...input.evidenceIds].sort(), l: input.levers, m: MODEL_VERSION, s: input.synthesis?.mode ?? "none" }));


  return {
    id: fp,
    fingerprint: fp,
    title: `${input.question.replace(/\?$/, "")} — ${region.name}`,
    question: input.question,
    region: { code: region.code, name: regionLabel(region.code), level: region.level },
    createdAt,
    role: input.role,
    synthesisMode: input.synthesis ? `${input.synthesis.mode}${input.synthesis.model ? ` (${input.synthesis.model})` : ""}` : "deterministic",
    keyMessages,
    baseline: { narrative: baselineNarrative, rows },
    evidenceSummary,
    studies,
    scenario: { levers: leverRows, assumptions },
    simulation: { years: sim.years, outputs, confidence: { score: sim.confidence.score, grade: sim.confidence.grade }, diagnostics: { efficiency: sim.diagnostics.efficiency, overload: sim.diagnostics.overload } },
    decision: { verdict: decision.verdict, label: decision.label, headline: decision.headline, nextStudy: decision.nextStudy, headlineOutput: decision.headlineOutput?.id ?? null },
    insight,
    limitations,
    furtherResearch,
    references,
    notes: input.notes ?? [],
    modelVersion: MODEL_VERSION,
    dataNotice: DATA_NOTICE,
  };
}

/** Markdown export of a brief (for sharing / archiving). */
export function briefToMarkdown(b: Brief): string {
  const num = new Map(b.references.map((r) => [r.id, r.n]));
  const c = (x: Cited) => `${x.text}${x.cites.length ? " " + x.cites.map((id) => (num.has(id) ? `[${num.get(id)}]` : `[${id}]`)).join("") : ""}`;
  const lines: string[] = [];
  lines.push(`# ${b.title}`, "", `*Evidence-backed policy brief · ${b.fingerprint} · ${new Date(b.createdAt).toLocaleDateString("en-IN")} · ${b.dataNotice}*`, "");
  lines.push("## Key messages", ...b.keyMessages.map((k) => `- ${c(k)}`), "");
  lines.push("## 1. Policy question", b.question, "");
  lines.push("## 2. Baseline situation", ...b.baseline.narrative.map(c), "");
  lines.push("| Indicator | Region | State | National |", "|---|---|---|---|", ...b.baseline.rows.map((r) => `| ${r.label} (${r.unit}) | ${r.region} | ${r.state ?? "—"} | ${r.national} |`), "");
  lines.push("## 3. Evidence summary", ...b.evidenceSummary.map((x) => `- ${c(x)}`), "");
  lines.push("## 4. Supporting studies", "| ID | Study | Design | Year | Finding |", "|---|---|---|---|---|", ...b.studies.map((s) => `| ${s.id} | ${s.title} | ${s.design} (${s.level}) | ${s.year} | ${s.finding} |`), "");
  lines.push("## 5. Scenario assumptions", ...b.scenario.levers.filter((l) => l.changed).map((l) => `- **${l.label}:** ${l.value} (status quo ${l.statusQuo})`), "", "| Assumption | Central | Range | Evidence |", "|---|---|---|---|", ...b.scenario.assumptions.map((a) => `| ${a.id} ${a.label} | ${a.central} ${a.unit} | ${a.low} to ${a.high} | ${a.grade} (${a.score}) |`), "");
  lines.push("## 6. Simulation result (illustrative, not an official forecast)", "| Output | Baseline | Scenario | Δ | Range | Confidence |", "|---|---|---|---|---|---|", ...b.simulation.outputs.map((o) => `| ${o.label} | ${o.baseline.toFixed(o.decimals)} | ${o.scenario.toFixed(o.decimals)} | ${o.deltaPct >= 0 ? "+" : ""}${o.deltaPct.toFixed(1)}% | ${o.low.toFixed(o.decimals)}–${o.high.toFixed(o.decimals)} | ${o.grade ?? "—"} |`), "");
  lines.push(`## 7. Decision: ${b.decision.label}`, b.decision.headline, "", ...b.insight.map((x) => `- ${c(x)}`), "");
  lines.push("## 8. Limitations", ...b.limitations.map((l) => `- ${l}`), "");
  lines.push("## 9. Recommended further research", ...b.furtherResearch.map((r) => `- ${r.question} *(${r.assumption}: ${r.why})*`), "");
  lines.push("## References", ...b.references.map((r) => `${r.n}. ${r.id} — ${r.title}. ${r.source}, ${r.year}.${r.provenance === "synthetic" ? " [Demonstration record]" : ""}${r.url ? ` ${r.url}` : ""}`), "");
  lines.push(`*Model ${b.modelVersion}. Reproduce this brief with the same inputs to obtain fingerprint ${b.fingerprint}.*`);
  return lines.join("\n");
}
