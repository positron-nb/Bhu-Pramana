import { assumptionById } from "@/data/assumptions";
import { evidenceById } from "@/data/evidence";
import type { OutputId, Region } from "@/lib/domain/schemas";
import { geographicRelevance, gradeOf, sourceWeight, type Grade } from "@/lib/evidence/strength";
import { outputById, type SimulationResult } from "./model";
import { headlineOutput, OUTCOME_PHRASE } from "./decision";

/**
 * Evidence chain behind a scenario result — the traceable "why this number":
 *   studies (support / contradict) → model assumptions → projected outcomes,
 *   plus the district baseline dataset feeding every outcome.
 * Built from the simulation's own sensitivity analysis, so every edge carries
 * a real quantity (variance share) rather than a drawn relationship.
 */

export type ChainKind = "study" | "dataset" | "assumption" | "outcome";

export interface ChainNode {
  id: string;
  col: 0 | 1 | 2;
  kind: ChainKind;
  label: string;
  sub: string;
  contradicts?: boolean;
  local?: boolean;
  grade?: Grade;
  delta?: number;
  improves?: boolean | null;
  synthetic?: boolean;
}

export interface ChainEdge {
  from: string;
  to: string;
  kind: "supports" | "contradicts" | "drives" | "baseline";
  weight: number;
}

const SECONDARY: OutputId[] = ["digitizationCoverage", "implementationScore"];

export function evidenceChain(res: SimulationResult, region: Region, prefer?: OutputId): { nodes: ChainNode[]; edges: ChainEdge[] } {
  const h = headlineOutput(res, prefer);
  if (!h) return { nodes: [], edges: [] };
  const moved = res.outputs.filter((o) => o.improves !== null && o.id !== h.id && Math.abs(o.deltaPct) >= 1);
  const outputs = [h, ...moved.filter((o) => !SECONDARY.includes(o.id)), ...moved.filter((o) => SECONDARY.includes(o.id))].slice(0, 4);

  // which assumptions drive the shown outcomes (headline counts double)
  const weight = new Map<string, number>();
  for (const o of outputs) for (const s of o.sensitivity) weight.set(s.assumption, (weight.get(s.assumption) ?? 0) + s.share * (o.id === h.id ? 2 : 1));
  const assumptions = [...weight.entries()].filter(([, w]) => w > 0.05).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => assumptionById[id]);

  const nodes: ChainNode[] = [];
  const edges: ChainEdge[] = [];
  const studyIds: string[] = [];
  const contra = new Set<string>();
  for (const a of assumptions) {
    const sup = [...a.supporting].filter((id) => evidenceById[id]).sort((x, y) => sourceWeight(evidenceById[y], region.code) - sourceWeight(evidenceById[x], region.code)).slice(0, 3);
    for (const id of [...sup, ...a.contradicting]) if (!studyIds.includes(id)) studyIds.push(id);
    for (const id of a.contradicting) contra.add(id);
  }
  // contradicting evidence first — it is what the decision-maker most needs to see
  const shown = [...studyIds.filter((id) => contra.has(id)), ...studyIds.filter((id) => !contra.has(id))].slice(0, 8);

  nodes.push({ id: "DS-011", col: 0, kind: "dataset", label: `${region.name} baseline indicators`, sub: "DS-011 · 2019–2025 panel", synthetic: true });
  for (const id of shown) {
    const e = evidenceById[id];
    nodes.push({
      id, col: 0, kind: "study", label: e.title, sub: `${id} · ${e.type === "case-study" ? "Case study" : e.type === "report" ? "Report" : e.design.replace("-", " ")} · ${e.year}`,
      contradicts: contra.has(id), local: region.level !== "country" && geographicRelevance(e, region.code) >= 0.9, synthetic: e.provenance === "synthetic",
    });
  }
  for (const a of assumptions) {
    const g = res.assumptionStrengths[a.id];
    nodes.push({ id: a.id, col: 1, kind: "assumption", label: a.label, sub: `${a.id} · ${a.central > 0 ? "+" : ""}${a.central} ${a.unit.split(" ")[0]} · evidence ${Math.round(g.score * 100)}`, grade: gradeOf(g.score) });
    for (const id of a.supporting) if (shown.includes(id)) edges.push({ from: id, to: a.id, kind: "supports", weight: 1 });
    for (const id of a.contradicting) if (shown.includes(id)) edges.push({ from: id, to: a.id, kind: "contradicts", weight: 1 });
  }
  for (const o of outputs) {
    const def = outputById[o.id];
    nodes.push({ id: `O:${o.id}`, col: 2, kind: "outcome", label: OUTCOME_PHRASE[o.id].charAt(0).toUpperCase() + OUTCOME_PHRASE[o.id].slice(1), sub: `${o.baseline.toFixed(def.decimals)} → ${o.scenario.toFixed(def.decimals)} ${def.unit === "index" || def.unit === "score" ? "" : def.unit}`.trim(), delta: o.deltaPct, improves: o.improves, grade: o.grade ?? undefined });
    edges.push({ from: "DS-011", to: `O:${o.id}`, kind: "baseline", weight: 0.4 });
    for (const s of o.sensitivity) if (assumptions.some((a) => a.id === s.assumption) && s.share > 0.02) edges.push({ from: s.assumption, to: `O:${o.id}`, kind: "drives", weight: s.share });
  }
  return { nodes, edges };
}
