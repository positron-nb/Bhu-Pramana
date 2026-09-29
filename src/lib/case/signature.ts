import type { Levers, Region } from "@/lib/domain/schemas";
import { NATIONAL, regionByCode, regionLabel } from "@/lib/data/regions";
import { search } from "@/lib/search/engine";
import { synthesise } from "@/lib/ai/copilot";
import { simulate, statusQuoLevers } from "@/lib/sim/model";
import { decide, type Verdict } from "@/lib/sim/decision";

/** The demo question: the casefile's signature journey starts here. */
export const SIGNATURE_QUESTION = "What are the main policy approaches for reducing land disputes in rapidly urbanising districts?";
/** Thane: the place where local evidence overturns the national verdict. */
export const SIGNATURE_PLACE = "D517";

export const CASE_EXAMPLES = [
  { q: SIGNATURE_QUESTION, tag: "Demo · disputes in fast-urbanising districts" },
  { q: "How can mutation delays be reduced in Uttar Pradesh?", tag: "Service delivery" },
  { q: "What works for climate-vulnerable land on the Odisha coast?", tag: "Climate resilience" },
  { q: "How can farmland conversion around growing cities be controlled?", tag: "Land use" },
];

/** Digitisation cannot push coverage beyond 99%. */
export function clampLevers(l: Levers, r: Region): Levers {
  return { ...l, digitization: Math.max(0, Math.min(l.digitization, Math.floor(99 - r.indicators.digitization))) };
}

/** The evidence-backed policy package for a region (the synthesis preset applied to its status quo). */
export function packageFor(region: Region, preset?: Partial<Levers>): Levers {
  return clampLevers({ ...statusQuoLevers(region), ...(preset ?? {}) }, region);
}

export interface ContrastRow {
  code: string;
  name: string;
  verdict: Verdict;
  label: string;
  headline: string;
  confidence: number | null;
  driver: { id: string; label: string; supporting: number; localContradicting: string[] } | null;
}

/** Same package, judged nationally and in the signature place — computed, not hard-coded. */
export function signatureContrast(): ContrastRow[] {
  const preset = synthesise(SIGNATURE_QUESTION, search(SIGNATURE_QUESTION)).labPreset.levers;
  return [NATIONAL, regionByCode[SIGNATURE_PLACE]].filter(Boolean).map((r) => {
    const levers = packageFor(r, preset);
    const res = simulate(r, levers, 5);
    const d = decide(res, r, levers);
    return {
      code: r.code,
      name: r.code === "IN" ? "All-India evidence" : regionLabel(r.code),
      verdict: d.verdict,
      label: d.label,
      headline: d.headline,
      confidence: res.confidence.score,
      driver: d.driver ? { id: d.driver.assumption.id, label: d.driver.assumption.label, supporting: d.driver.supporting.length, localContradicting: d.driver.localContradicting } : null,
    };
  });
}
