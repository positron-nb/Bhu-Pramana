import { evidenceById } from "@/data/evidence";
import { ASSUMPTIONS } from "@/data/assumptions";
import { similarTo } from "@/lib/search/engine";
import { json, problem } from "@/lib/api";

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/evidence/[id]">) {
  const { id } = await ctx.params;
  const e = evidenceById[id.toUpperCase()];
  if (!e) return problem(404, `Unknown evidence ${id}`);
  return json({
    ...e,
    calibrates: ASSUMPTIONS.filter((a) => a.supporting.includes(e.id)).map((a) => a.id),
    contradicts: ASSUMPTIONS.filter((a) => a.contradicting.includes(e.id)).map((a) => a.id),
    similar: similarTo(e.id),
  });
}
