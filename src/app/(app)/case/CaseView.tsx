"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookmarkPlus, Check, ChevronDown, FileText, Lock, MapPin, Minus, Plus, RefreshCw, Repeat, RotateCcw, Sparkles } from "lucide-react";
import { evidenceById } from "@/data/evidence";
import { indicatorById } from "@/data/indicators";
import { interventionById, outcomeById } from "@/data/taxonomy";
import type { IndicatorId, Levers, OutputId, Region } from "@/lib/domain/schemas";
import { getRegion, NATIONAL, regionByCode, regionLabel } from "@/lib/data/regions";
import { evidenceLevel } from "@/lib/evidence/strength";
import { search } from "@/lib/search/engine";
import { synthesise, type CopilotAnswer } from "@/lib/ai/copilot";
import { outputById, simulate, type SimulationResult } from "@/lib/sim/model";
import { decide, OUTCOME_PHRASE, transferLevers, VERDICT_META, type Verdict } from "@/lib/sim/decision";
import { evidenceChain } from "@/lib/sim/chain";
import { composeBrief } from "@/lib/brief/compose";
import { useHydrated, useStore, type SynthesisLite } from "@/lib/store";
import { can } from "@/lib/roles";
import { SERIES } from "@/lib/viz";
import { Badge, Button, Cite, DemoBadge, GradeBadge, Meter, NoticeBar, Panel, PanelHeader, PramanaTag, ReferenceBadge, TypeMark } from "@/components/ui";
import { CitedList } from "@/components/evidence/CitedText";
import { TrendChart, Tornado } from "@/components/charts";
import { CASE_STEPS, caseProgress, type CaseStep } from "@/components/shell/CaseProgress";
import { LeverPanel } from "@/components/lab/LeverPanel";
import { CASE_EXAMPLES, packageFor, SIGNATURE_QUESTION } from "@/lib/case/signature";
import { OutcomeCards } from "@/components/lab/OutcomeCards";
import { AssumptionTable } from "@/components/lab/AssumptionTable";
import { DecisionCard } from "@/components/case/DecisionCard";
import { EvidenceChain } from "@/components/case/EvidenceChain";
import { usePlatformStatus } from "@/components/shell/usePlatformStatus";
import { BriefDocument, BriefToolbar } from "@/app/(app)/brief/BriefDocument";

const IndiaMap = dynamic(() => import("@/components/map/IndiaMap").then((m) => m.IndiaMap), { ssr: false, loading: () => <div className="h-full w-full animate-pulse-soft bg-[#dfe7ea]" /> });

function lite(a: CopilotAnswer): SynthesisLite {
  return { summary: a.summary, approaches: a.approaches, conflicts: a.conflicts, mode: a.mode, provider: a.provider, model: a.model, labPreset: a.labPreset, geography: a.geography };
}

export function CaseView() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="mx-auto h-[70vh] max-w-[1400px] animate-pulse-soft rounded-md bg-paper-2" />;
  return <CaseInner />;
}

