import { EVIDENCE } from "@/data/evidence";
import { conceptById } from "@/data/concepts";
import { interventionById, outcomeById } from "@/data/taxonomy";
import type { Evidence, EvidenceType, Finding } from "@/lib/domain/schemas";
import { lineage, regionByCode, regionLabel } from "@/lib/data/regions";
import { DESIGN_LABEL, DESIGN_WEIGHT, evidenceLevel } from "@/lib/evidence/strength";
import { detectConcepts, understandQuery, type QueryUnderstanding } from "./query";
import { tokens } from "./text";

/**
 * Hybrid retrieval over the evidence corpus (runs fully offline):
 *
 *   score = 0.50 · BM25 (normalised, fielded, synonym-expanded)
 *         + 0.35 · cosine(query concept vector, document concept vector)
 *         + 0.10 · geographic match
 *         + 0.05 · design quality prior
 *
 * Concept vectors come from a LandVoc-style controlled vocabulary, so
 * "urban land disputes" retrieves studies that talk about "peri-urban
 * litigation" even with no word overlap. In connected mode, dense
 * embeddings are fused on top via reciprocal-rank fusion (see semantic.ts).
 */

interface IndexedDoc {
  e: Evidence;
  tf: Map<string, number>;
  len: number;
  cvec: Map<string, number>;
}

const K1 = 1.2;
const B = 0.75;

function docText(e: Evidence): { weighted: string[] } {
  const parts: string[] = [];
  const add = (s: string, w: number) => { for (let i = 0; i < w; i++) parts.push(s); };
  add(e.title, 3);
  add(e.tags.join(" "), 2);
  add(e.summary, 1);
  add(e.findings.map((f) => f.statement).join(" "), 1);
  add(e.concepts.map((c) => conceptById[c]?.label ?? c).join(" "), 1);
  add(e.source, 1);
  return { weighted: parts };
}

