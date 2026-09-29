import type { Assumption, Evidence, StudyDesign } from "@/lib/domain/schemas";
import { evidenceById } from "@/data/evidence";
import { lineage, regionByCode } from "@/lib/data/regions";

/**
 * Transparent evidence grading.
 *
 *   weight(source) = designWeight × geographicRelevance × recency
 *   strength(assumption) = [1 − Π(1 − 0.6·wᵢ)] × (1 − 0.35·contradictionShare)
 *
 * The rubric is deliberately simple so a reviewer can recompute it by hand.
 */

export const DESIGN_WEIGHT: Record<StudyDesign, number> = {
  "systematic-review": 0.95,
  rct: 0.9,
  "quasi-experimental": 0.8,
  panel: 0.65,
  "cross-sectional": 0.5,
  modelling: 0.4,
  administrative: 0.5,
  statutory: 0.5,
  "case-study": 0.35,
  qualitative: 0.35,
  "expert-opinion": 0.25,
};

export const DESIGN_LABEL: Record<StudyDesign, string> = {
  "systematic-review": "Systematic review",
  rct: "Randomised trial",
  "quasi-experimental": "Quasi-experimental",
  panel: "Panel study",
  "cross-sectional": "Cross-sectional",
  modelling: "Modelling study",
  administrative: "Administrative / official",
  statutory: "Statute",
  "case-study": "Case study",
  qualitative: "Qualitative study",
  "expert-opinion": "Expert opinion",
};

/** Evidence hierarchy level shown on cards (1 = strongest causal design). */
export function evidenceLevel(design: StudyDesign): { level: string; label: string } {
  switch (design) {
    case "systematic-review": return { level: "L1", label: "Synthesis" };
    case "rct":
    case "quasi-experimental": return { level: "L2", label: "Causal design" };
    case "panel": return { level: "L3", label: "Longitudinal" };
    case "cross-sectional":
    case "modelling": return { level: "L4", label: "Associational / modelled" };
    case "case-study":
    case "qualitative":
    case "expert-opinion": return { level: "L5", label: "Descriptive" };
    default: return { level: "N", label: "Normative / official" };
  }
}

export function recency(year: number): number {
  if (year >= 2020) return 1;
  if (year >= 2015) return 0.9;
  return 0.8;
}

/** How relevant is a source's geography to the region under analysis? */
export function geographicRelevance(e: Evidence, regionCode: string | undefined): number {
  if (!regionCode || regionCode === "IN") return e.geography.scope === "international" ? 0.6 : 1;
  const lin = lineage(regionCode); // [district, state, IN] or [state, IN]
  const regions = e.geography.regions;
  if (regions.includes(lin[0])) return 1;
  if (lin.length > 2 && regions.includes(lin[1])) return 0.9;
  if (e.geography.scope === "national") return 0.8;
  if (e.geography.scope === "international") return 0.5;
  // evidence from other states: closer if same archetypes (e.g. flood → flood)
  const target = regionByCode[lin[0]];
  const anySimilar = regions.some((c) => {
    const r = regionByCode[c];
    return r && target && r.archetypes.some((a) => target.archetypes.includes(a));
  });
  return anySimilar ? 0.7 : 0.6;
}

export function sourceWeight(e: Evidence, regionCode?: string): number {
  return DESIGN_WEIGHT[e.design] * geographicRelevance(e, regionCode) * recency(e.year);
}

export type Grade = "High" | "Moderate" | "Low" | "Very low";

export function gradeOf(score: number): Grade {
  if (score >= 0.75) return "High";
  if (score >= 0.5) return "Moderate";
  if (score >= 0.3) return "Low";
  return "Very low";
}

export interface AssumptionStrength {
  score: number;
  grade: Grade;
  supporting: { id: string; weight: number }[];
  contradicting: { id: string; weight: number }[];
  contradictionShare: number;
}

export function assumptionStrength(a: Assumption, regionCode?: string): AssumptionStrength {
  const sup = a.supporting.map((id) => ({ id, weight: evidenceById[id] ? sourceWeight(evidenceById[id], regionCode) : 0 }));
  const con = a.contradicting.map((id) => ({ id, weight: evidenceById[id] ? sourceWeight(evidenceById[id], regionCode) : 0 }));
  const combined = 1 - sup.reduce((p, s) => p * (1 - 0.6 * s.weight), 1);
  const sw = sup.reduce((s, x) => s + x.weight, 0);
  const cw = con.reduce((s, x) => s + x.weight, 0);
  const contradictionShare = sw + cw > 0 ? cw / (sw + cw) : 0;
  const score = Math.max(0, Math.min(1, combined * (1 - 0.35 * contradictionShare)));
  return { score, grade: gradeOf(score), supporting: sup, contradicting: con, contradictionShare };
}

/** Strength of a body of findings (used by the copilot for approaches). */
export function bodyStrength(ids: string[], regionCode?: string): { score: number; grade: Grade } {
  const combined = 1 - ids.reduce((p, id) => p * (1 - 0.6 * (evidenceById[id] ? sourceWeight(evidenceById[id], regionCode) : 0)), 1);
  return { score: combined, grade: gradeOf(combined) };
}
