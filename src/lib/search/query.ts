import { CONCEPTS, conceptById } from "@/data/concepts";
import { INTERVENTIONS, OUTCOMES } from "@/data/taxonomy";
import type { EvidenceType, InterventionId, OutcomeId } from "@/lib/domain/schemas";
import { findRegionsInText } from "@/lib/data/regions";
import { phraseTokens, tokens } from "./text";

export interface ConceptMatch {
  id: string;
  label: string;
  matched: string;
  weight: number;
  via: "direct" | "broader" | "narrower" | "related";
}

export interface QueryUnderstanding {
  raw: string;
  terms: string[];
  concepts: ConceptMatch[];
  regions: { code: string; match: string }[];
  types: EvidenceType[];
  yearFrom?: number;
  yearTo?: number;
  interventions: InterventionId[];
  outcomes: OutcomeId[];
  intent: "approaches" | "effect" | "data" | "law" | "place" | "general";
}

/** Pre-tokenised concept phrases, longest first. */
const PHRASES: { concept: string; toks: string[]; text: string }[] = CONCEPTS.flatMap((c) =>
  [c.label, ...c.alt].map((text) => ({ concept: c.id, toks: phraseTokens(text), text })),
)
  .filter((p) => p.toks.length > 0)
  .sort((a, b) => b.toks.length - a.toks.length);

/** Find concept phrases in a token stream (used for queries and documents). */
export function detectConcepts(text: string): { id: string; matched: string }[] {
  const toks = phraseTokens(text);
  const used = new Array(toks.length).fill(false);
  const out = new Map<string, string>();
  for (const p of PHRASES) {
    const n = p.toks.length;
    for (let i = 0; i + n <= toks.length; i++) {
      let ok = true;
      for (let j = 0; j < n; j++) if (used[i + j] || toks[i + j] !== p.toks[j]) { ok = false; break; }
      if (!ok) continue;
      // single short tokens like "land" are too generic to count as concepts
      if (n === 1 && p.toks[0].length < 4) continue;
      for (let j = 0; j < n; j++) used[i + j] = true;
      if (!out.has(p.concept)) out.set(p.concept, p.text);
    }
  }
  return [...out.entries()].map(([id, matched]) => ({ id, matched }));
}

const narrowerOf: Record<string, string[]> = {};
for (const c of CONCEPTS) for (const b of c.broader) (narrowerOf[b] ??= []).push(c.id);

/** Direct concepts plus broader / narrower / related expansion with decaying weights. */
export function expandConcepts(direct: { id: string; matched: string }[]): ConceptMatch[] {
  const acc = new Map<string, ConceptMatch>();
  const put = (id: string, matched: string, weight: number, via: ConceptMatch["via"]) => {
    const c = conceptById[id];
    if (!c) return;
    const prev = acc.get(id);
    if (!prev || prev.weight < weight) acc.set(id, { id, label: c.label, matched, weight, via });
  };
  for (const d of direct) put(d.id, d.matched, 1, "direct");
  for (const d of direct) {
    const c = conceptById[d.id];
    for (const b of c.broader) put(b, d.matched, 0.5, "broader");
    for (const n of narrowerOf[d.id] ?? []) put(n, d.matched, 0.45, "narrower");
    for (const r of c.related) put(r, d.matched, 0.3, "related");
  }
  return [...acc.values()].sort((a, b) => b.weight - a.weight);
}

const TYPE_WORDS: [RegExp, EvidenceType][] = [
  [/\b(laws?|acts?|statutes?|legal|legislation|codes?)\b/i, "law"],
  [/\b(datasets?|data|statistics|indicators?)\b/i, "dataset"],
  [/\bcase stud(y|ies)\b/i, "case-study"],
  [/\b(schemes?|programmes?|programs?|guidelines?|model bill)\b/i, "policy"],
  [/\b(research|papers?|stud(y|ies)|evaluations?)\b/i, "research"],
  [/\breports?\b/i, "report"],
];

export function understandQuery(raw: string): QueryUnderstanding {
  const q = raw.trim();
  const direct = detectConcepts(q);
  const concepts = expandConcepts(direct);
  const regions = findRegionsInText(q);
  const types = [...new Set(TYPE_WORDS.filter(([re]) => re.test(q)).map(([, t]) => t))];

  let yearFrom: number | undefined;
  let yearTo: number | undefined;
  const range = q.match(/\b(19|20)(\d{2})\s*[-–to]+\s*(19|20)(\d{2})\b/);
  const since = q.match(/\b(since|after|from)\s+((?:19|20)\d{2})\b/i);
  const before = q.match(/\b(before|until)\s+((?:19|20)\d{2})\b/i);
  if (range) { yearFrom = Number(range[1] + range[2]); yearTo = Number(range[3] + range[4]); }
  if (since) yearFrom = Number(since[2]);
  if (before) yearTo = Number(before[2]);

  const directIds = new Set(direct.map((d) => d.id));
  const interventions = INTERVENTIONS.filter((i) => i.concepts.some((c) => directIds.has(c))).map((i) => i.id);
  const outcomes = OUTCOMES.filter((o) => o.concepts.some((c) => directIds.has(c))).map((o) => o.id);

  const lower = q.toLowerCase();
  const intent: QueryUnderstanding["intent"] = /\b(approach|approaches|options|interventions|what works|how (to|can|do)|reduc|improv|strategies)\b/.test(lower)
    ? "approaches"
    : /\b(effect|impact|does|did|evaluate|evaluation)\b/.test(lower)
      ? "effect"
      : types.includes("dataset")
        ? "data"
        : types.includes("law")
          ? "law"
          : regions.length
            ? "place"
            : "general";

  return { raw: q, terms: tokens(q), concepts, regions, types, yearFrom, yearTo, interventions, outcomes, intent };
}
