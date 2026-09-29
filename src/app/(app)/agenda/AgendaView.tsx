"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, CalendarClock, Check, CircleDashed, Lightbulb, Send, Sigma, Target } from "lucide-react";
import { EVIDENCE, evidenceById } from "@/data/evidence";
import { OPPORTUNITIES } from "@/data/opportunities";
import { INTERVENTIONS, interventionById, OUTCOMES, outcomeById } from "@/data/taxonomy";
import type { InterventionId, OutcomeId } from "@/lib/domain/schemas";
import { NATIONAL, regionByCode } from "@/lib/data/regions";
import { bodyStrength, DESIGN_LABEL, evidenceLevel } from "@/lib/evidence/strength";
import { simulate, statusQuoLevers } from "@/lib/sim/model";
import { useHydrated, useStore } from "@/lib/store";
import { can } from "@/lib/roles";
import { RAMP_GOOD, rampColor } from "@/lib/viz";
import { Badge, Button, DemoBadge, PageHeader, Panel, PanelHeader, TypeMark } from "@/components/ui";
import { AssumptionTable } from "@/components/lab/AssumptionTable";

interface Cell { iv: InterventionId; o: OutcomeId; ids: string[]; dirs: Set<string>; strength: number; causal: number }

function buildMatrix(): Map<string, Cell> {
  const m = new Map<string, Cell>();
  for (const e of EVIDENCE) {
    if (!(e.type === "research" || e.type === "case-study" || e.type === "report")) continue;
    for (const f of e.findings) {
      const k = `${f.intervention}|${f.outcome}`;
      const c = m.get(k) ?? { iv: f.intervention, o: f.outcome, ids: [], dirs: new Set<string>(), strength: 0, causal: 0 };
      if (!c.ids.includes(e.id)) c.ids.push(e.id);
      c.dirs.add(f.direction);
      m.set(k, c);
    }
  }
  for (const c of m.values()) {
    c.strength = bodyStrength(c.ids).score;
    c.causal = c.ids.filter((id) => ["quasi-experimental", "rct", "systematic-review"].includes(evidenceById[id].design)).length;
  }
  return m;
}

const ORIGIN: Record<string, { label: string; tone: "saffron" | "risk" | "documented" | "green"; icon: typeof Target }> = {
  "evidence-gap": { label: "From an evidence gap", tone: "documented", icon: CircleDashed },
  sensitivity: { label: "From model sensitivity", tone: "saffron", icon: Sigma },
  conflict: { label: "From conflicting evidence", tone: "risk", icon: AlertTriangle },
  "ministry-priority": { label: "Ministry priority", tone: "green", icon: Target },
};

