import { assumptionById } from "@/data/assumptions";
import { evidenceById } from "@/data/evidence";
import type { Assumption, Levers, OutputId, Region } from "@/lib/domain/schemas";
import { regionLabel } from "@/lib/data/regions";
import { geographicRelevance, gradeOf, type Grade } from "@/lib/evidence/strength";
import type { Cited } from "@/lib/ai/copilot";
import { LEVERS, outputById, statusQuoLevers, type OutputResult, type SimulationResult } from "./model";

/**
 * Evidence-to-decision rule — deterministic and explainable.
 *
 *   • If the policy makes the headline outcome worse           → Reconsider
 *   • If the assumption driving the result is contradicted by
 *     evidence from this district or state                     → Pilot first
 *   • Confidence ≥ 0.75 and the driver is well evidenced       → Adopt with monitoring
 *   • Confidence ≥ 0.50                                        → Pilot first
 *   • otherwise                                                → Build the evidence first
 */

export type Verdict = "adopt" | "pilot" | "research" | "reconsider" | "none";

export const VERDICT_META: Record<Verdict, { label: string; tone: "green" | "amber" | "saffron" | "risk" | "neutral"; short: string }> = {
  adopt: { label: "Adopt with monitoring", short: "Adopt", tone: "green" },
  pilot: { label: "Pilot first", short: "Pilot", tone: "amber" },
  research: { label: "Build the evidence first", short: "Research", tone: "saffron" },
  reconsider: { label: "Reconsider the package", short: "Reconsider", tone: "risk" },
  none: { label: "No policy change yet", short: "—", tone: "neutral" },
};

export interface DecisionDriver {
  assumption: Assumption;
  share: number;
  strength: number;
  grade: Grade;
  supporting: string[];
  contradicting: string[];
  localContradicting: string[];
}

export interface Decision {
  verdict: Verdict;
  label: string;
  headline: string;
  headlineOutput: OutputResult | null;
  driver: DecisionDriver | null;
  reasons: Cited[];
  nextStudy: string | null;
  policy: string;
}

const SECONDARY: OutputId[] = ["digitizationCoverage", "implementationScore"];

/** How each outcome reads inside a sentence. */
export const OUTCOME_PHRASE: Record<OutputId, string> = {
  disputePressure: "land-dispute pressure",
  processingDays: "mutation processing time",
  digitizationCoverage: "record digitisation coverage",
  landUsePressure: "land-use conversion pressure",
  climateResilience: "climate resilience",
  implementationScore: "implementation feasibility",
};

/** "+40% dispute-resolution capacity and +9 pp digitisation over 4 years" */
export function describeLevers(levers: Levers, region: Region): string {
  const sq = statusQuoLevers(region);
  const parts: string[] = [];
  for (const l of LEVERS) {
    if (l.id === "rolloutYears" || levers[l.id] === sq[l.id]) continue;
    const v = levers[l.id];
    if (l.id === "zoning") parts.push(`zoning enforcement ${sq.zoning}→${v}`);
    else if (l.id === "digitization") parts.push(`+${v} pp record digitisation`);
    else if (l.id === "climateInvestment") parts.push(`${v}% of the land budget for climate resilience`);
    else parts.push(`+${v}% ${l.label.toLowerCase()}`);
  }
  if (!parts.length) return "the status quo";
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
  return `${list} over ${levers.rolloutYears} year${levers.rolloutYears > 1 ? "s" : ""}`;
}

/** Apply the same policy change (relative to status quo) in another region. */
export function transferLevers(levers: Levers, from: Region, to: Region): Levers {
  const a = statusQuoLevers(from);
  const b = statusQuoLevers(to);
  return {
    ...levers,
    zoning: Math.max(0, Math.min(100, b.zoning + (levers.zoning - a.zoning))),
    digitization: Math.max(0, Math.min(levers.digitization, Math.floor(99 - to.indicators.digitization))),
  };
}

/** The outcome a decision-maker cares about most in this scenario. */
export function headlineOutput(res: SimulationResult, prefer?: OutputId): OutputResult | null {
  const moved = res.outputs.filter((o) => o.improves !== null);
  if (!moved.length) return null;
  const preferred = prefer ? moved.find((o) => o.id === prefer) : undefined;
  if (preferred) return preferred;
  return [...moved].sort((a, b) => Number(SECONDARY.includes(a.id)) - Number(SECONDARY.includes(b.id)) || Math.abs(b.deltaPct) - Math.abs(a.deltaPct))[0];
}

const pct = (x: number) => `${Math.round(x * 100)}`;

