import fs from "node:fs/promises";
import path from "node:path";
import { DATA_NOTICE, regionByCode } from "@/lib/data/regions";
import { json, problem } from "@/lib/api";

/**
 * OGC-friendly GeoJSON: boundaries joined with indicator values.
 * GET /api/v1/geo/states   GET /api/v1/geo/districts?state=MH
 * Boundaries: DataMeet India (CC BY 4.0 / CC BY 2.5 IN).
 */
export async function GET(req: Request, ctx: RouteContext<"/api/v1/geo/[layer]">) {
  const { layer } = await ctx.params;
  if (layer !== "states" && layer !== "districts") return problem(404, "Layer must be 'states' or 'districts'");
  const state = new URL(req.url).searchParams.get("state");
  const file = path.join(process.cwd(), "public", "geo", `${layer}.geojson`);
  const fc = JSON.parse(await fs.readFile(file, "utf8")) as { features: { properties: Record<string, unknown> }[] };
  const features = fc.features
    .filter((f) => !state || f.properties.state === state)
    .map((f) => {
      const r = regionByCode[f.properties.code as string];
      return { ...f, properties: { ...f.properties, ...(r ? r.indicators : {}), population: r?.population } };
    });
  return json(
    { type: "FeatureCollection", name: layer, notice: DATA_NOTICE, attribution: "Boundaries © DataMeet India community (CC BY 4.0 / CC BY 2.5 IN)", features },
    { headers: { "content-type": "application/geo+json" } },
  );
}
