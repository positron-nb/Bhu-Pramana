"use client";

import clsx from "clsx";
import { assumptionById } from "@/data/assumptions";
import type { Levers, Region } from "@/lib/domain/schemas";
import type { Grade } from "@/lib/evidence/strength";
import { LEVERS, statusQuoLevers } from "@/lib/sim/model";
import { Badge } from "@/components/ui";

export function formatLever(id: keyof Levers, v: number): string {
  if (id === "rolloutYears") return `${v} yr${v > 1 ? "s" : ""}`;
  if (id === "zoning") return `${v}/100`;
  if (id === "digitization") return `+${v} pp`;
  if (id === "climateInvestment") return `${v}%`;
  return `+${v}%`;
}

export function LeverPanel({
  region,
  levers,
  onChange,
  strengths,
  onFocusAssumption,
}: {
  region: Region;
  levers: Levers;
  onChange: (l: Levers) => void;
  strengths?: Record<string, { grade: Grade }>;
  onFocusAssumption?: (id: string) => void;
}) {
  const sq = statusQuoLevers(region);
  return (
    <div className="divide-y divide-rule/70">
      {LEVERS.map((l) => {
        const v = levers[l.id];
        const base = sq[l.id];
        const max = l.id === "digitization" ? Math.max(0, Math.min(l.max, Math.floor(99 - region.indicators.digitization))) : l.max;
        const pct = ((v - l.min) / (l.max - l.min)) * 100;
        const basePct = ((base - l.min) / (l.max - l.min)) * 100;
        const changed = v !== base;
        return (
          <div key={l.id} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={`lever-${l.id}`} className="text-[13.5px] font-semibold text-ink-900">{l.label}</label>
              <span className={clsx("font-mono text-[13px] tabular", changed ? "font-semibold text-saffron-deep" : "text-muted")}>{formatLever(l.id, v)}</span>
            </div>
            <div className="relative mt-1">
              <input
                id={`lever-${l.id}`}
                type="range"
                min={l.min}
                max={l.max}
                step={l.step}
                value={v}
                onChange={(e) => onChange({ ...levers, [l.id]: Math.min(Number(e.target.value), max) })}
                className="lever-range"
                style={{ ["--fill" as string]: `${pct}%` }}
                aria-describedby={`lever-help-${l.id}`}
              />
              {l.id !== "rolloutYears" && (
                <span className="pointer-events-none absolute top-[3px] h-4 w-[2px] rounded bg-ink-700/60" style={{ left: `calc(${basePct}% + ${(0.5 - basePct / 100) * 16}px - 1px)` }} title="Status quo" />
              )}
            </div>
            <p id={`lever-help-${l.id}`} className="mt-0.5 text-[11.5px] leading-snug text-muted">
              {l.help}
              {l.id === "digitization" && max < l.max && <span className="text-saffron-deep"> Capped at +{max} pp: {region.name} is already {region.indicators.digitization.toFixed(0)}% digitised.</span>}
              {l.id === "zoning" && <span> Current: {base}.</span>}
            </p>
            {strengths && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {l.assumptions.map((a) => (
                  <button key={a} type="button" onClick={() => onFocusAssumption?.(a)} title={assumptionById[a].label}>
                    <Badge tone="inferred" className="cursor-pointer hover:bg-inferred hover:text-white">{a} · {strengths[a]?.grade}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
