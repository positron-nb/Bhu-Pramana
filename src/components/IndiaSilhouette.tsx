import fs from "node:fs";
import path from "node:path";
import { regionByCode } from "@/lib/data/regions";
import { RAMP_RISK, rampColor } from "@/lib/viz";

/**
 * Static SVG of India's states (server-rendered from the bundled GeoJSON) used
 * as the landing-page hero. Shaded by the demo dispute-pressure index; focus
 * districts shown as survey points.
 */
type Ring = [number, number][];
interface F { properties: { code: string; name: string }; geometry: { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] } }

let cache: { paths: { code: string; d: string; fill: string; name: string }[]; dots: { x: number; y: number; r: number; hot: boolean }[]; w: number; h: number } | null = null;

function build() {
  const states: { features: F[] } = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/geo/states.geojson"), "utf8"));
  const W = 560, H = 620;
  const [x0, y0, x1, y1] = [68, 6.5, 97.5, 37.2];
  const kx = Math.cos((22 * Math.PI) / 180);
  const sx = (W - 20) / ((x1 - x0) * kx), sy = (H - 20) / (y1 - y0);
  const s = Math.min(sx, sy);
  const px = (lon: number) => 10 + (lon - x0) * kx * s;
  const py = (lat: number) => 10 + (y1 - lat) * s;
  const ringPath = (r: Ring) => {
    let d = "";
    let lx = NaN, ly = NaN;
    r.forEach(([lon, lat], i) => {
      const X = Math.round(px(lon) * 10) / 10, Y = Math.round(py(lat) * 10) / 10;
      if (i && Math.abs(X - lx) < 0.6 && Math.abs(Y - ly) < 0.6) return;
      d += `${i ? "L" : "M"}${X},${Y}`;
      lx = X; ly = Y;
    });
    return d + "Z";
  };
  const vals = Object.values(regionByCode).filter((r) => r.level === "state").map((r) => r.indicators.disputePressure);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const paths = states.features.map((f) => {
    const rings = f.geometry.type === "Polygon" ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map((p) => p[0]);
    const v = regionByCode[f.properties.code]?.indicators.disputePressure ?? lo;
    return { code: f.properties.code, name: f.properties.name, d: rings.map(ringPath).join(""), fill: rampColor(((v - lo) / (hi - lo)) * 0.85, RAMP_RISK) };
  });
  const dots = Object.values(regionByCode)
    .filter((r) => r.level === "district")
    .map((r) => ({ x: Math.round(px(r.centroid[0]) * 10) / 10, y: Math.round(py(r.centroid[1]) * 10) / 10, r: r.indicators.disputePressure > 75 ? 2.6 : 1.5, hot: r.indicators.disputePressure > 75 }));
  return { paths, dots, w: W, h: H };
}

export function IndiaSilhouette({ className }: { className?: string }) {
  cache ??= build();
  const { paths, dots, w, h } = cache;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label="Map of India shaded by the demonstration land-dispute pressure index">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {paths.map((p) => (
        <path key={p.code} d={p.d} fill={p.fill} fillOpacity={0.9} stroke="#07101c" strokeWidth={0.7} strokeLinejoin="round">
          <title>{p.name}</title>
        </path>
      ))}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.hot ? "#fbf8f1" : "#0c1828"} opacity={d.hot ? 0.95 : 0.55} filter={d.hot ? "url(#glow)" : undefined} />
      ))}
    </svg>
  );
}