export function decide(res: SimulationResult, region: Region, levers: Levers, prefer?: OutputId): Decision {
  const policy = describeLevers(levers, region);
  const h = headlineOutput(res, prefer);
  const place = regionLabel(region.code);
  const endYear = res.years[res.years.length - 1];
  if (!h) {
    return { verdict: "none", label: VERDICT_META.none.label, headline: `With all levers at status quo, ${place} follows its baseline trajectory to ${endYear}.`, headlineOutput: null, driver: null, reasons: [], nextStudy: null, policy };
  }

  const def = outputById[h.id];
  const fmt = (v: number) => v.toFixed(def.decimals);
  const change = `${h.deltaPct < 0 ? "cut" : "raise"} ${OUTCOME_PHRASE[h.id]} in ${region.name} by ${Math.abs(h.deltaPct).toFixed(0)}% by ${endYear}`;

  const top = h.sensitivity[0];
  let driver: DecisionDriver | null = null;
  if (top) {
    const a = assumptionById[top.assumption];
    const strength = res.assumptionStrengths[a.id].score;
    const localContradicting = a.contradicting.filter((id) => evidenceById[id] && geographicRelevance(evidenceById[id], region.code) >= 0.9 && region.level !== "country");
    driver = { assumption: a, share: top.share, strength, grade: gradeOf(strength), supporting: a.supporting, contradicting: a.contradicting, localContradicting };
  }

  const conf = res.confidence.score ?? 0;
  let verdict: Verdict;
  if (h.improves === false) verdict = "reconsider";
  else if (driver?.localContradicting.length) verdict = "pilot";
  else if (conf >= 0.75 && (driver?.strength ?? 0) >= 0.6) verdict = "adopt";
  else if (conf >= 0.5) verdict = "pilot";
  else verdict = "research";

  const nextStudy = res.priorities[0]?.question ?? null;
  const driverTxt = driver ? `${pct(driver.share)}% of that projection rests on ${driver.assumption.id} (${driver.assumption.label.toLowerCase()})` : "";

  let headline: string;
  switch (verdict) {
    case "reconsider":
      headline = `${capital(policy)} would ${change} — the wrong direction. Reconsider the package before any roll-out.`;
      break;
    case "pilot":
      headline = driver?.localContradicting.length
        ? `${capital(policy)} is projected to ${change} — but pilot first: ${driverTxt}, and evidence from this area (${driver.localContradicting.join(", ")}) points the other way.`
        : `${capital(policy)} is projected to ${change}. The evidence is moderate (${pct(conf)}/100): pilot in comparable districts with a comparison group before scaling.`;
      break;
    case "adopt":
      headline = `${capital(policy)} is projected to ${change}, on strong and consistent evidence (${pct(conf)}/100). Adopt at scale with monitoring of ${def.short.toLowerCase()}.`;
      break;
    default:
      headline = `${capital(policy)} might ${change}, but the projection is too uncertain to act on: ${driverTxt}, whose evidence is weak (${pct(driver?.strength ?? 0)}/100). Build the evidence first.`;
  }

  const reasons: Cited[] = [];
  reasons.push({ text: `${def.label}: ${fmt(h.baseline)} under the status quo vs ${fmt(h.scenario)} under the scenario in ${endYear} (plausible range ${fmt(h.low)}–${fmt(h.high)}).`, cites: ["DS-011", ...(top ? [top.assumption] : [])] });
  if (driver) {
    reasons.push({ text: `${pct(driver.share)}% of the uncertainty in that number comes from ${driver.assumption.id} — ${driver.assumption.label.toLowerCase()} — whose evidence is ${driver.grade.toLowerCase()} (${pct(driver.strength)}/100) for ${region.name}.`, cites: [driver.assumption.id, ...driver.supporting.slice(0, 3)] });
    for (const id of driver.localContradicting) {
      const e = evidenceById[id];
      const f = e.findings.find((x) => x.intervention === driver!.assumption.intervention) ?? e.findings[0];
      reasons.push({ text: `Local evidence disagrees: ${f ? f.statement.charAt(0).toLowerCase() + f.statement.slice(1).replace(/\.$/, "") : e.title}${f?.context ? ` (${f.context.replace(/\.$/, "").toLowerCase()})` : ""}.`, cites: [id] });
    }
  }
  for (const o of res.outputs.filter((x) => x.improves === false && x.id !== h.id && Math.abs(x.deltaPct) >= 1)) {
    reasons.push({ text: `Trade-off: ${OUTCOME_PHRASE[o.id]} moves ${o.deltaPct > 0 ? "+" : ""}${o.deltaPct.toFixed(1)}%.`, cites: o.sensitivity.slice(0, 1).map((s) => s.assumption) });
  }
  if (res.diagnostics.overload > 0.05) {
    reasons.push({ text: `The package exceeds administrative absorptive capacity: about ${Math.round((1 - res.diagnostics.efficiency) * 100)}% of planned progress is lost — a longer roll-out recovers most of it.`, cites: ["A10"] });
  }

  return { verdict, label: VERDICT_META[verdict].label, headline, headlineOutput: h, driver, reasons, nextStudy, policy };
}

function capital(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
