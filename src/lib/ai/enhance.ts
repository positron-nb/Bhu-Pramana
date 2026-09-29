import "server-only";
import { evidenceById } from "@/data/evidence";
import type { CopilotAnswer, Cited } from "./copilot";
import { describeLlmError, getLlm } from "./llm";

/**
 * Optional LLM pass: rewrites the deterministic synthesis into fluent prose.
 * Guard-rails:
 *   • the model only sees retrieved sources (id, metadata, summary, findings);
 *   • it must return JSON matching a schema;
 *   • every sentence must cite ≥1 id from the retrieved set — otherwise the
 *     whole LLM output is discarded and the deterministic text is kept.
 */

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "approachNotes"],
  properties: {
    summary: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "cites"],
        properties: { text: { type: "string" }, cites: { type: "array", items: { type: "string" } } },
      },
    },
    approachNotes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["intervention", "text", "cites"],
        properties: { intervention: { type: "string" }, text: { type: "string" }, cites: { type: "array", items: { type: "string" } } },
      },
    },
  },
} as const;

const SYSTEM = `You are the research copilot of a national land-governance evidence platform for Indian policymakers.
Write only from the SOURCES provided. Never add facts, numbers, places or programmes that are not in the sources.
Every sentence must cite the ids of the sources it relies on (e.g. "RS-001"). Prefer precise, neutral, policy-brief English.
Surface disagreement between sources explicitly. Some sources are demonstration records; do not describe them as official.`;

export async function enhanceWithLlm(answer: CopilotAnswer): Promise<CopilotAnswer> {
  const llm = getLlm();
  if (!llm) return answer;
  const allowed = new Set(answer.sources.map((s) => s.id).concat(answer.datasets.map((d) => d.id), ["DS-011"]));
  const sources = [...allowed].map((id) => evidenceById[id]).filter(Boolean).map((e) => ({
    id: e.id, type: e.type, title: e.title, year: e.year, provenance: e.provenance, design: e.design,
    geography: e.geography.regions.slice(0, 4), summary: e.summary, findings: e.findings.map((f) => f.statement),
  }));
  const digest = {
    question: answer.question,
    approaches: answer.approaches.map((a) => ({ intervention: a.intervention, label: a.label, sources: a.sources, strength: a.strength.grade, outcomes: a.outcomes })),
    recurring: answer.recurring,
    conflicts: answer.conflicts.map((c) => c.statement),
    geography: answer.geography.map((g) => `${g.name}: ${g.reason}`),
  };
  const prompt = `QUESTION: ${answer.question}

DETERMINISTIC DIGEST (computed from the sources; treat as structure, not as a source):
${JSON.stringify(digest, null, 1)}

SOURCES:
${JSON.stringify(sources, null, 1)}

Write:
1. "summary": 3–5 sentences answering the question — main approaches, recurring findings, conflicting evidence and where it matters geographically.
2. "approachNotes": one sentence per approach in the digest (use its intervention id), stating what the evidence says and how strong it is.
Cite source ids in "cites" for every sentence. Do not put ids in the text.`;

  const t0 = performance.now();
  try {
    const raw = (await llm.generateJson({ system: SYSTEM, prompt, schema: SCHEMA as unknown as Record<string, unknown>, maxTokens: 3000 })) as {
      summary: Cited[];
      approachNotes: { intervention: string; text: string; cites: string[] }[];
    };
    const valid = (c: Cited) => c.text?.trim().length > 10 && Array.isArray(c.cites) && c.cites.length > 0 && c.cites.every((id) => allowed.has(id));
    if (!raw?.summary?.length || !raw.summary.every(valid)) throw new Error("citation validation failed");
    const notes = new Map(raw.approachNotes.filter(valid).map((n) => [n.intervention, n]));
    return {
      ...answer,
      mode: "llm",
      provider: llm.id,
      model: llm.model,
      summary: raw.summary.map((s) => ({ text: s.text.trim(), cites: [...new Set(s.cites)] })),
      approaches: answer.approaches.map((a) => {
        const n = notes.get(a.intervention);
        return n ? { ...a, note: { text: n.text.trim(), cites: [...new Set(n.cites)] } } : a;
      }),
      trace: { ...answer.trace, llmMs: Math.round(performance.now() - t0), note: "LLM phrasing validated: all citations resolve to retrieved sources." },
    };
  } catch (err) {
    return { ...answer, trace: { ...answer.trace, llmMs: Math.round(performance.now() - t0), note: `${describeLlmError(err)} — deterministic synthesis used.` } };
  }
}
