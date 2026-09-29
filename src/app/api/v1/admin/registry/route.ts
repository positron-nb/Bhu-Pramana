import { EVIDENCE } from "@/data/evidence";
import { json, requirePermission } from "@/lib/api";

/** Provenance registry — administrator role only (x-demo-role: admin). */
export async function GET(req: Request) {
  const { error } = await requirePermission(req, "admin");
  if (error) return error;
  return json({
    count: EVIDENCE.length,
    items: EVIDENCE.map((e) => ({ id: e.id, type: e.type, title: e.title, source: e.source, year: e.year, provenance: e.provenance, license: e.license ?? null, url: e.url ?? null })),
  });
}
