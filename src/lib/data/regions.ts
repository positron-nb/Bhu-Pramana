import raw from "@/data/generated/regions.json";
import type { IndicatorId, Region } from "@/lib/domain/schemas";

export const REGIONS = raw.regions as unknown as Region[];
export const REGION_YEARS: number[] = raw.years;
export const DATA_NOTICE = "Demonstration Dataset — Not an Official Government Record";
export const BASE_YEAR = 2025;

export const regionByCode: Record<string, Region> = Object.fromEntries(REGIONS.map((r) => [r.code, r]));

export const STATES = REGIONS.filter((r) => r.level === "state").sort((a, b) => a.name.localeCompare(b.name));
export const DISTRICTS = REGIONS.filter((r) => r.level === "district");
export const FOCUS_STATES = STATES.filter((s) => s.focus);
export const NATIONAL = regionByCode["IN"];

export function getRegion(code: string | null | undefined): Region | undefined {
  if (!code) return undefined;
  return regionByCode[code];
}

export function childrenOf(code: string): Region[] {
  return REGIONS.filter((r) => r.parent === code);
}

export function stateOf(code: string): Region | undefined {
  const r = regionByCode[code];
  if (!r) return undefined;
  if (r.level === "state") return r;
  if (r.level === "district" && r.parent) return regionByCode[r.parent];
  return undefined;
}

export function regionLabel(code: string | null | undefined): string {
  const r = getRegion(code);
  if (!r) return code ?? "—";
  if (r.level === "district") return `${r.name}, ${regionByCode[r.parent!]?.name ?? r.parent}`;
  return r.name;
}

/** Region lineage used for relevance scoring: [district, state, IN]. */
export function lineage(code: string): string[] {
  const out: string[] = [];
  let cur: Region | undefined = regionByCode[code];
  while (cur) {
    out.push(cur.code);
    cur = cur.parent ? regionByCode[cur.parent] : undefined;
  }
  return out;
}

export function indicatorValue(code: string, id: IndicatorId): number | undefined {
  return regionByCode[code]?.indicators[id];
}

/** Common alternate names, old/new district names and abbreviations. */
const ALIASES: Record<string, string> = {
  "uttar pradesh": "UP", "u.p.": "UP", "up": "UP", maharashtra: "MH", karnataka: "KA", odisha: "OD", orissa: "OD", assam: "AS", rajasthan: "RJ",
  bihar: "BR", "west bengal": "WB", "madhya pradesh": "MP", "tamil nadu": "TN", gujarat: "GJ", "andhra pradesh": "AP", telangana: "TG", kerala: "KL",
  jharkhand: "JH", punjab: "PB", chhattisgarh: "CG", haryana: "HR", delhi: "DL", "jammu and kashmir": "JK", uttarakhand: "UK", "himachal pradesh": "HP",
  tripura: "TR", meghalaya: "ML", manipur: "MN", nagaland: "NL", goa: "GA", "arunachal pradesh": "AR", puducherry: "PY", mizoram: "MZ", chandigarh: "CH",
  sikkim: "SK", ladakh: "LA", lakshadweep: "LD", "andaman and nicobar": "AN",
  bengaluru: "D572", bangalore: "D572", "bengaluru urban": "D572", "bengaluru rural": "D583", mysuru: "D577", mysore: "D577", prayagraj: "D175", allahabad: "D175",
  noida: "D141", "greater noida": "D141", "gautam buddha nagar": "D141", ghaziabad: "D140", lucknow: "D157", kanpur: "D164", varanasi: "D197", agra: "D146",
  mumbai: "D519", bombay: "D519", pune: "D521", thane: "D517", nagpur: "D505", nashik: "D516", aurangabad: "D515", "chhatrapati sambhajinagar": "D515",
  ahilyanagar: "D522", ahmednagar: "D522", ahmadnagar: "D522", dharashiv: "D525", osmanabad: "D525", kalaburagi: "D579", gulbarga: "D579", belagavi: "D555",
  belgaum: "D555", vijayapura: "D557", bijapur: "D557", ballari: "D565", bellary: "D565", shivamogga: "D568", tumakuru: "D571", tumkur: "D571",
  ayodhya: "D177", faizabad: "D177", guwahati: "D322", "kamrup metropolitan": "D322", bhubaneswar: "D386", khordha: "D386", cuttack: "D381", puri: "D387",
  kendrapara: "D379", jaipur: "D110", jodhpur: "D113", barmer: "D115", jaisalmer: "D114", dhemaji: "D308", barpeta: "D303", koraput: "D398", bahraich: "D180",
  gorakhpur: "D188", ratnagiri: "D528", kodagu: "D576", coorg: "D576",
};

let nameIndex: Array<{ key: string; code: string }> | null = null;
function buildNameIndex() {
  const idx = new Map<string, string>();
  for (const r of REGIONS) if (r.level !== "country") idx.set(r.name.toLowerCase(), r.code);
  for (const [k, v] of Object.entries(ALIASES)) idx.set(k, v);
  // longest first so "bengaluru rural" beats "bengaluru"
  nameIndex = [...idx.entries()].map(([key, code]) => ({ key, code })).sort((a, b) => b.key.length - a.key.length);
  return nameIndex;
}

/** Detect region mentions in free text. Returns codes (districts and states). */
export function findRegionsInText(text: string): { code: string; match: string }[] {
  const idx = nameIndex ?? buildNameIndex();
  let hay = ` ${text.toLowerCase().replace(/[^a-z0-9.\s]/g, " ").replace(/\s+/g, " ")} `;
  const found: { code: string; match: string }[] = [];
  for (const { key, code } of idx) {
    if (key.length <= 3) continue; // "up", "u.p." are handled case-sensitively below
    const needle = ` ${key} `;
    const pos = hay.indexOf(needle);
    if (pos >= 0) {
      found.push({ code, match: key });
      hay = hay.slice(0, pos) + " ".repeat(needle.length) + hay.slice(pos + needle.length);
    }
  }
  // "UP" only when written in capitals — "scale up" must not match Uttar Pradesh
  if (/\bU\.?P\.?(?=\s|$|[,;:)])/.test(text) && !found.some((f) => f.code === "UP")) found.push({ code: "UP", match: "UP" });
  return found;
}
