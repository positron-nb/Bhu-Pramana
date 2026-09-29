"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { ASSUMPTIONS } from "@/data/assumptions";
import { evidenceById } from "@/data/evidence";
import { regionLabel } from "@/lib/data/regions";
import { assumptionStrength, DESIGN_LABEL, sourceWeight } from "@/lib/evidence/strength";
import { Badge, DemoBadge, GradeBadge, Panel, PanelHeader } from "@/components/ui";

/** All twelve model coefficients with the studies behind them, graded for a region. */
export function AssumptionTable({ regionCode, focus, setFocus, used, title = "Every coefficient, with the studies behind it" }: { regionCode: string; focus: string | null; setFocus: (id: string | null) => void; used?: Set<string>; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) ref.current?.querySelector(`[data-a="${focus}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus]);
  return (
    <Panel id="assumptions" className="scroll-mt-24">
      <PanelHeader eyebrow="Evidence-backed model assumptions" title={title} right={<span className="text-[12px] text-muted">graded for {regionLabel(regionCode)}</span>} />
      <div ref={ref} className="divide-y divide-rule/70">
        {ASSUMPTIONS.map((a) => {
          const s = assumptionStrength(a, regionCode);
          const open = focus === a.id;
          return (
            <div key={a.id} data-a={a.id} className={clsx(open && "bg-saffron-soft/30")}>
              <button type="button" onClick={() => setFocus(open ? null : a.id)} className="grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-left hover:bg-paper-2/70 md:grid-cols-[48px_minmax(0,1fr)_170px_110px_20px]" aria-expanded={open}>
                <span className={clsx("font-mono text-[12px]", !used || used.has(a.id) ? "font-semibold text-inferred" : "text-faint")}>{a.id}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-ink-900">{a.label}</span>
                  <span className="block truncate text-[11.5px] text-muted">{a.description}</span>
                </span>
                <span className="hidden font-mono text-[12px] tabular text-ink-800 md:block">{a.central > 0 ? "+" : ""}{a.central} <span className="text-faint">[{a.low} … {a.high}]</span></span>
                <span className="justify-self-end"><GradeBadge grade={s.grade} score={s.score} /></span>
                <ChevronDown size={14} className={clsx("hidden text-faint transition-transform md:block", open && "rotate-180")} />
              </button>
              {open && (
                <div className="grid gap-4 px-4 pb-4 md:grid-cols-2 md:pl-[76px]">
                  <div>
                    <div className="label-caps mb-1 text-muted">Rationale · {a.unit}</div>
                    <p className="text-[13px] leading-relaxed text-ink-800">{a.rationale}</p>
                    {s.contradictionShare > 0 && <p className="mt-2 text-[12px] text-risk">Contradicting evidence carries {(s.contradictionShare * 100).toFixed(0)}% of the evidential weight here.</p>}
                  </div>
                  <div>
                    <div className="label-caps mb-1 text-muted">Evidence (weight for this region)</div>
                    <ul className="space-y-1">
                      {[...s.supporting.map((x) => ({ ...x, side: "supports" })), ...s.contradicting.map((x) => ({ ...x, side: "contradicts" }))].map((x) => {
                        const e = evidenceById[x.id];
                        return (
                          <li key={x.id} className="flex items-center gap-2 text-[12.5px]">
                            <Badge tone={x.side === "supports" ? "green" : "risk"}>{x.side}</Badge>
                            <Link href={`/evidence/${x.id}`} className="min-w-0 flex-1 truncate text-ink-800 hover:text-saffron-deep"><span className="font-mono text-faint">{x.id}</span> {e?.title}</Link>
                            <span className="hidden shrink-0 text-[11px] text-faint sm:inline">{e ? `${DESIGN_LABEL[e.design]} · ${e.year}` : ""}</span>
                            <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular text-ink-800" title="design × relevance × recency">{e ? sourceWeight(e, regionCode).toFixed(2) : ""}</span>
                            {e?.provenance === "synthetic" && <DemoBadge className="hidden lg:inline-flex" />}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
