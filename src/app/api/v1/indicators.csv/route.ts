import { INDICATORS } from "@/data/indicators";
import { REGIONS } from "@/lib/data/regions";
import { CORS } from "@/lib/api";

/** CSV export of the demonstration indicator panel. ?level=district|state */
export async function GET(req: Request) {
  const level = new URL(req.url).searchParams.get("level");
  const rows = REGIONS.filter((r) => !level || r.level === level);
  const head = ["code", "name", "level", "parent", "population", "area_km2", ...INDICATORS.map((i) => i.id)];
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    "# DEMONSTRATION DATASET — NOT AN OFFICIAL GOVERNMENT RECORD",
    head.join(","),
    ...rows.map((r) => [r.code, r.name, r.level, r.parent ?? "", r.population, r.areaKm2, ...INDICATORS.map((i) => r.indicators[i.id])].map(esc).join(",")),
  ];
  return new Response(lines.join("\n"), {
    headers: { ...CORS, "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="bhu-pramana-indicators${level ? "-" + level : ""}.csv"` },
  });
}
