import { z } from "zod";
import { evidenceById } from "@/data/evidence";
import { EvidenceTypeSchema } from "@/lib/domain/schemas";
import { search } from "@/lib/search/engine";
import { json, problem } from "@/lib/api";

const Query = z.object({
  q: z.string().max(400).default(""),
  type: z.string().optional(),
  state: z.string().max(8).optional(),
  from: z.coerce.number().int().min(1800).max(2100).optional(),
  to: z.coerce.number().int().min(1800).max(2100).optional(),
  provenance: z.enum(["reference", "synthetic"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return problem(400, "Invalid query", parsed.error.flatten());
  const { q, type, state, from, to, provenance, limit } = parsed.data;
  const types = type ? type.split(",").map((t) => EvidenceTypeSchema.safeParse(t)).filter((r) => r.success).map((r) => r.data!) : undefined;
  const res = search(q, { types, state, yearFrom: from, yearTo: to, provenance }, limit);
  return json({
    ...res,
    hits: res.hits.map((h) => {
      const e = evidenceById[h.id];
      return { ...h, record: { id: e.id, type: e.type, title: e.title, source: e.source, authors: e.authors, year: e.year, geography: e.geography, tags: e.tags, design: e.design, provenance: e.provenance, url: e.url, summary: e.summary } };
    }),
  });
}
