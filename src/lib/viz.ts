/**
 * Colour roles for charts and maps, validated with the dataviz palette checker
 * against the card surface #fbf8f1:
 *   baseline #3a6db0 · scenario #d0701a · third #1f8a5b  (all-pairs CVD-safe)
 * Sequential ramps (single hue, light → dark):
 *   RAMP_RISK — pressure / risk indicators (higher is worse)
 *   RAMP_GOOD — capacity / performance indicators (higher is better)
 */
export const SERIES = { baseline: "#3a6db0", scenario: "#d0701a", third: "#1f8a5b" };
export const RAMP_RISK = ["#fbeedd", "#f6d3ac", "#efb57c", "#e3924d", "#d0701a", "#a8540f", "#7a3a08"];
export const RAMP_GOOD = ["#e3ecf7", "#bfd3ec", "#94b6de", "#6694cd", "#3a6db0", "#2b5590", "#1c3c68"];

export function rampColor(t: number, ramp: string[]): string {
  const x = Math.max(0, Math.min(0.9999, t)) * ramp.length;
  return ramp[Math.floor(x)];
}