function buildIndex() {
  const docs: IndexedDoc[] = EVIDENCE.map((e) => {
    const toks = tokens(docText(e).weighted.join(" "));
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    const cvec = new Map<string, number>();
    for (const c of e.concepts) cvec.set(c, 1);
    for (const d of detectConcepts(`${e.title}. ${e.summary}. ${e.tags.join(", ")}`)) if (!cvec.has(d.id)) cvec.set(d.id, 0.6);
    return { e, tf, len: toks.length, cvec };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const avgdl = docs.reduce((s, d) => s + d.len, 0) / docs.length;
  return { docs, df, avgdl, N: docs.length };
}

let INDEX: ReturnType<typeof buildIndex> | null = null;
const index = () => (INDEX ??= buildIndex());

export interface SearchFilters {
  types?: EvidenceType[];
  state?: string;
  yearFrom?: number;
  yearTo?: number;
  provenance?: "reference" | "synthetic";
}

export interface SearchHit {
  id: string;
  score: number;
  components: { lexical: number; concept: number; geo: number; quality: number; dense?: number };
  matchedTerms: string[];
  matchedConcepts: string[];
  geoMatch: string | null;
  bestFinding: Finding | null;
  explanation: string;
}

export interface SearchResponse {
  understanding: QueryUnderstanding;
  hits: SearchHit[];
  total: number;
  facets: { type: Record<string, number>; state: Record<string, number>; decade: Record<string, number>; level: Record<string, number> };
  mode: "hybrid-lexical-concept" | "hybrid-dense";
  tookMs: number;
}

function cosine(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0, na = 0, nb = 0;
  for (const [k, v] of a) { na += v * v; const w = b.get(k); if (w) dot += v * w; }
  for (const v of b.values()) nb += v * v;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function geoScore(e: Evidence, regionCodes: string[]): { score: number; label: string | null } {
  if (!regionCodes.length) return { score: 0, label: null };
  let best = 0;
  let label: string | null = null;
  for (const code of regionCodes) {
    const lin = lineage(code);
    if (e.geography.regions.includes(lin[0])) { if (best < 1) { best = 1; label = regionLabel(lin[0]); } }
    else if (lin.length > 2 && e.geography.regions.includes(lin[1])) { if (best < 0.75) { best = 0.75; label = regionByCode[lin[1]]?.name ?? lin[1]; } }
    else if (e.geography.regions.some((r) => regionByCode[r]?.parent === lin[0])) { if (best < 0.85) { best = 0.85; label = regionLabel(lin[0]); } }
    else if (e.geography.scope === "national") { if (best < 0.4) { best = 0.4; label = "National"; } }
  }
  return { score: best, label };
}

function pickFinding(e: Evidence, u: QueryUnderstanding): Finding | null {
  if (!e.findings.length) return null;
  const qc = new Set(u.concepts.filter((c) => c.weight >= 0.5).map((c) => c.id));
  let best: Finding | null = null;
  let bestScore = -1;
  for (const f of e.findings) {
    const iv = interventionById[f.intervention];
    const oc = outcomeById[f.outcome];
    let s = 0;
    for (const c of iv.concepts) if (qc.has(c)) s += 1;
    for (const c of oc.concepts) if (qc.has(c)) s += 1.2;
    if (u.interventions.includes(f.intervention)) s += 1;
    if (u.outcomes.includes(f.outcome)) s += 1.2;
    if (f.effect) s += 0.2;
    if (s > bestScore) { bestScore = s; best = f; }
  }
  return best;
}

export function explain(e: Evidence, finding: Finding | null, geo: string | null): string {
  const lvl = evidenceLevel(e.design);
  const where = geo && geo !== "National" ? geo : e.geography.scope === "national" ? "national" : e.geography.regions.slice(0, 2).map((r) => regionByCode[r]?.name ?? r).join(", ");
  const head = e.type === "report" ? `Report (${e.year}, ${where})` : e.type === "law" || e.type === "policy" ? `${e.type === "law" ? "Statute" : "Programme / policy"} (${e.year}, ${where})` : e.type === "dataset" ? `Dataset (${e.distribution?.coverage ?? where})` : `${DESIGN_LABEL[e.design]} · ${lvl.level} (${e.year}, ${where})`;
  if (finding) return `${head} — ${finding.statement}`;
  const first = e.summary.split(/(?<=\.)\s/)[0];
  return `${head} — ${first}`;
}

export function search(query: string, filters: SearchFilters = {}, limit = 30): SearchResponse {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const { docs, df, avgdl, N } = index();
  const u = understandQuery(query);

  // weighted query terms: literal terms + labels of matched concepts (synonym expansion)
  const qTerms = new Map<string, number>();
  for (const t of u.terms) qTerms.set(t, Math.max(qTerms.get(t) ?? 0, 1));
  for (const c of u.concepts.filter((c) => c.via === "direct")) {
    const concept = conceptById[c.id];
    for (const t of tokens([concept.label, ...concept.alt.slice(0, 6)].join(" "))) qTerms.set(t, Math.max(qTerms.get(t) ?? 0, 0.35));
  }

  const qvec = new Map(u.concepts.map((c) => [c.id, c.weight]));
  const regionCodes = [...u.regions.map((r) => r.code), ...(filters.state ? [filters.state] : [])];
  const yFrom = filters.yearFrom ?? u.yearFrom;
  const yTo = filters.yearTo ?? u.yearTo;

  const raw = docs
    .filter(({ e }) => (!filters.types?.length || filters.types.includes(e.type)) && (!filters.provenance || e.provenance === filters.provenance) && (!yFrom || e.year >= yFrom) && (!yTo || e.year <= yTo))
    .filter(({ e }) => !filters.state || e.geography.scope === "national" || e.geography.regions.some((r) => r === filters.state || regionByCode[r]?.parent === filters.state))
    .map((d) => {
      let bm = 0;
      const matched: string[] = [];
      for (const [t, w] of qTerms) {
        const f = d.tf.get(t);
        if (!f) continue;
        const n = df.get(t) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        bm += w * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avgdl)));
        if (w === 1) matched.push(t);
      }
      const concept = qvec.size ? cosine(qvec, d.cvec) : 0;
      const geo = geoScore(d.e, regionCodes);
      const typeBoost = u.types.includes(d.e.type) ? 0.04 : 0;
      const matchedConcepts = [...qvec.keys()].filter((c) => d.cvec.has(c) && (qvec.get(c) ?? 0) >= 0.45).map((c) => conceptById[c]?.label ?? c);
      return { d, bm, concept, geo, typeBoost, matched, matchedConcepts };
    });

  const maxBm = Math.max(1e-9, ...raw.map((r) => r.bm));
  const empty = !u.terms.length && !qvec.size;

  const scored = raw
    .map((r) => {
      const lexical = r.bm / maxBm;
      const quality = DESIGN_WEIGHT[r.d.e.design];
      const score = empty ? 0.2 + 0.05 * quality + (r.d.e.year - 2000) / 1000 : 0.5 * lexical + 0.35 * r.concept + 0.1 * r.geo.score + 0.05 * quality + r.typeBoost;
      return { ...r, lexical, quality, score };
    })
    .filter((r) => empty || r.lexical > 0.04 || r.concept > 0.12)
    .sort((a, b) => b.score - a.score);

  const facets: SearchResponse["facets"] = { type: {}, state: {}, decade: {}, level: {} };
  for (const r of scored) {
    const e = r.d.e;
    facets.type[e.type] = (facets.type[e.type] ?? 0) + 1;
    const dec = e.year >= 2020 ? "2020s" : e.year >= 2010 ? "2010s" : e.year >= 2000 ? "2000s" : "Pre-2000";
    facets.decade[dec] = (facets.decade[dec] ?? 0) + 1;
    facets.level[evidenceLevel(e.design).level] = (facets.level[evidenceLevel(e.design).level] ?? 0) + 1;
    const states = new Set(e.geography.regions.map((c) => (regionByCode[c]?.level === "district" ? regionByCode[c].parent! : c)).filter((c) => c !== "IN"));
    for (const s of states) facets.state[s] = (facets.state[s] ?? 0) + 1;
  }

  const hits: SearchHit[] = scored.slice(0, limit).map((r) => {
    const finding = pickFinding(r.d.e, u);
    return {
      id: r.d.e.id,
      score: Math.round(r.score * 1000) / 1000,
      components: { lexical: round(r.lexical), concept: round(r.concept), geo: round(r.geo.score), quality: round(r.quality) },
      matchedTerms: r.matched,
      matchedConcepts: r.matchedConcepts.slice(0, 5),
      geoMatch: r.geo.label,
      bestFinding: finding,
      explanation: explain(r.d.e, finding, r.geo.label),
    };
  });

  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  return { understanding: u, hits, total: scored.length, facets, mode: "hybrid-lexical-concept", tookMs: Math.round((t1 - t0) * 10) / 10 };
}

const round = (v: number) => Math.round(v * 100) / 100;

/** Documents most similar to a given document (concept cosine + shared links). */
export function similarTo(id: string, limit = 5): { id: string; score: number }[] {
  const { docs } = index();
  const me = docs.find((d) => d.e.id === id);
  if (!me) return [];
  return docs
    .filter((d) => d.e.id !== id)
    .map((d) => {
      let s = cosine(me.cvec, d.cvec);
      if (me.e.related.includes(d.e.id) || d.e.related.includes(id)) s += 0.25;
      if (me.e.datasets.some((x) => d.e.datasets.includes(x))) s += 0.1;
      return { id: d.e.id, score: Math.round(s * 100) / 100 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
