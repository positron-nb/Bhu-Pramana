import { EVIDENCE } from "@/data/evidence";
import { childrenOf, DATA_NOTICE, getRegion, REGION_YEARS } from "@/lib/data/regions";
import { json, problem } from "@/lib/api";

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/regions/[code]">) {
  const { code } = await ctx.params;
  const r = getRegion(code.toUpperCase());
  if (!r) return problem(404, `Unknown region ${code}`);
  const linked = EVIDENCE.filter((e) => e.geography.regions.includes(r.code) || (r.parent && e.geography.regions.includes(r.parent))).map((e) => ({ id: e.id, type: e.type, title: e.title, year: e.year }));
  return json({ notice: DATA_NOTICE, years: REGION_YEARS, region: r, children: childrenOf(r.code).map((c) => ({ code: c.code, name: c.name })), evidence: linked });
}
