import { z } from "zod";
import { LeversSchema } from "@/lib/domain/schemas";
import { getRegion } from "@/lib/data/regions";
import { composeBrief, briefToMarkdown } from "@/lib/brief/compose";
import { synthesise } from "@/lib/ai/copilot";
import { search } from "@/lib/search/engine";
import { json, problem, requirePermission } from "@/lib/api";

const Body = z.object({
  question: z.string().trim().min(3).max(500),
  region: z.string(),
  evidenceIds: z.array(z.string()).max(40).default([]),
  levers: LeversSchema,
  format: z.enum(["json", "markdown"]).default("json"),
});

/** Compose an evidence-backed policy brief (researcher / policymaker / admin). */
export async function POST(req: Request) {
  const { role, error } = await requirePermission(req, "brief.generate");
  if (error) return error;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Body must be JSON");
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return problem(400, "Invalid brief request", parsed.error.flatten());
  const { question, region, evidenceIds, levers, format } = parsed.data;
  if (!getRegion(region)) return problem(404, `Unknown region ${region}`);
  const synthesis = synthesise(question, search(question, {}, 30), { regionCode: region });
  const ids = evidenceIds.length ? evidenceIds : synthesis.sources.slice(0, 8).map((s) => s.id);
  const brief = composeBrief({ question, regionCode: region, evidenceIds: ids, levers, role: role!, synthesis });
  if (format === "markdown") return new Response(briefToMarkdown(brief), { headers: { "content-type": "text/markdown; charset=utf-8" } });
  return json(brief);
}
