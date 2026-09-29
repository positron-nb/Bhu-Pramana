/**
 * Generates the demonstration regional dataset (src/data/generated/regions.json).
 *
 * DEMONSTRATION DATASET — NOT AN OFFICIAL GOVERNMENT RECORD.
 *
 * Values are synthetic. They are produced deterministically (seeded PRNG) from
 * hand-set state profiles plus district archetypes (metro, peri-urban, flood,
 * drought, tribal-forest …) so that spatial patterns are plausible and the
 * demo is identical on every machine. Boundaries come from DataMeet
 * (CC BY 4.0 / CC BY 2.5 IN) and are only used for geometry, centroids and area.
 *
 * Run:  npm run data:regions
 */
import fs from "node:fs";
import path from "node:path";

type Pos = [number, number];
type Ring = Pos[];
interface Feature {
  properties: { code: string; name: string; state?: string };
  geometry: { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
}

const ROOT = process.cwd();
const states: { features: Feature[] } = JSON.parse(fs.readFileSync(path.join(ROOT, "public/geo/states.geojson"), "utf8"));
const districts: { features: Feature[] } = JSON.parse(fs.readFileSync(path.join(ROOT, "public/geo/districts.geojson"), "utf8"));

/* ---------------------------------------------------------------- PRNG */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/* ------------------------------------------------------------ geometry */
function rings(f: Feature): Ring[] {
  return f.geometry.type === "Polygon" ? f.geometry.coordinates : f.geometry.coordinates.flat();
}
function outerRings(f: Feature): Ring[] {
  return f.geometry.type === "Polygon" ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map((p) => p[0]);
}
function ringAreaKm2(r: Ring) {
  // planar shoelace on an equirectangular projection scaled at ring latitude
  let a = 0;
  const lat0 = r.reduce((s, p) => s + p[1], 0) / r.length;
  const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110.57;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    a += r[j][0] * kx * (r[i][1] * ky) - r[i][0] * kx * (r[j][1] * ky);
  }
  return Math.abs(a / 2);
}
function centroidOf(f: Feature): Pos {
  // area-weighted centroid of the largest outer ring (keeps labels on land)
  const outs = outerRings(f).sort((a, b) => ringAreaKm2(b) - ringAreaKm2(a));
  const r = outs[0];
  let cx = 0, cy = 0, a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f2 = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    cx += (r[j][0] + r[i][0]) * f2;
    cy += (r[j][1] + r[i][1]) * f2;
    a += f2;
  }
  if (Math.abs(a) < 1e-12) return r[0];
  return [round(cx / (3 * a), 3), round(cy / (3 * a), 3)];
}
function bboxOf(f: Feature): [number, number, number, number] {
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  for (const r of rings(f)) for (const [x, y] of r) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [round(x0, 3), round(y0, 3), round(x1, 3), round(y1, 3)];
}
const areaOf = (f: Feature) => outerRings(f).reduce((s, r) => s + ringAreaKm2(r), 0);