export function AgendaView() {
  const hydrated = useHydrated();
  const role = useStore((s) => s.role);
  const interests = useStore((s) => s.interests);
  const toggleInterest = useStore((s) => s.toggleInterest);
  const addNote = useStore((s) => s.addNote);
  const matrix = useMemo(() => buildMatrix(), []);
  const [sel, setSel] = useState<Cell | { iv: InterventionId; o: OutcomeId; ids: string[] } | null>(null);
  const [kind, setKind] = useState<string>("all");
  const [proposed, setProposed] = useState<string | null>(null);
  // ?focus=A07 opens that model assumption (links from citations, evidence pages and decisions)
  const focusParam = useSearchParams().get("focus");
  const [focus, setFocus] = useState<string | null>(focusParam);
  const [focusFor, setFocusFor] = useState(focusParam);
  if (focusFor !== focusParam) {
    setFocusFor(focusParam);
    setFocus(focusParam);
  }

  const maxN = Math.max(...[...matrix.values()].map((c) => c.ids.length));

  // national reference scenario → value-of-information priorities
  const priorities = useMemo(() => {
    const sq = statusQuoLevers(NATIONAL);
    return simulate(NATIONAL, { ...sq, digitization: 15, disputeCapacity: 40, climateInvestment: 8, infrastructure: 20, zoning: Math.min(70, sq.zoning + 10), rolloutYears: 3 }).priorities;
  }, []);
  const conflicts = useMemo(() => [...matrix.values()].filter((c) => c.dirs.size > 1 && [...c.dirs].some((d) => d === "increase") && [...c.dirs].some((d) => d === "decrease" || d === "no-effect")), [matrix]);
  const gaps = useMemo(() => {
    const leverIvs = INTERVENTIONS.filter((i) => i.lever || ["conclusive-titling", "resurvey", "tenancy-reform", "gender-rights"].includes(i.id)).map((i) => i.id);
    const keyOutcomes: OutcomeId[] = ["dispute-incidence", "tenure-security", "equity", "credit-access", "climate-resilience"];
    const out: { iv: InterventionId; o: OutcomeId; n: number }[] = [];
    for (const iv of leverIvs) for (const o of keyOutcomes) {
      const c = matrix.get(`${iv}|${o}`);
      if (!c || c.causal === 0) out.push({ iv, o, n: c?.ids.length ?? 0 });
    }
    return out.slice(0, 8);
  }, [matrix]);

  const opps = OPPORTUNITIES.filter((o) => kind === "all" || o.kind === kind);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        eyebrow="Research Agenda & Innovation Portal"
        title="Where India needs better land-governance evidence"
        description="An evidence gap map in the format used by evidence-synthesis bodies: every policy approach against every outcome. Empty cells and cells without causal evidence become research priorities — alongside the model assumptions that most drive uncertainty in casefile decisions, and the findings that conflict."
      />

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="min-w-0 overflow-hidden">
          <PanelHeader eyebrow="Evidence gap map" title="Policy approaches × outcomes" right={<span className="hidden text-[12px] text-muted md:inline">Bubble = number of studies · colour = evidence strength · ring = conflicting findings</span>} />
          <div className="overflow-x-auto p-3">
            <table className="w-full min-w-[860px] border-separate border-spacing-0 text-[12px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-[190px] bg-card" />
                  {OUTCOMES.map((o) => (
                    <th key={o.id} className="h-[86px] min-w-[70px] align-bottom px-1 pb-2">
                      <div className="mx-auto w-[70px] text-center text-[11px] font-semibold leading-tight text-ink-800">{o.short}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INTERVENTIONS.map((iv) => (
                  <tr key={iv.id}>
                    <th className="sticky left-0 z-10 border-t border-rule bg-card py-1.5 pr-3 text-left text-[12px] font-medium text-ink-900">{iv.label}</th>
                    {OUTCOMES.map((o) => {
                      const c = matrix.get(`${iv.id}|${o.id}`);
                      const n = c?.ids.length ?? 0;
                      const size = n ? 12 + (n / maxN) * 26 : 0;
                      const conflict = c && c.dirs.size > 1;
                      const active = sel && sel.iv === iv.id && sel.o === o.id;
                      return (
                        <td key={o.id} className={clsx("border-t border-rule p-0 text-center", active && "bg-saffron-soft/60")}>
                          <button
                            onClick={() => setSel(c ?? { iv: iv.id, o: o.id, ids: [] })}
                            className="grid h-[46px] w-full place-items-center hover:bg-paper-2"
                            aria-label={`${iv.short} × ${o.short}: ${n} studies`}
                            title={`${iv.short} → ${o.short}: ${n} ${n === 1 ? "study" : "studies"}${c ? ` · strength ${Math.round(c.strength * 100)} · ${c.causal} causal` : " · evidence gap"}`}
                          >
                            {n ? (
                              <span className="grid place-items-center rounded-full text-[10px] font-semibold text-white" style={{ width: size, height: size, background: rampColor(0.25 + c!.strength * 0.75, RAMP_GOOD), boxShadow: conflict ? "0 0 0 2px #fbf8f1, 0 0 0 3.5px #ae3f2a" : "0 0 0 2px #fbf8f1" }}>
                                {n}
                              </span>
                            ) : (
                              <span className="size-3 rounded-full border border-dashed border-rule-strong" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="h-fit">
          {sel ? (
            <>
              <PanelHeader eyebrow="Cell" title={`${interventionById[sel.iv].short} → ${outcomeById[sel.o].short}`} />
              <div className="space-y-3 p-4">
                {sel.ids.length === 0 ? (
                  <p className="text-[13px] text-muted">No study in the repository examines this relationship. This is an <strong className="text-ink-900">evidence gap</strong>.</p>
                ) : (
                  <ul className="space-y-2">
                    {sel.ids.map((id) => {
                      const e = evidenceById[id];
                      const f = e.findings.find((x) => x.intervention === sel.iv && x.outcome === sel.o);
                      return (
                        <li key={id}>
                          <Link href={`/evidence/${id}`} className="block rounded border border-rule bg-paper px-2.5 py-2 hover:border-ink-400">
                            <div className="flex flex-wrap items-center gap-1.5"><TypeMark type={e.type} showLabel={false} /><span className="font-mono text-[10.5px] text-faint">{id} · {e.year}</span><Badge>{evidenceLevel(e.design).level}</Badge>{e.provenance === "synthetic" && <DemoBadge />}</div>
                            <div className="mt-0.5 text-[12.5px] font-medium text-ink-900">{e.title}</div>
                            {f && <div className="mt-0.5 text-[12px] text-muted"><span className={f.direction === "decrease" ? "text-observed" : f.direction === "increase" ? "text-saffron-deep" : "text-amber"}>{f.direction}</span> · {f.statement}</div>}
                            <div className="text-[11px] text-faint">{DESIGN_LABEL[e.design]}</div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {hydrated && can(role, "propose") ? (
                  proposed === `${sel.iv}|${sel.o}` ? (
                    <div className="flex items-center gap-2 rounded bg-green-soft px-3 py-2 text-[12.5px] text-green-deep"><Check size={14} /> Proposal saved to your workspace notes.</div>
                  ) : (
                    <Button variant="primary" size="sm" className="w-full" onClick={() => { addNote(null, `Research proposal: effect of ${interventionById[sel.iv].label.toLowerCase()} on ${outcomeById[sel.o].label.toLowerCase()} (current evidence: ${sel.ids.length} studies).`); setProposed(`${sel.iv}|${sel.o}`); }}>
                      <Send size={13} /> Propose a research call for this cell
                    </Button>
                  )
                ) : (
                  <p className="text-[12px] text-muted">Researchers can propose research calls from any cell.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <PanelHeader eyebrow="Research priorities" title="What to study next" right={<Lightbulb size={15} className="text-saffron" />} />
              <div className="space-y-4 p-4 text-[13px]">
                <section>
                  <div className="label-caps mb-1.5 flex items-center gap-1 text-saffron-deep"><Sigma size={11} /> Drives decision uncertainty</div>
                  <ul className="space-y-1.5">{priorities.map((p) => <li key={p.assumption.id}><a href="#assumptions" onClick={() => setFocus(p.assumption.id)} className="hover:underline"><span className="font-mono text-[11px] text-inferred">{p.assumption.id}</span> {p.question}</a></li>)}</ul>
                </section>
                <section>
                  <div className="label-caps mb-1.5 flex items-center gap-1 text-risk"><AlertTriangle size={11} /> Conflicting evidence</div>
                  <ul className="space-y-1.5">{conflicts.map((c) => <li key={`${c.iv}|${c.o}`}><button onClick={() => setSel(c)} className="text-left hover:underline">{interventionById[c.iv].short} → {outcomeById[c.o].short} <span className="text-faint">({c.ids.join(", ")})</span></button></li>)}</ul>
                </section>
                <section>
                  <div className="label-caps mb-1.5 flex items-center gap-1 text-documented"><CircleDashed size={11} /> No causal evidence</div>
                  <ul className="space-y-1">{gaps.map((g) => <li key={`${g.iv}|${g.o}`}><button onClick={() => setSel({ iv: g.iv, o: g.o, ids: matrix.get(`${g.iv}|${g.o}`)?.ids ?? [] })} className="text-left hover:underline">{interventionById[g.iv].short} → {outcomeById[g.o].short} <span className="text-faint">· {g.n ? `${g.n} descriptive` : "none"}</span></button></li>)}</ul>
                </section>
              </div>
            </>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <AssumptionTable regionCode={NATIONAL.code} focus={focus} setFocus={setFocus} title="The twelve coefficients every casefile decision rests on" />
      </div>

      <section id="opportunities" className="mt-6 scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label-caps text-saffron-deep">Innovation portal</div>
            <h2 className="font-serif text-[24px] font-semibold text-ink-900">Research calls, challenges & pilots</h2>
          </div>
          <div className="flex gap-1 rounded-md bg-paper-2 p-0.5 text-[12.5px]">
            {[["all", "All"], ["research-call", "Research calls"], ["challenge", "Challenges"], ["pilot", "Pilots"], ["fellowship", "Fellowships"]].map(([k, l]) => (
              <button key={k} onClick={() => setKind(k)} className={clsx("rounded px-2.5 py-1", kind === k ? "bg-card font-semibold text-ink-900 shadow-card" : "text-muted hover:text-ink-900")}>{l}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {opps.map((o) => {
            const O = ORIGIN[o.origin];
            const mine = hydrated && interests.includes(o.id);
            return (
              <Panel key={o.id} className="flex flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={O.tone}><O.icon size={11} /> {O.label}</Badge>
                  <span className="label-caps text-faint">{o.kind.replace("-", " ")}</span>
                </div>
                <h3 className="mt-2 font-serif text-[16.5px] font-semibold leading-snug text-ink-900">{o.title}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{o.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                  <Badge tone="documented">{interventionById[o.intervention].short}{o.outcome ? ` → ${outcomeById[o.outcome].short}` : ""}</Badge>
                  {o.regions.slice(0, 3).map((r) => <Badge key={r} tone="observed">{regionByCode[r]?.name ?? r}</Badge>)}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-rule pt-3 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarClock size={13} />
                    {o.deadline ? `Closes ${new Date(o.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : o.progress !== undefined ? `${o.progress}% complete` : o.status}
                    {o.budgetLakh ? ` · ₹${o.budgetLakh} lakh` : ""}
                  </span>
                  {hydrated && role && role !== "public" ? (
                    <button onClick={() => toggleInterest(o.id)} className={clsx("rounded border px-2 py-1 text-[12px] font-medium", mine ? "border-green/40 bg-green-soft text-green-deep" : "border-rule bg-card text-ink-800 hover:border-ink-400")}>
                      {mine ? "✓ Interested" : o.kind === "pilot" ? "Follow" : "Express interest"}
                    </button>
                  ) : (
                    <span className="text-faint">{o.status}</span>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
        <p className="mt-3 text-[11.5px] text-faint">Demonstration opportunities. Partners marked “(demo)” are illustrative.</p>
      </section>
    </div>
  );
}
