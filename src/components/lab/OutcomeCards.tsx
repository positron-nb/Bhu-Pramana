"use client";

import clsx from "clsx";
import type { OutputId } from "@/lib/domain/schemas";
import { outputById, type SimulationResult } from "@/lib/sim/model";
import { GradeBadge } from "@/components/ui";
import { Delta } from "@/components/charts";

export function OutcomeCards({ res, selected, onSelect, className }: { res: SimulationResult; selected: OutputId; onSelect: (id: OutputId) => void; className?: string }) {
  return (
    <div className={clsx("grid grid-cols-2 gap-2.5 lg:grid-cols-3", className)}>
      {res.outputs.map((o) => {
        const d = outputById[o.id];
        const active = o.id === selected;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            aria-pressed={active}
            className={clsx("panel p-3 text-left transition-all", active ? "ring-2 ring-saffron/70" : "hover:border-rule-strong", o.improves === null && "opacity-70")}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="label-caps text-muted">{d.short}</div>
              <GradeBadge grade={o.grade} />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-serif text-[24px] font-semibold leading-none tabular text-ink-900">{o.scenario.toFixed(d.decimals)}</span>
              <span className="text-[11px] text-muted">{d.unit === "index" || d.unit === "score" ? "" : d.unit}</span>
              <span className="ml-auto"><Delta value={o.deltaPct} goodWhenNegative={!d.higherIsBetter} /></span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted tabular">
              <span>was {o.baseline.toFixed(d.decimals)}</span>
              <span>{o.improves === null ? "no change" : `${o.low.toFixed(d.decimals)}–${o.high.toFixed(d.decimals)}`}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