/* ------------------------------------------------------ state profiles */
// dig, disp, urbG, vuln, cap, zon, road, women, degr, popMillions
const P: Record<string, [number, number, number, number, number, number, number, number, number, number]> = {
  UP: [71, 68, 3.1, 0.58, 52, 38, 160, 12, 12, 240], MH: [86, 61, 4.2, 0.52, 68, 55, 150, 16, 44, 126],
  KA: [91, 55, 4.0, 0.49, 71, 58, 170, 18, 36, 68], OD: [82, 49, 2.4, 0.66, 60, 40, 120, 11, 34, 46],
  RJ: [79, 57, 2.9, 0.63, 57, 42, 90, 10, 62, 81], AS: [48, 52, 2.2, 0.71, 44, 30, 140, 9, 12, 36],
  BR: [58, 74, 2.6, 0.69, 41, 28, 180, 8, 8, 130], WB: [74, 58, 2.8, 0.6, 55, 45, 190, 11, 20, 100],
  MP: [83, 54, 2.7, 0.55, 58, 44, 100, 12, 32, 87], TN: [90, 50, 3.8, 0.5, 72, 60, 200, 20, 30, 77],
  GJ: [92, 48, 4.4, 0.51, 74, 64, 140, 15, 52, 71], AP: [85, 56, 3.3, 0.57, 65, 50, 130, 17, 16, 54],
  TG: [80, 63, 5.1, 0.53, 62, 52, 120, 16, 30, 38], KL: [88, 45, 3.0, 0.54, 76, 66, 330, 24, 10, 36],
  JH: [60, 60, 2.3, 0.61, 43, 30, 110, 9, 68, 40], PB: [84, 50, 2.9, 0.45, 66, 56, 180, 10, 8, 31],
  CG: [78, 47, 2.1, 0.56, 52, 38, 90, 13, 22, 30], HR: [87, 62, 4.8, 0.48, 67, 58, 170, 11, 12, 30],
  DL: [93, 78, 2.5, 0.42, 80, 72, 380, 14, 8, 21], JK: [62, 55, 2.0, 0.58, 50, 36, 60, 9, 22, 13.6],
  UK: [75, 46, 3.2, 0.62, 58, 40, 70, 18, 16, 11.6], HP: [88, 40, 1.9, 0.57, 70, 50, 80, 22, 45, 7.5],
  TR: [81, 38, 2.0, 0.6, 58, 38, 120, 15, 42, 4.2], ML: [35, 44, 1.8, 0.63, 40, 25, 60, 35, 23, 3.4],
  MN: [45, 52, 1.8, 0.62, 42, 28, 60, 13, 27, 3.2], NL: [30, 40, 1.9, 0.6, 38, 22, 60, 12, 48, 2.2],
  GA: [92, 44, 3.4, 0.5, 74, 62, 250, 26, 52, 1.6], AR: [38, 36, 1.7, 0.58, 36, 20, 40, 14, 11, 1.6],
  PY: [89, 46, 3.3, 0.55, 72, 60, 300, 22, 10, 1.6], MZ: [55, 34, 1.9, 0.59, 45, 30, 50, 20, 23, 1.3],
  CH: [95, 50, 2.0, 0.38, 82, 75, 350, 16, 5, 1.2], SK: [80, 30, 1.6, 0.57, 60, 40, 50, 21, 14, 0.7],
  DD: [84, 48, 4.0, 0.5, 66, 55, 220, 13, 10, 0.6], AN: [78, 32, 1.4, 0.66, 58, 50, 60, 15, 4, 0.4],
  LA: [52, 28, 1.5, 0.62, 44, 30, 20, 14, 40, 0.3], LD: [70, 20, 1.2, 0.72, 55, 45, 100, 20, 2, 0.07],
};
const BUILT_OVERRIDE: Record<string, number> = { DL: 58, CH: 46, PY: 34, LD: 18, DD: 16, GA: 12, KL: 14 };

