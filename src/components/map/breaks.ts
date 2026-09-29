import { indicatorById } from "@/data/indicators";
import type { IndicatorId } from "@/lib/domain/schemas";
import { DISTRICTS, STATES } from "@/lib/data/regions";
import { RAMP_GOOD, RAMP_RISK } from "@/lib/viz";

export interface MapBreaks { breaks: number[]; ramp: string[]; min: number; max: number }

/** Quantile class breaks for a choropleth (7 classes, one-hue ramp). */
export function computeBreaks(layer: IndicatorId, level: "state" | "district"): MapBreaks {
  const def = indicatorById[layer];
  const pool = level === "district" ? DISTRICTS : STATES;
  const vals = pool.map((r) => r.indicators[layer]).filter(Number.isFinite).sort((a, b) => a - b);
  const ramp = def.higherIsBetter ? RAMP_GOOD : RAMP_RISK;
  const breaks: number[] = [];
  for (let i = 1; i < ramp.length; i++) breaks.push(vals[Math.floor((i / ramp.length) * (vals.length - 1))]);
  return { breaks, ramp, min: vals[0], max: vals[vals.length - 1] };
}
