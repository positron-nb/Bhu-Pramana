import { INDICATORS } from "@/data/indicators";
import { DATA_NOTICE, REGIONS } from "@/lib/data/regions";
import { json } from "@/lib/api";

/** GET /api/v1/regions?level=state|district&parent=MH */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const level = p.get("level");
  const parent = p.get("parent");
  const items = REGIONS.filter((r) => (!level || r.level === level) && (!parent || r.parent === parent)).map(({ series, ...r }) => ({ ...r, seriesYears: Object.keys(series).length ? [2019, 2025] : [] }));
  return json({ notice: DATA_NOTICE, indicators: INDICATORS, count: items.length, items });
}