/* --------------------------------------------------- district archetypes */
const A: Record<string, string[]> = {
  metro: ["Lucknow", "Kanpur Nagar", "Ghaziabad", "Gautam Buddha Nagar", "Mumbai", "Mumbai Suburban", "Thane", "Pune", "Bangalore", "Kamrup Metropolitan", "Jaipur", "Khordha"],
  urban: ["Agra", "Varanasi", "Allahabad", "Meerut", "Bareilly", "Moradabad", "Aligarh", "Gorakhpur", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Mysore", "Dharwad", "Belgaum", "Dakshina Kannada", "Gulbarga", "Cuttack", "Jodhpur", "Kota", "Ajmer", "Udaipur", "Bikaner", "Sambalpur"],
  "peri-urban": ["Baghpat", "Bulandshahr", "Unnao", "Bara Banki", "Mathura", "Muzaffarnagar", "Raigarh", "Ahmadnagar", "Satara", "Sangli", "Bangalore Rural", "Ramanagara", "Chikkaballapura", "Kolar", "Tumkur", "Kamrup", "Nalbari", "Alwar", "Puri"],
  corridor: ["Gautam Buddha Nagar", "Bulandshahr", "Aligarh", "Unnao", "Kannauj", "Etawah", "Firozabad", "Mainpuri", "Raigarh", "Thane", "Nashik", "Aurangabad", "Nagpur", "Wardha", "Jalna", "Buldana", "Washim", "Tumkur", "Bangalore Rural", "Chitradurga", "Anugul", "Jharsuguda", "Sundargarh", "Kendujhar", "Alwar", "Ajmer", "Pali", "Bhilwara"],
  flood: ["Bahraich", "Shrawasti", "Balrampur", "Gonda", "Kushinagar", "Maharajganj", "Siddharth Nagar", "Ballia", "Ghazipur", "Gorakhpur", "Kheri", "Sitapur", "Basti", "Deoria", "Kendrapara", "Jajapur", "Cuttack", "Jagatsinghapur", "Dhemaji", "Lakhimpur", "Barpeta", "Marigaon", "Dhubri", "Goalpara", "Nagaon", "Sonitpur", "Darrang", "Golaghat", "Jorhat", "Dibrugarh", "Bongaigaon", "Baksa", "Tinsukia", "Sivasagar", "Cachar", "Karimganj", "Hailakandi"],
  "cyclone-coast": ["Puri", "Kendrapara", "Jagatsinghapur", "Baleshwar", "Bhadrak", "Ganjam", "Khordha", "Ratnagiri", "Sindhudurg", "Raigarh", "Udupi", "Dakshina Kannada", "Uttara Kannada", "Mumbai", "Mumbai Suburban", "Thane"],
  drought: ["Banda", "Mahoba", "Hamirpur", "Jhansi", "Lalitpur", "Chitrakoot", "Jalaun", "Bid", "Latur", "Osmanabad", "Jalna", "Parbhani", "Hingoli", "Nanded", "Aurangabad", "Yavatmal", "Washim", "Buldana", "Akola", "Solapur", "Ahmadnagar", "Raichur", "Koppal", "Bellary", "Gulbarga", "Yadgir", "Bijapur", "Bagalkot", "Chitradurga", "Balangir", "Nuapada", "Kalahandi", "Bargarh", "Barmer", "Jaisalmer", "Bikaner", "Jodhpur", "Churu", "Nagaur", "Jalor", "Ganganagar", "Hanumangarh", "Jhunjhunun", "Sikar"],
  "tribal-forest": ["Sonbhadra", "Mirzapur", "Garhchiroli", "Nandurbar", "Gondiya", "Chandrapur", "Koraput", "Malkangiri", "Nabarangapur", "Rayagada", "Kandhamal", "Mayurbhanj", "Kendujhar", "Sundargarh", "Gajapati", "Karbi Anglong", "Dima Hasao", "Kokrajhar", "Chirang", "Udalguri", "Banswara", "Dungarpur", "Pratapgarh", "Sirohi"],
  hill: ["Kodagu", "Chikmagalur", "Shimoga", "Uttara Kannada", "Hassan", "Karbi Anglong", "Dima Hasao"],
};
function archetypesFor(name: string, state: string) {
  const out: string[] = [];
  for (const [k, list] of Object.entries(A)) {
    if (!list.includes(name)) continue;
    // guard against homonyms in two states (Raigarh MH only; Pratapgarh RJ vs UP)
    if (name === "Pratapgarh" && state === "UP") continue;
    out.push(k);
  }
  if (!out.length) out.push("rural");
  return out;
}

interface Vals {
  dig: number; disp: number; urbG: number; vuln: number; cap: number; zon: number; road: number; women: number; degr: number;
  densityMul: number; builtAdd: number; luAdd: number; resAdd: number; research: number; mutAdd: number;
}
function applyArchetypes(base: Vals, arch: string[], areaKm2: number): Vals {
  const v = { ...base };
  for (const a of arch) {
    switch (a) {
      // compact metro districts (Mumbai, Kamrup Metro) are almost fully built up; large ones (Pune, Jaipur) are not
      case "metro": v.disp += 10; v.urbG += 1.8; v.builtAdd += clamp(18000 / areaKm2, 4, 60); v.luAdd += 12; v.dig += 3; v.mutAdd -= 4; v.cap += 8; v.zon += 12; v.road *= 2.2; v.vuln -= 0.05; v.women += 3; v.research += 25; v.densityMul *= 3.5; break;
      case "urban": v.disp += 8; v.urbG += 1.4; v.builtAdd += 5; v.luAdd += 10; v.dig += 2; v.cap += 4; v.zon += 6; v.road *= 1.5; v.research += 12; v.densityMul *= 1.9; break;
      case "peri-urban": v.disp += 10; v.urbG += 1.5; v.builtAdd += 4; v.luAdd += 12; v.zon -= 5; v.cap -= 2; v.road *= 1.3; v.research += 6; v.densityMul *= 1.5; break;
      case "corridor": v.disp += 5; v.urbG += 0.6; v.luAdd += 6; v.road *= 1.3; v.research += 4; break;
      case "flood": v.vuln += 0.14; v.resAdd -= 8; v.degr += 4; v.disp += 3; v.dig -= 4; break;
      case "cyclone-coast": v.vuln += 0.12; v.resAdd -= 6; break;
      case "drought": v.vuln += 0.1; v.degr += 14; v.resAdd -= 6; v.disp -= 2; break;
      case "tribal-forest": v.disp -= 6; v.dig -= 9; v.cap -= 8; v.women -= 2; v.road *= 0.6; v.zon -= 8; v.densityMul *= 0.5; v.research -= 4; break;
      case "hill": v.vuln += 0.04; v.road *= 0.6; v.densityMul *= 0.45; v.disp -= 8; break;
    }
  }
  return v;
}

interface RegionOut {
  code: string; name: string; level: "country" | "state" | "district"; parent: string | null;
  centroid: [number, number]; bbox?: [number, number, number, number]; population: number; areaKm2: number;
  focus: boolean; archetypes: string[]; indicators: Record<string, number>; series: Record<string, number[]>;
}

function indicatorsFrom(v: Vals, density: number, r: () => number, override?: number) {
  const n = (s: number) => (r() - 0.5) * 2 * s;
  const dig = clamp(v.dig + n(3), 12, 99);
  const disp = clamp(v.disp + n(4), 8, 90);
  const urbG = clamp(v.urbG + n(0.4), 0.3, 11);
  const vuln = clamp(v.vuln + n(0.04), 0.12, 0.96);
  const cap = clamp(v.cap + n(4), 15, 95);
  const zon = clamp(v.zon + n(5), 5, 95);
  const degr = clamp(v.degr + n(4), 1, 78);
  const built = override ?? clamp(1.2 + 1.9 * Math.log(Math.max(density, 20) / 100) + urbG * 0.9 + v.builtAdd + n(1), 0.6, 88);
  const landUse = clamp(18 + urbG * 7 - zon * 0.22 + v.luAdd + n(3), 4, 88);
  const resil = clamp(25 + (1 - vuln) * 60 + cap * 0.15 - degr * 0.1 + v.resAdd + n(2.5), 8, 92);
  return {
    digitization: round(dig),
    mapLinkage: round(clamp(dig * (0.74 + n(0.08)), 5, 98)),
    disputePressure: round(disp),
    pendingCases: Math.round(clamp(disp * 7.2 + n(30), 20, 900)),
    mutationDays: Math.round(clamp(72 - 0.58 * dig + (100 - cap) * 0.12 + v.mutAdd + n(4), 3, 115)),
    urbanGrowth: round(urbG),
    builtUp: round(built),
    landUsePressure: round(landUse),
    climateVulnerability: round(vuln, 2),
    climateResilience: round(resil),
    degradation: round(degr),
    roadDensity: Math.round(clamp(v.road + n(12), 8, 400)),
    adminCapacity: round(cap),
    zoningStrictness: Math.round(zon),
    womenOwnership: round(clamp(v.women + n(2), 2, 58)),
    researchActivity: Math.round(clamp(v.research + n(6), 3, 99)),
  };
}

function seriesFrom(ind: Record<string, number>, arch: string[], r: () => number) {
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const urbanish = arch.some((a) => ["metro", "urban", "peri-urban", "corridor"].includes(a));
  const n = (s: number) => (r() - 0.5) * 2 * s;
  const digRate = ind.digitization < 60 ? 3.1 : ind.digitization < 85 ? 2.3 : 1.1;
  const out: Record<string, number[]> = {};
  out.digitization = years.map((y) => round(clamp(ind.digitization - (digRate + n(0.3)) * (2025 - y), 5, 99)));
  out.disputePressure = years.map((y) => {
    const trend = urbanish ? 0.9 : -0.45;
    const covid = y === 2020 ? 2.6 : y === 2021 ? 3.4 : y === 2022 ? 1.2 : 0;
    return round(clamp(ind.disputePressure - trend * (2025 - y) + covid + n(0.6), 5, 99));
  });
  out.mutationDays = years.map((y) => Math.round(clamp(ind.mutationDays + (2.4 + n(0.4)) * (2025 - y) + (y === 2020 ? 6 : 0), 3, 140)));
  out.builtUp = years.map((y) => round(ind.builtUp / Math.pow(1 + ind.urbanGrowth / 100, 2025 - y), 2));
  out.climateResilience = years.map((y) => round(clamp(ind.climateResilience - (0.6 + n(0.2)) * (2025 - y), 5, 95)));
  out.landUsePressure = years.map((y) => round(clamp(ind.landUsePressure - (urbanish ? 1.1 : 0.35) * (2025 - y) + n(0.5), 2, 98)));
  return out;
}

/* ------------------------------------------------------------ generate */
const out: RegionOut[] = [];
const FOCUS = new Set(["UP", "MH", "KA", "OD", "AS", "RJ"]);
const districtOut: RegionOut[] = [];

for (const f of districts.features) {
  const { code, name, state } = f.properties;
  const p = P[state!];
  const arch = archetypesFor(name, state!);
  const r = rng(code);
  const base: Vals = { dig: p[0], disp: p[1], urbG: p[2], vuln: p[3], cap: p[4], zon: p[5], road: p[6], women: p[7], degr: p[8], densityMul: 1, builtAdd: 0, luAdd: 0, resAdd: 0, research: 18 + p[4] * 0.35, mutAdd: 0 };
  const area = areaOf(f);
  const v = applyArchetypes(base, arch, area);
  districtOut.push({
    code, name, level: "district", parent: state!, centroid: centroidOf(f), bbox: bboxOf(f),
    population: 0, areaKm2: Math.round(area), focus: true, archetypes: arch,
    indicators: {}, series: {},
    // stash weights for population allocation
    ...({ _w: Math.pow(area, 0.6) * v.densityMul * (arch.includes("metro") && area < 800 ? Math.pow(3000 / area, 0.8) : 1) * (0.8 + r() * 0.4), _v: v } as object),
  } as RegionOut);
}

// allocate state populations across districts, then compute indicators
for (const st of FOCUS) {
  const ds = districtOut.filter((d) => d.parent === st) as (RegionOut & { _w: number; _v: Vals })[];
  const total = P[st][9] * 1e6;
  const wsum = ds.reduce((s, d) => s + d._w, 0);
  for (const d of ds) {
    d.population = Math.round((total * d._w) / wsum / 1000) * 1000;
    const r = rng(d.code + ":ind");
    d.indicators = indicatorsFrom(d._v, d.population / d.areaKm2, r);
    d.series = seriesFrom(d.indicators, d.archetypes, rng(d.code + ":ser"));
    delete (d as Partial<typeof d>)._w;
    delete (d as Partial<typeof d>)._v;
  }
}

function weightedAggregate(children: RegionOut[]) {
  const pop = children.reduce((s, c) => s + c.population, 0);
  const ind: Record<string, number> = {};
  const keys = Object.keys(children[0].indicators);
  for (const k of keys) {
    const v = children.reduce((s, c) => s + c.indicators[k] * c.population, 0) / pop;
    ind[k] = k === "climateVulnerability" ? round(v, 2) : ["pendingCases", "mutationDays", "roadDensity", "zoningStrictness", "researchActivity"].includes(k) ? Math.round(v) : round(v);
  }
  const ser: Record<string, number[]> = {};
  for (const k of Object.keys(children[0].series)) {
    ser[k] = children[0].series[k].map((_, i) => round(children.reduce((s, c) => s + c.series[k][i] * c.population, 0) / pop, k === "builtUp" ? 2 : 1));
  }
  return { pop, ind, ser };
}

for (const f of states.features) {
  const { code, name } = f.properties;
  const p = P[code];
  if (!p) throw new Error(`No profile for state ${code}`);
  const area = areaOf(f);
  const focus = FOCUS.has(code);
  let indicators: Record<string, number>;
  let series: Record<string, number[]>;
  let population = Math.round(p[9] * 1e6);
  if (focus) {
    const agg = weightedAggregate(districtOut.filter((d) => d.parent === code));
    indicators = agg.ind;
    series = agg.ser;
    // district builtUp is area-based, so aggregate by area rather than population
    const ds = districtOut.filter((d) => d.parent === code);
    const a = ds.reduce((s, d) => s + d.areaKm2, 0);
    indicators.builtUp = round(ds.reduce((s, d) => s + d.indicators.builtUp * d.areaKm2, 0) / a);
    population = agg.pop;
  } else {
    const r = rng(code + ":ind");
    const base: Vals = { dig: p[0], disp: p[1], urbG: p[2], vuln: p[3], cap: p[4], zon: p[5], road: p[6], women: p[7], degr: p[8], densityMul: 1, builtAdd: 0, luAdd: 0, resAdd: 0, research: 14 + p[4] * 0.3, mutAdd: 0 };
    indicators = indicatorsFrom(base, population / area, r, BUILT_OVERRIDE[code]);
    series = seriesFrom(indicators, ["DL", "CH", "PY", "HR", "TG", "GJ"].includes(code) ? ["urban"] : ["rural"], rng(code + ":ser"));
  }
  out.push({
    code, name, level: "state", parent: "IN", centroid: centroidOf(f), bbox: bboxOf(f), population,
    areaKm2: Math.round(area), focus, archetypes: [], indicators, series,
  });
}

const national = weightedAggregate(out);
const allArea = out.reduce((s, r) => s + r.areaKm2, 0);
national.ind.builtUp = round(out.reduce((s, r) => s + r.indicators.builtUp * r.areaKm2, 0) / allArea);
out.unshift({
  code: "IN", name: "India", level: "country", parent: null, centroid: [80.5, 22.5], bbox: [68.1, 6.7, 97.4, 37.1],
  population: national.pop, areaKm2: allArea, focus: false, archetypes: [], indicators: national.ind, series: national.ser,
});

const all = [...out, ...districtOut.sort((a, b) => (a.parent! + a.name).localeCompare(b.parent! + b.name))];
const target = path.join(ROOT, "src/data/generated/regions.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(
  target,
  JSON.stringify({
    notice: "DEMONSTRATION DATASET — NOT AN OFFICIAL GOVERNMENT RECORD. Synthetic values generated by scripts/generate-regions.ts. Boundaries: DataMeet India (CC BY 4.0 / CC BY 2.5 IN).",
    generatedWith: "seeded deterministic generator v1",
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025],
    regions: all,
  }),
);
console.log(`Wrote ${all.length} regions → ${path.relative(ROOT, target)} (${(fs.statSync(target).size / 1024).toFixed(0)} KB)`);
