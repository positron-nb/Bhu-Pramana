"use client";

import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, MapPin, Microscope } from "lucide-react";
import type { Decision, Verdict } from "@/lib/sim/decision";
import type { SimulationResult } from "@/lib/sim/model";
import { Cite } from "@/components/ui";

const TONE: Record<Verdict, { dot: string; text: string; ring: string }> = {
  adopt: { dot: "bg-[#4fae7f]", text: "text-[#8fd6b0]", ring: "ring-[#4fae7f]/40" },
  pilot: { dot: "bg-[#e0b23b]", text: "text-[#f1d27f]", ring: "ring-[#e0b23b]/40" },
  research: { dot: "bg-saffron", text: "text-saffron-soft", ring: "ring-saffron/40" },
  reconsider: { dot: "bg-[#e0715a]", text: "text-[#f2ab9b]", ring: "ring-[#e0715a]/40" },
  none: { dot: "bg-ink-400", text: "text-ink-200", ring: "ring-ink-500/40" },
};

export function DecisionCard({ decision, res, placeName, national }: { decision: Decision; res: SimulationResult; placeName: string; national?: { verdict: Verdict; label: string; caption: string } | null }) {
  const t = TONE[decision.verdict];
  const score = res.confidence.score;
  return (
    <section className="relative overflow-hidden rounded-md bg-ink-950 text-paper shadow-float" aria-live="polite">
      <div className="survey-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <div className="label-caps text-saffron">Evidence-to-decision · {placeName}</div>
          <div className="mt-2 flex items-center gap-3">
            <span className={clsx("size-3 rounded-full ring-4", t.dot, t.ring)} />
            <h2 className={clsx("font-serif text-[30px] font-semibold leading-none md:text-[34px]", t.text)}>{decision.label}</h2>
          </div>
          <p className="mt-3 max-w-[760px] text-[15.5px] leading-relaxed text-ink-100">{decision.headline}</p>
          {decision.reasons.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-ink-800 pt-3">
              {decision.reasons.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-200">
                  <span className="mt-[8px] size-1 shrink-0 rounded-full bg-ink-400" />
                  <span>
                    {r.text} {r.cites.map((id) => <Cite key={id} id={id} />)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:border-l lg:border-ink-800 lg:pl-5">
          <div>
            <div className="label-caps text-ink-400">Evidence confidence</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif text-[40px] font-semibold leading-none tabular">{score === null ? "—" : Math.round(score * 100)}</span>
              <span className="text-[13px] text-ink-300">/100 · {res.confidence.grade ?? "n/a"}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-800">
              <div className={clsx("h-full rounded-full transition-[width] duration-500", t.dot)} style={{ width: `${Math.round((score ?? 0) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-ink-400">Quality of the studies behind the assumptions that drive this result, weighted by how much each drives it.</p>
          </div>
          {national && (
            <div className="rounded border border-ink-800 bg-ink-900/70 px-3 py-2 text-[12px]">
              <div className="flex items-center gap-1.5 text-ink-400"><MapPin size={12} /> {national.caption}</div>
              <div className={clsx("mt-0.5 font-semibold", TONE[national.verdict].text)}>{national.label}</div>
            </div>
          )}
          {decision.nextStudy && (
            <Link href={decision.driver ? `/agenda?focus=${decision.driver.assumption.id}#assumptions` : "/agenda"} className="group rounded border border-saffron/30 bg-saffron/10 px-3 py-2 text-[12px] transition-colors hover:bg-saffron/20">
              <div className="flex items-center gap-1.5 text-saffron"><Microscope size={12} /> What would change this decision</div>
              <div className="mt-0.5 leading-snug text-ink-100">{decision.nextStudy}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-saffron-soft">Research agenda <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" /></div>
            </Link>
          )}
        </div>
      </div>
      <div className="relative border-t border-ink-800 px-5 py-2 text-[10.5px] text-ink-400 md:px-6">Illustrative policy scenario — not an official forecast · demonstration data</div>
    </section>
  );
}