function CaseInner() {
  const params = useSearchParams();
  const current = useStore((s) => s.current);
  const status = usePlatformStatus();
  const start = useStore((s) => s.startInvestigation);
  const update = useStore((s) => s.updateCurrent);

  const [pendingRegion] = useState(() => (getRegion(params.get("region")) ? params.get("region") : null));
  const [draft, setDraft] = useState(() => params.get("q") ?? (current ? current.question : SIGNATURE_QUESTION));
  const done = caseProgress(current);
  const reachable: Record<CaseStep, boolean> = { ask: true, evidence: done.evidence, place: done.evidence, simulate: done.evidence && done.place, brief: done.simulate };
  const [step, setStep] = useState<CaseStep>(() => {
    const s = params.get("step") as CaseStep | null;
    const q = params.get("q");
    if (q && q !== current?.question) return "ask";
    if (s && reachable[s]) return s;
    if (!done.evidence) return "ask";
    if (!done.place) return "evidence";
    if (!done.simulate) return "simulate";
    return "brief";
  });
  const go = (s: CaseStep) => {
    setStep(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const build = (q: string) => {
    const question = q.trim();
    if (question.length < 5) return;
    const existing = current?.question.trim().toLowerCase() === question.toLowerCase() && current.synthesis;
    if (existing) return go("evidence");
    const inv = start(question);
    const ans = synthesise(question, search(question), { regionCode: pendingRegion ?? undefined });
    const ids = [...new Set([...ans.approaches.flatMap((a) => a.sources.slice(0, 2)), ...ans.sources.slice(0, 4).map((s) => s.id)])].slice(0, 10);
    update({ evidenceIds: ids, synthesis: lite(ans), regionCode: pendingRegion ?? inv.regionCode, levers: undefined, simulatedAt: undefined, insight: undefined, briefId: undefined });
    go("evidence");
    // optional: an LLM rephrases the synthesis; citations are validated server-side
    if (status && status.llm !== "none") {
      fetch("/api/v1/copilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) })
        .then((r) => (r.ok ? r.json() : null))
        .then((a: CopilotAnswer | null) => {
          if (a?.mode === "llm" && useStore.getState().current?.question === question) update({ synthesis: lite(a) });
        })
        .catch(() => {});
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <CaseHeader question={current?.question} step={step} reachable={reachable} done={done} onStep={go} onNew={() => { setDraft(""); go("ask"); }} />
      <div key={step} className="animate-fade-up">
        {step === "ask" && <AskStep draft={draft} setDraft={setDraft} onBuild={build} hasCurrent={!!current?.synthesis} currentQuestion={current?.question} onResume={() => go(done.place ? "simulate" : "evidence")} place={pendingRegion} />}
        {step === "evidence" && current?.synthesis && <EvidenceStep question={current.question} onNext={() => go("place")} onBack={() => go("ask")} />}
        {step === "place" && current?.synthesis && <PlaceStep onNext={() => go("simulate")} onBack={() => go("evidence")} />}
        {step === "simulate" && current?.synthesis && current.regionCode && <SimulateStep key={current.regionCode} onNext={() => go("brief")} onBack={() => go("place")} />}
        {step === "brief" && current && <BriefStep onBack={() => go("simulate")} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ header */
function CaseHeader({ question, step, reachable, done, onStep, onNew }: { question?: string; step: CaseStep; reachable: Record<CaseStep, boolean>; done: Record<CaseStep, boolean>; onStep: (s: CaseStep) => void; onNew: () => void }) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="label-caps text-saffron-deep">Policy casefile · evidence to decision</div>
          <h1 className="mt-1 max-w-4xl font-serif text-[24px] font-semibold leading-tight text-ink-900 md:text-[28px]">{question ?? "Start with a policy question"}</h1>
        </div>
        {question && <Button size="sm" variant="ghost" onClick={onNew}><Plus size={14} /> New casefile</Button>}
      </div>
      <ol className="mt-4 grid grid-cols-5 overflow-hidden rounded-md border border-rule bg-card" aria-label="Casefile steps">
        {CASE_STEPS.map((s, i) => {
          const active = s.key === step;
          const can = reachable[s.key];
          return (
            <li key={s.key} className={clsx("relative border-rule", i > 0 && "border-l")}>
              <button
                type="button"
                disabled={!can}
                onClick={() => onStep(s.key)}
                aria-current={active ? "step" : undefined}
                className={clsx("flex h-full w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors md:px-4", active ? "bg-ink-900 text-paper" : can ? "hover:bg-paper-2" : "cursor-not-allowed opacity-50")}
              >
                <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold", done[s.key] ? "bg-green text-white" : active ? "bg-saffron text-white" : "bg-paper-3 text-muted")}>
                  {done[s.key] ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block text-[13.5px] font-semibold leading-tight">{s.label}</span>
                  <span className={clsx("block truncate text-[11px]", active ? "text-ink-300" : "text-muted")}>{s.hint}</span>
                </span>
              </button>
              {active && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-saffron" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepFooter({ onBack, children }: { onBack?: () => void; children?: ReactNode }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
      {onBack ? <Button variant="ghost" onClick={onBack}><ArrowLeft size={15} /> Back</Button> : <span />}
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ 1 · ask */
function AskStep({ draft, setDraft, onBuild, hasCurrent, currentQuestion, onResume, place }: { draft: string; setDraft: (s: string) => void; onBuild: (q: string) => void; hasCurrent: boolean; currentQuestion?: string; onResume: () => void; place: string | null }) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onBuild(draft);
  };
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel className="p-6 md:p-8">
        <div className="label-caps text-muted">Step 1 · Ask</div>
        <h2 className="mt-2 font-serif text-[30px] font-semibold leading-tight text-ink-900">What policy question are you working on?</h2>
        <p className="mt-2 text-[14.5px] text-muted">The casefile retrieves the evidence, finds where it matters, simulates a policy package and tells you how sure it can be — then writes the brief.</p>
        <form onSubmit={submit} className="mt-5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            aria-label="Policy question"
            placeholder="e.g. How can mutation delays be reduced in Uttar Pradesh?"
            className="w-full resize-none rounded-md border border-rule-strong bg-white px-4 py-3 font-serif text-[19px] leading-snug text-ink-900 placeholder:font-sans placeholder:text-[15px] placeholder:text-faint focus:border-ink-500 focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onBuild(draft); }}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {place ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-observed/30 bg-observed-soft px-2.5 py-1 text-[12px] text-observed"><MapPin size={12} /> Place from the Atlas: {regionLabel(place)}</span>
            ) : (
              <span className="text-[12px] text-faint">Runs offline · deterministic · every sentence cited</span>
            )}
            <Button type="submit" variant="primary" size="lg" disabled={draft.trim().length < 5}>
              <Sparkles size={16} /> Build the casefile
            </Button>
          </div>
        </form>
        {hasCurrent && currentQuestion && currentQuestion !== draft && (
          <button onClick={onResume} className="mt-5 flex w-full items-center justify-between gap-3 rounded-md border border-rule bg-paper px-4 py-3 text-left hover:border-ink-400">
            <span className="min-w-0"><span className="label-caps block text-muted">Open casefile</span><span className="block truncate text-[14px] text-ink-900">{currentQuestion}</span></span>
            <ArrowRight size={16} className="shrink-0 text-saffron-deep" />
          </button>
        )}
      </Panel>
      <div className="space-y-2.5">
        <div className="label-caps px-1 text-muted">Or start from one of these</div>
        {CASE_EXAMPLES.map((ex, i) => (
          <button key={ex.q} onClick={() => { setDraft(ex.q); onBuild(ex.q); }} className={clsx("group block w-full rounded-md border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-float", i === 0 ? "border-saffron/40 bg-saffron-soft/40 hover:border-saffron" : "border-rule bg-card hover:border-ink-400")}>
            <div className={clsx("label-caps", i === 0 ? "text-saffron-deep" : "text-faint")}>{ex.tag}</div>
            <div className="mt-1 flex items-start justify-between gap-3">
              <span className="font-serif text-[16px] font-semibold leading-snug text-ink-900">{ex.q}</span>
              <ArrowRight size={16} className="mt-1 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-saffron" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 2 · evidence */
function DirIcon({ d }: { d: string }) {
  if (d === "decrease") return <ArrowDown size={12} className="inline" />;
  if (d === "increase") return <ArrowUp size={12} className="inline" />;
  if (d === "no-effect") return <Minus size={12} className="inline" />;
  return <Repeat size={12} className="inline" />;
}

function EvidenceStep({ question, onNext, onBack }: { question: string; onNext: () => void; onBack: () => void }) {
  const current = useStore((s) => s.current)!;
  const attach = useStore((s) => s.attachEvidence);
  const detach = useStore((s) => s.detachEvidence);
  // full answer is recomputed locally (deterministic, instant); LLM wording, if any, comes from the store
  const ans = useMemo(() => synthesise(question, search(question)), [question]);
  const syn = current.synthesis!;
  const summary = syn.mode === "llm" ? syn.summary : ans.summary;
  const attached = new Set(current.evidenceIds);
  return (
    <>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel>
            <PanelHeader eyebrow="Step 2 · Evidence" title="What the evidence says" right={<><PramanaTag p="anumana" compact /><Badge tone={syn.mode === "llm" ? "documented" : "neutral"}>{syn.mode === "llm" ? `LLM · ${syn.model}` : "Deterministic synthesis"}</Badge></>} />
            <div className="p-5">
              <CitedList items={summary} />
              <p className="mt-3 text-[11.5px] text-faint">Retrieved {ans.trace.retrieved} records · ranked in {ans.trace.retrievalMs} ms · every sentence cites the records it rests on.</p>
            </div>
          </Panel>
          <Panel>
            <PanelHeader eyebrow="Policy approaches" title="What has been tried, and how well it is supported" />
            <ul className="divide-y divide-rule/70">
              {ans.approaches.map((a) => (
                <li key={a.intervention} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold text-ink-900">
                      <span className={clsx("size-2 rounded-full", a.role === "remedy" ? "bg-green" : a.role === "risk-factor" ? "bg-risk" : "bg-ink-300")} />
                      {a.label}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Badge tone={a.role === "remedy" ? "green" : a.role === "risk-factor" ? "risk" : "neutral"}>{a.role === "risk-factor" ? "risk factor" : a.role}</Badge>
                      <GradeBadge grade={a.strength.grade} />
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11.5px]">
                    {a.outcomes.slice(0, 3).map((o) => (
                      <span key={o.outcome} className={clsx("inline-flex items-center gap-1 rounded border px-1.5 py-0.5", o.beneficial ? "border-green/30 bg-green-soft/60 text-green-deep" : o.beneficial === false ? "border-risk/30 bg-risk-soft/60 text-risk" : "border-rule bg-paper-2 text-muted")}>
                        <DirIcon d={o.direction} /> {outcomeById[o.outcome].short}{o.n > 1 && <span className="opacity-70"> · {o.agree || "no majority"}/{o.n} agree</span>}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-800">{a.note.text} {a.note.cites.slice(0, 6).map((id) => <Cite key={id} id={id} />)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-4">
          {ans.conflicts.length > 0 && (
            <Panel className="border-risk/30">
              <PanelHeader eyebrow="Where studies disagree" title={`${ans.conflicts.length} conflicting finding${ans.conflicts.length > 1 ? "s" : ""}`} right={<AlertTriangle size={15} className="text-risk" />} />
              <ul className="space-y-2.5 p-4">
                {ans.conflicts.map((c, i) => (
                  <li key={i} className="rounded-md border border-risk/20 bg-risk-soft/30 p-3 text-[12.5px]">
                    <div className="font-medium text-ink-900">{interventionById[c.intervention].short} → {outcomeById[c.outcome].short}</div>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {c.sides.map((s) => (
                        <div key={s.direction} className="rounded bg-card px-2 py-1.5">
                          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-muted"><DirIcon d={s.direction} /> {s.direction}</div>
                          <div>{s.sources.map((id) => <Cite key={id} id={id} />)}</div>
                          {s.context && <div className="mt-0.5 text-[11px] leading-snug text-muted">{s.context}</div>}
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel>
            <PanelHeader eyebrow="Casefile sources" title={`${attached.size} attached`} right={<span className="text-[11.5px] text-muted">untick to exclude</span>} />
            <ul className="max-h-[520px] divide-y divide-rule/60 overflow-y-auto">
              {ans.sources.map((s) => {
                const e = evidenceById[s.id];
                const on = attached.has(s.id);
                return (
                  <li key={s.id} className="flex items-start gap-3 px-4 py-2.5">
                    <input type="checkbox" checked={on} onChange={() => (on ? detach(s.id) : attach(s.id))} className="mt-1 accent-[var(--color-saffron)]" aria-label={`Attach ${s.id}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5"><TypeMark type={e.type} showLabel={false} /><span className="font-mono text-[10.5px] text-faint">{s.id} · {e.year}</span><Badge>{evidenceLevel(e.design).level}</Badge>{e.provenance === "synthetic" ? <DemoBadge /> : <ReferenceBadge />}</div>
                      <Link href={`/evidence/${s.id}`} target="_blank" className="mt-0.5 block text-[13px] leading-snug text-ink-900 hover:text-saffron-deep">{e.title}</Link>
                    </div>
                    <Meter value={s.score} max={ans.sources[0].score} className="mt-2 w-12 shrink-0" tone="ink" />
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
      <StepFooter onBack={onBack}>
        <Button variant="primary" size="lg" onClick={onNext}>Find where it matters <ArrowRight size={16} /></Button>
      </StepFooter>
    </>
  );
}

/* ------------------------------------------------------------------ 3 · place */
function usePreview(region: Region | undefined, preset?: Partial<Levers>) {
  return useMemo(() => {
    if (!region) return null;
    const levers = packageFor(region, preset);
    const res = simulate(region, levers, 5);
    return { levers, res, decision: decide(res, region, levers) };
  }, [region, preset]);
}

/** "Maharashtra" / "Thane" — where a study was done, for one-line reasons. */
function studyPlace(id: string): string {
  const r = evidenceById[id]?.geography.regions[0];
  return r ? regionByCode[r]?.name ?? "Local" : "Local";
}

function VerdictChip({ verdict }: { verdict: Verdict }) {
  const m = VERDICT_META[verdict];
  return <Badge tone={m.tone === "neutral" ? "neutral" : m.tone}>{m.label}</Badge>;
}

function PlaceStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const current = useStore((s) => s.current)!;
  const setRegion = useStore((s) => s.setRegion);
  const update = useStore((s) => s.updateCurrent);
  const syn = current.synthesis!;
  const preset = syn.labPreset.levers;
  const layer = (syn.geography[0]?.layer ?? "disputePressure") as IndicatorId;
  const candidates = useMemo(() => [...syn.geography.map((g) => g.code), "IN"].map((c) => regionByCode[c]).filter(Boolean), [syn.geography]);
  const previews = useMemo(() => candidates.map((r) => {
    const levers = packageFor(r, preset);
    const res = simulate(r, levers, 5);
    const decision = decide(res, r, levers);
    const local = decision.driver?.localContradicting ?? [];
    const why = local.length
      ? { text: `${studyPlace(local[0])} study ${local[0]} contradicts ${decision.driver!.assumption.id}`, local: true }
      : { text: res.confidence.score !== null ? `Evidence confidence ${Math.round(res.confidence.score * 100)}/100` : "No change from status quo", local: false };
    return { r, decision, why };
  }), [candidates, preset]);
  const selected = current.regionCode ? regionByCode[current.regionCode] : undefined;
  const sel = usePreview(selected, preset);
  const choose = (code: string) => {
    setRegion(code);
    update({ levers: undefined, simulatedAt: undefined, briefId: undefined });
  };
  const IND: IndicatorId[] = [layer, "disputePressure", "digitization", "urbanGrowth", "adminCapacity"].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4) as IndicatorId[];

  return (
    <>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel className="overflow-hidden">
          <PanelHeader eyebrow="Step 3 · Place" title={`Where it matters: ${indicatorById[layer].label.toLowerCase()}`} right={<span className="hidden text-[11.5px] text-muted md:inline">click any district or state</span>} />
          <div className="relative h-[380px] md:h-[560px]">
            <IndiaMap className="relative h-full w-full" layer={layer} level="district" selected={current.regionCode ?? null} highlight={syn.geography.map((g) => g.code)} onSelect={choose} fitTo={current.regionCode ?? null} />
            <div className="pointer-events-none absolute bottom-3 left-3 rounded border border-rule bg-card/95 px-2.5 py-1.5 text-[11px] text-muted backdrop-blur">Outlined: districts the evidence points to · demonstration data</div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader eyebrow="Candidate places" title="Same package, different evidence" />
            <p className="px-4 pt-3 text-[12.5px] text-muted">The evidence-backed package ({syn.labPreset.interventions.map((i) => interventionById[i].short.toLowerCase()).join(", ")}) is judged differently depending on how local the evidence is. % = projected change in {OUTCOME_PHRASE[previews[0]?.decision.headlineOutput?.id ?? "disputePressure"]} vs status quo.</p>
            <ul className="space-y-1.5 p-3">
              {previews.map(({ r, decision, why }) => {
                const active = current.regionCode === r.code;
                const h = decision.headlineOutput;
                return (
                  <li key={r.code}>
                    <button type="button" onClick={() => choose(r.code)} aria-pressed={active} title={r.code === "IN" ? "National reference" : syn.geography.find((g) => g.code === r.code)?.reason} className={clsx("w-full rounded-md border px-3 py-2.5 text-left transition-colors", active ? "border-saffron bg-saffron-soft/50" : "border-rule bg-card hover:border-ink-400")}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <MapPin size={14} className={active ? "text-saffron-deep" : "text-faint"} />
                          <span className="truncate text-[14px] font-semibold text-ink-900">{r.code === "IN" ? "India (all-India evidence)" : regionLabel(r.code)}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {h && <span className={clsx("text-[12px] font-semibold tabular", h.improves ? "text-green" : "text-risk")} title={`${outputById[h.id].label}: projected change vs status quo`}>{h.deltaPct > 0 ? "+" : ""}{h.deltaPct.toFixed(0)}%</span>}
                          <VerdictChip verdict={decision.verdict} />
                        </span>
                      </div>
                      <div className={clsx("mt-1 flex items-center gap-1 pl-6 text-[11.5px]", why.local ? "font-medium text-risk" : "text-muted")}>
                        {why.local && <AlertTriangle size={11} className="shrink-0" />}<span className="truncate">{why.text}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {selected && sel && (
            <Panel className="p-4">
              <div className="label-caps text-muted">Selected</div>
              <div className="mt-0.5 font-serif text-[20px] font-semibold text-ink-900">{regionLabel(selected.code)}</div>
              <table className="mt-2 w-full text-[12.5px]">
                <tbody>
                  {IND.map((id) => (
                    <tr key={id} className="border-b border-rule/60">
                      <td className="py-1.5 text-muted">{indicatorById[id].short}</td>
                      <td className="py-1.5 text-right font-semibold tabular text-ink-900">{selected.indicators[id].toFixed(indicatorById[id].decimals)}</td>
                      <td className="py-1.5 pl-2 text-right text-[11px] tabular text-faint">India {NATIONAL.indicators[id].toFixed(indicatorById[id].decimals)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex items-center justify-between gap-2 rounded bg-paper-2 px-3 py-2 text-[12.5px]">
                <span className="text-muted">Preview</span>
                <VerdictChip verdict={sel.decision.verdict} />
              </div>
            </Panel>
          )}
        </div>
      </div>
      <StepFooter onBack={onBack}>
        {!selected && <span className="text-[13px] text-muted">Choose a place to continue</span>}
        <Button variant="primary" size="lg" disabled={!selected} onClick={onNext}>Test the policy here <ArrowRight size={16} /></Button>
      </StepFooter>
    </>
  );
}

/* ------------------------------------------------------------------ 4 · simulate & decide */
function SimulateStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const current = useStore((s) => s.current)!;
  const role = useStore((s) => s.role);
  const update = useStore((s) => s.updateCurrent);
  const saveScenario = useStore((s) => s.saveScenario);
  const saveBrief = useStore((s) => s.saveBrief);
  const notes = useStore((s) => s.notes);
  const region = regionByCode[current.regionCode!] ?? NATIONAL;
  const preset = current.synthesis!.labPreset.levers;
  const [levers, setLeversState] = useState<Levers>(() => current.levers ?? packageFor(region, preset));
  const [outputId, setOutputId] = useState<OutputId | null>(null);
  const [focusA, setFocusA] = useState<string | null>(null);
  const [chainSel, setChainSel] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const res: SimulationResult = useMemo(() => simulate(region, levers, 5), [region, levers]);
  const decision = useMemo(() => decide(res, region, levers), [res, region, levers]);
  // the national comparison: the evidence package as judged for India, or — once levers are
  // edited — the same policy change applied to India's status quo
  const national = useMemo(() => {
    if (region.code === "IN") return null;
    const pkg = packageFor(region, preset);
    const unchanged = (Object.keys(pkg) as (keyof Levers)[]).every((k) => pkg[k] === levers[k]);
    const l = unchanged ? packageFor(NATIONAL, preset) : transferLevers(levers, region, NATIONAL);
    const d = decide(simulate(NATIONAL, l, 5), NATIONAL, l);
    return { verdict: d.verdict, label: d.label, caption: unchanged ? "Evidence package, all-India" : "Your package, all-India" };
  }, [region, levers, preset]);
  const chain = useMemo(() => evidenceChain(res, region), [res, region]);
  const shownOutput = outputId ?? decision.headlineOutput?.id ?? "disputePressure";
  const out = res.outputs.find((o) => o.id === shownOutput)!;
  const def = outputById[shownOutput];

  const setLevers = (l: Levers) => {
    setLeversState(l);
    setSaved(false);
    update({ levers: l, simulatedAt: undefined, briefId: undefined });
  };
  const allowedBrief = can(role, "brief.generate");

  const finish = () => {
    update({ levers, regionCode: region.code, insight: decision.reasons.map((r) => r.text) });
    useStore.getState().markSimulated();
    if (allowedBrief) {
      const cur = useStore.getState().current!;
      const brief = composeBrief({
        question: cur.question,
        regionCode: region.code,
        evidenceIds: cur.evidenceIds,
        levers,
        role: role ?? "public",
        synthesis: cur.synthesis,
        notes: notes.filter((n) => n.investigationId === cur.id || (n.targetId && cur.evidenceIds.includes(n.targetId))).map((n) => `${n.targetId ? `${n.targetId}: ` : ""}${n.text}`),
      });
      saveBrief(brief);
      update({ briefId: brief.id });
    }
    onNext();
  };

  const selNode = chainSel ? chain.nodes.find((n) => n.id === chainSel) : null;

  return (
    <>
      <DecisionCard decision={decision} res={res} placeName={regionLabel(region.code)} national={national} />

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Panel className="h-fit">
          <PanelHeader
            eyebrow="Step 4 · Policy package"
            title="Adjust the levers"
            right={<button type="button" onClick={() => setLevers(packageFor(region, preset))} className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink-900" title="Reset to the package suggested by the evidence"><RotateCcw size={12} /> Evidence package</button>}
          />
          <p className="border-b border-rule px-4 py-2.5 text-[12px] leading-snug text-muted">{current.synthesis!.labPreset.rationale} The decision above updates as you move a lever.</p>
          <LeverPanel region={region} levers={levers} onChange={setLevers} strengths={res.assumptionStrengths} onFocusAssumption={(a) => setFocusA(a)} />
        </Panel>

        <div className="min-w-0 space-y-4">
          <OutcomeCards res={res} selected={shownOutput} onSelect={setOutputId} />
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel>
              <PanelHeader eyebrow={`${res.years[0]}–${res.years[res.years.length - 1]} · status quo vs scenario`} title={def.label} right={<PramanaTag p="anumana" compact />} />
              <div className="p-4">
                <TrendChart
                  years={res.years}
                  series={[
                    { name: "Status quo", values: res.baseline.values[shownOutput], color: SERIES.baseline, dashed: true },
                    { name: "Scenario", values: res.scenario.values[shownOutput], color: SERIES.scenario },
                  ]}
                  band={{ low: res.bands[shownOutput].low, high: res.bands[shownOutput].high, color: SERIES.scenario, label: "Evidence-derived range" }}
                  unit={def.unit}
                  decimals={def.decimals}
                  height={230}
                />
              </div>
            </Panel>
            <Panel>
              <PanelHeader eyebrow="Sensitivity" title="What this number depends on" />
              <div className="p-4">
                <Tornado rows={out.sensitivity.map((r) => ({ id: r.assumption, label: r.label, low: r.low, high: r.high, share: r.share }))} center={out.scenario} decimals={def.decimals} onSelect={(id) => setFocusA(id)} highlight={focusA ?? undefined} />
                <p className="mt-3 text-[11.5px] leading-relaxed text-muted">Each assumption swung across its evidence range, one at a time. Share = portion of the uncertainty it causes.</p>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <Panel className="mt-5">
        <PanelHeader eyebrow="Evidence chain · traceable" title="Why these numbers: studies → assumptions → outcomes" right={<span className="hidden text-[11.5px] text-muted md:inline">hover to trace · click to inspect</span>} />
        <div className="p-4">
          <EvidenceChain nodes={chain.nodes} edges={chain.edges} selected={chainSel} onSelect={(id) => setChainSel(id === chainSel ? null : id)} />
          {selNode && (
            <div className="mt-3 rounded-md border border-rule bg-paper p-3 text-[13px] animate-fade-up">
              {(selNode.kind === "study" || selNode.kind === "dataset") && evidenceById[selNode.id] && (() => {
                const e = evidenceById[selNode.id];
                return (
                  <>
                    <div className="flex flex-wrap items-center gap-2"><TypeMark type={e.type} /><span className="font-mono text-[11px] text-faint">{e.id} · {e.year}</span>{e.provenance === "synthetic" ? <DemoBadge /> : <ReferenceBadge />}{selNode.contradicts && <Badge tone="risk">contradicts</Badge>}{selNode.local && <Badge tone="observed">evidence from this area</Badge>}</div>
                    <div className="mt-1 font-semibold text-ink-900">{e.title}</div>
                    <p className="mt-1 text-ink-800">{e.findings[0]?.statement ?? e.summary}</p>
                    <Link href={`/evidence/${e.id}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-saffron-deep hover:underline">Open record <ArrowRight size={12} /></Link>
                  </>
                );
              })()}
              {selNode.kind === "assumption" && (
                <>
                  <div className="font-semibold text-ink-900">{selNode.id} · {selNode.label}</div>
                  <p className="mt-1 text-muted">{selNode.sub}</p>
                  <button type="button" onClick={() => setFocusA(selNode.id)} className="mt-1 text-[12.5px] font-medium text-saffron-deep hover:underline">Show all studies behind {selNode.id} ↓</button>
                </>
              )}
              {selNode.kind === "outcome" && <div><span className="font-semibold text-ink-900">{selNode.label}</span> <span className="text-muted">{selNode.sub}</span></div>}
            </div>
          )}
        </div>
      </Panel>

      <details className="group mt-5" open={!!focusA}>
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-md border border-rule bg-card px-4 py-3 text-[14px] font-semibold text-ink-900 hover:border-ink-400">
          All 12 model assumptions and their evidence <ChevronDown size={16} className="text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3">
          <AssumptionTable regionCode={region.code} focus={focusA} setFocus={setFocusA} used={new Set(res.outputs.flatMap((o) => o.sensitivity.map((s) => s.assumption)))} title="Graded for this place" />
        </div>
      </details>

      <StepFooter onBack={onBack}>
        {can(role, "lab.save") && (
          <Button size="lg" disabled={saved || decision.verdict === "none"} onClick={() => { saveScenario({ name: `${region.name} · ${decision.label}`, regionCode: region.code, levers, headline: decision.headline, confidence: res.confidence.grade }); setSaved(true); }}>
            {saved ? <Check size={16} /> : <BookmarkPlus size={16} />} {saved ? "Saved" : "Save scenario"}
          </Button>
        )}
        <Button variant="primary" size="lg" disabled={decision.verdict === "none"} onClick={finish}>
          <FileText size={16} /> {allowedBrief ? "Write the brief" : "Record decision"} <ArrowRight size={16} />
        </Button>
      </StepFooter>
    </>
  );
}

/* ------------------------------------------------------------------ 5 · brief */
function BriefStep({ onBack }: { onBack: () => void }) {
  const current = useStore((s) => s.current)!;
  const role = useStore((s) => s.role);
  const briefs = useStore((s) => s.briefs);
  const saveBrief = useStore((s) => s.saveBrief);
  const update = useStore((s) => s.updateCurrent);
  const brief = briefs.find((b) => b.id === current.briefId);
  const allowed = can(role, "brief.generate");

  const regenerate = () => {
    if (!current.regionCode || !current.levers) return;
    const b = composeBrief({ question: current.question, regionCode: current.regionCode, evidenceIds: current.evidenceIds, levers: current.levers, role: role ?? "public", synthesis: current.synthesis });
    saveBrief(b);
    update({ briefId: b.id });
  };

  if (!allowed) {
    return (
      <>
        <Panel className="p-8 text-center">
          <Lock className="mx-auto text-ink-400" />
          <h2 className="mt-3 font-serif text-[22px] font-semibold text-ink-900">Brief generation needs a researcher or policymaker role</h2>
          <p className="mt-1 text-[14px] text-muted">Your decision has been recorded in this casefile. Switch role from the sidebar to generate the brief.</p>
        </Panel>
        <StepFooter onBack={onBack} />
      </>
    );
  }
  if (!brief) {
    return (
      <>
        <Panel className="p-8 text-center">
          <FileText className="mx-auto text-ink-400" />
          <h2 className="mt-3 font-serif text-[22px] font-semibold text-ink-900">No brief for the current scenario yet</h2>
          <p className="mt-1 text-[14px] text-muted">The levers changed after the last brief. Generate it from the current scenario.</p>
          <Button variant="primary" size="lg" className="mt-4" onClick={regenerate} disabled={!current.levers}><RefreshCw size={15} /> Generate brief</Button>
        </Panel>
        <StepFooter onBack={onBack} />
      </>
    );
  }
  return (
    <>
      <NoticeBar className="no-print mb-4">
        Brief <strong>{brief.fingerprint}</strong> is saved to your workspace. Every number cites its source; the same inputs always reproduce the same fingerprint.
      </NoticeBar>
      <BriefToolbar brief={brief} />
      <BriefDocument brief={brief} decisionAnnex={can(role, "brief.decision") || brief.role === "policymaker"} />
      <div className="no-print"><StepFooter onBack={onBack}><Link href="/workspace" className="text-[13.5px] font-medium text-saffron-deep hover:underline">Open workspace →</Link></StepFooter></div>
    </>
  );
}
