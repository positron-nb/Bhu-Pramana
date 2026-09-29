"use client";

import clsx from "clsx";
import { useState } from "react";
import { Check, Copy, Download, FileJson, Printer } from "lucide-react";
import type { Brief } from "@/lib/brief/compose";
import { briefToMarkdown } from "@/lib/brief/compose";
import type { Cited } from "@/lib/ai/copilot";
import { SERIES } from "@/lib/viz";
import { TrendChart } from "@/components/charts";
import { BrandMark, TriRule } from "@/components/shell/Brand";
import { Button } from "@/components/ui";

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BriefToolbar({ brief }: { brief: Brief }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-2">
      <Button variant="ink" onClick={() => window.print()}><Printer size={14} /> Print / Save as PDF</Button>
      <Button onClick={() => download(`${brief.fingerprint}.md`, briefToMarkdown(brief), "text/markdown")}><Download size={14} /> Markdown</Button>
      <Button onClick={() => download(`${brief.fingerprint}.json`, JSON.stringify(brief, null, 2), "application/json")}><FileJson size={14} /> JSON</Button>
      <Button variant="ghost" onClick={() => { void navigator.clipboard?.writeText(brief.fingerprint); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
        {copied ? <Check size={14} /> : <Copy size={14} />} {brief.fingerprint}
      </Button>
    </div>
  );
}

function CitedItems({ items, list = false, refNo }: { items: Cited[]; list?: boolean; refNo: Map<string, number> }) {
  return (
    <>
      {items.map((s, i) => {
        const body = (
          <>
            {s.text}{" "}
            {s.cites.map((id) =>
              /^A\d{2}$/.test(id) ? (
                <a key={id} href={`#asm-${id}`} className="mx-[1px] rounded-[2px] bg-inferred-soft px-1 font-mono text-[10px] text-inferred no-underline">{id}</a>
              ) : refNo.has(id) ? (
                <a key={id} href={`#ref-${id}`} className="mx-[1px] align-super text-[10px] font-semibold text-documented no-underline" title={id}>[{refNo.get(id)}]</a>
              ) : null,
            )}
          </>
        );
        return list ? <li key={i} className="mb-1.5">{body}</li> : <p key={i} className="mb-2">{body}</p>;
      })}
    </>
  );
}

function SectionHeading({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="avoid-break mb-2 mt-7 flex items-baseline gap-3 border-b border-ink-900/15 pb-1.5 font-serif text-[19px] font-semibold text-ink-900">
      <span className="font-mono text-[12px] text-saffron-deep">{String(n).padStart(2, "0")}</span>
      {children}
    </h2>
  );
}

export function BriefDocument({ brief, decisionAnnex }: { brief: Brief; decisionAnnex: boolean }) {
  const refNo = new Map(brief.references.map((r) => [r.id, r.n]));
  const top = brief.simulation.outputs.find((o) => o.id === brief.decision.headlineOutput) ?? brief.simulation.outputs.find((o) => o.improves !== null);
  const grade = brief.simulation.confidence.grade;
  const v = brief.decision.verdict;
  const options = [
    { k: "Adopt at scale with monitoring", when: "Confidence ≥ 75/100, the driving assumption well evidenced, no contradicting local evidence", on: v === "adopt" },
    { k: "Pilot first, with a comparison group", when: "Moderate confidence, or the driving assumption is contradicted by evidence from this area", on: v === "pilot" },
    { k: "Build the evidence first", when: "Confidence below 50/100; result driven by weakly evidenced assumptions", on: v === "research" },
    { k: "Reconsider the package", when: "The headline outcome moves in the wrong direction", on: v === "reconsider" },
  ];

  return (
    <article className="print-page mx-auto max-w-[860px] bg-white px-8 py-9 text-[14px] leading-relaxed text-ink-900 shadow-float md:px-12" id="brief">
      <TriRule className="-mx-8 -mt-9 mb-6 md:-mx-12" />
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <div className="leading-tight">
            <div className="font-serif text-[15px] font-semibold">Bhū-Pramāṇa</div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">Evidence-backed policy brief</div>
          </div>
        </div>
        <div className="text-right font-mono text-[10.5px] leading-5 text-muted">
          <div className="font-semibold text-ink-900">{brief.fingerprint}</div>
          <div>{new Date(brief.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
        </div>
      </header>

      <h1 className="mt-6 font-serif text-[27px] font-semibold leading-[1.15] tracking-[-0.01em]">{brief.question}</h1>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 border-y border-rule py-2.5 text-[12px] md:grid-cols-4">
        <div><span className="block text-[10px] uppercase tracking-wider text-faint">Geography</span>{brief.region.name}</div>
        <div><span className="block text-[10px] uppercase tracking-wider text-faint">Prepared for</span>{brief.role === "policymaker" ? "Policymaker" : brief.role === "researcher" ? "Researcher" : brief.role === "admin" ? "Administrator" : "Public"}</div>
        <div><span className="block text-[10px] uppercase tracking-wider text-faint">Synthesis</span>{brief.synthesisMode}</div>
        <div><span className="block text-[10px] uppercase tracking-wider text-faint">Model</span>{brief.modelVersion}</div>
      </div>
      <p className="mt-2 text-[11px] text-[#80600a]">{brief.dataNotice} · Illustrative policy scenario — not an official forecast.</p>

      <section className="avoid-break mt-5 rounded-sm border-l-[3px] border-saffron bg-paper px-5 py-4">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-saffron-deep">Key messages</div>
        <ul className="mt-2 list-disc pl-5 text-[14px]"><CitedItems refNo={refNo} items={brief.keyMessages} list /></ul>
      </section>

      <SectionHeading n={1}>Policy question</SectionHeading>
      <p>{brief.question}</p>

      <SectionHeading n={2}>Baseline situation</SectionHeading>
      <CitedItems refNo={refNo} items={brief.baseline.narrative} />
      <table className="avoid-break mt-2 w-full border-collapse text-[12.5px]">
        <thead><tr className="border-b-2 border-ink-900 text-left"><th className="py-1.5 font-semibold">Indicator</th><th className="py-1.5 text-right font-semibold">{brief.region.name.split(",")[0]}</th><th className="py-1.5 text-right font-semibold">State</th><th className="py-1.5 text-right font-semibold">India</th><th className="py-1.5 text-right font-semibold">Better</th></tr></thead>
        <tbody>
          {brief.baseline.rows.map((r) => (
            <tr key={r.id} className="border-b border-rule">
              <td className="py-1.5">{r.label} <span className="text-faint">({r.unit})</span></td>
              <td className="py-1.5 text-right font-semibold tabular">{r.region}</td>
              <td className="py-1.5 text-right tabular text-muted">{r.state ?? "—"}</td>
              <td className="py-1.5 text-right tabular text-muted">{r.national}</td>
              <td className="py-1.5 text-right text-[11px] text-faint">{r.better}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] text-faint">Source: DS-011 District Land Governance Indicators 2019–2025 (demonstration panel).</p>

      <SectionHeading n={3}>Evidence summary</SectionHeading>
      <ul className="list-disc pl-5"><CitedItems refNo={refNo} items={brief.evidenceSummary} list /></ul>

      <SectionHeading n={4}>Supporting studies</SectionHeading>
      {brief.studies.length === 0 ? <p className="text-muted">No studies were attached to this investigation.</p> : (
        <table className="w-full border-collapse text-[12px]">
          <thead><tr className="border-b-2 border-ink-900 text-left"><th className="py-1.5 pr-2 font-semibold">Study</th><th className="py-1.5 pr-2 font-semibold">Design</th><th className="py-1.5 pr-2 font-semibold">Finding</th><th className="py-1.5 text-right font-semibold" title="design × geographic relevance × recency">Weight</th></tr></thead>
          <tbody>
            {brief.studies.map((s) => (
              <tr key={s.id} className="avoid-break border-b border-rule align-top">
                <td className="py-1.5 pr-2"><a href={`#ref-${s.id}`} className="font-semibold text-documented">[{refNo.get(s.id)}]</a> {s.title} <span className="text-faint">({s.year}; {s.where}){s.provenance === "synthetic" ? " · demo" : ""}</span></td>
                <td className="py-1.5 pr-2 whitespace-nowrap">{s.design} · {s.level}</td>
                <td className="py-1.5 pr-2">{s.finding}</td>
                <td className="py-1.5 text-right tabular">{s.weight.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SectionHeading n={5}>Relevant geographic indicators</SectionHeading>
      <div className="grid gap-2 sm:grid-cols-3">
        {brief.baseline.rows.slice(0, 6).map((r) => (
          <div key={r.id} className="avoid-break rounded-sm border border-rule px-3 py-2">
            <div className="text-[11px] text-muted">{r.label}</div>
            <div className="font-serif text-[20px] font-semibold tabular">{r.region}<span className="ml-1 text-[11px] font-normal text-faint">{r.unit}</span></div>
            {r.trend && <div className="text-[11px] text-muted tabular">{r.trend[0]} (2019) → {r.trend[r.trend.length - 1]} (2025)</div>}
          </div>
        ))}
      </div>

      <SectionHeading n={6}>Scenario assumptions</SectionHeading>
      <table className="avoid-break w-full border-collapse text-[12.5px]">
        <thead><tr className="border-b-2 border-ink-900 text-left"><th className="py-1.5 font-semibold">Policy lever</th><th className="py-1.5 text-right font-semibold">Scenario</th><th className="py-1.5 text-right font-semibold">Status quo</th></tr></thead>
        <tbody>
          {brief.scenario.levers.map((l) => (
            <tr key={l.label} className={clsx("border-b border-rule", !l.changed && "text-faint")}>
              <td className="py-1.5">{l.label}</td>
              <td className={clsx("py-1.5 text-right tabular", l.changed && "font-semibold text-saffron-deep")}>{l.value}</td>
              <td className="py-1.5 text-right tabular">{l.statusQuo}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="mt-3 w-full border-collapse text-[12px]">
        <thead><tr className="border-b-2 border-ink-900 text-left"><th className="py-1.5 font-semibold">Model assumption</th><th className="py-1.5 text-right font-semibold">Central</th><th className="py-1.5 text-right font-semibold">Evidence range</th><th className="py-1.5 font-semibold">Evidence</th></tr></thead>
        <tbody>
          {brief.scenario.assumptions.map((a) => (
            <tr key={a.id} id={`asm-${a.id}`} className="avoid-break border-b border-rule align-top">
              <td className="py-1.5"><span className="font-mono text-inferred">{a.id}</span> {a.label} <span className="block text-[10.5px] text-faint">{a.unit}</span></td>
              <td className="py-1.5 text-right tabular">{a.central}</td>
              <td className="py-1.5 text-right tabular">{a.low} … {a.high}</td>
              <td className="py-1.5">
                <span className={clsx("font-semibold", a.grade === "High" ? "text-green" : a.grade === "Moderate" ? "text-amber" : "text-risk")}>{a.grade}</span> <span className="text-faint">({a.score})</span>
                <span className="block text-[10.5px] text-muted">{a.supporting.map((id) => refNo.has(id) ? `[${refNo.get(id)}]` : id).join(" ")}{a.contradicting.length ? ` · contra ${a.contradicting.map((id) => refNo.has(id) ? `[${refNo.get(id)}]` : id).join(" ")}` : ""}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionHeading n={7}>Simulation result</SectionHeading>
      {top && (
        <div className="avoid-break mb-3 rounded-sm border border-rule p-3">
          <div className="mb-1 text-[12px] font-semibold">{top.label} · {brief.simulation.years[0]}–{brief.simulation.years[brief.simulation.years.length - 1]}</div>
          <TrendChart years={brief.simulation.years} series={[{ name: "Status quo", values: top.baseSeries, color: SERIES.baseline, dashed: true }, { name: "Scenario", values: top.scenSeries, color: SERIES.scenario }]} unit={top.unit} decimals={top.decimals} height={180} />
        </div>
      )}
      <table className="avoid-break w-full border-collapse text-[12.5px]">
        <thead><tr className="border-b-2 border-ink-900 text-left"><th className="py-1.5 font-semibold">Output ({brief.simulation.years[brief.simulation.years.length - 1]})</th><th className="py-1.5 text-right font-semibold">Status quo</th><th className="py-1.5 text-right font-semibold">Scenario</th><th className="py-1.5 text-right font-semibold">Change</th><th className="py-1.5 text-right font-semibold">Range</th><th className="py-1.5 text-right font-semibold">Confidence</th></tr></thead>
        <tbody>
          {brief.simulation.outputs.map((o) => (
            <tr key={o.id} className={clsx("border-b border-rule", o.improves === null && "text-faint")}>
              <td className="py-1.5">{o.label}</td>
              <td className="py-1.5 text-right tabular">{o.baseline.toFixed(o.decimals)}</td>
              <td className="py-1.5 text-right font-semibold tabular">{o.scenario.toFixed(o.decimals)}</td>
              <td className={clsx("py-1.5 text-right tabular", o.improves ? "text-green" : o.improves === false ? "text-risk" : "")}>{o.deltaPct >= 0 ? "+" : ""}{o.deltaPct.toFixed(1)}%</td>
              <td className="py-1.5 text-right tabular text-muted">{o.improves === null ? "—" : `${o.low.toFixed(o.decimals)}–${o.high.toFixed(o.decimals)}`}</td>
              <td className="py-1.5 text-right">{o.grade ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] text-faint">Overall evidence confidence: {grade ?? "—"}{brief.simulation.confidence.score !== null ? ` (${Math.round((brief.simulation.confidence.score ?? 0) * 100)}/100)` : ""} · implementation efficiency {Math.round(brief.simulation.diagnostics.efficiency * 100)}%.</p>

      <SectionHeading n={8}>Decision</SectionHeading>
      <div className="avoid-break mb-3 rounded-sm border border-ink-900/20 bg-paper px-4 py-3">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-saffron-deep">Evidence-to-decision</div>
        <div className="mt-0.5 font-serif text-[20px] font-semibold text-ink-900">{brief.decision.label}</div>
        <p className="mt-1 text-[13.5px]">{brief.decision.headline}</p>
      </div>
      <ul className="list-disc pl-5"><CitedItems refNo={refNo} items={brief.insight} list /></ul>

      {decisionAnnex && (
        <section className="avoid-break mt-4 rounded-sm border border-ink-900/20">
          <div className="border-b border-ink-900/15 bg-paper px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-800">Decision annex · evidence-to-decision options</div>
          <table className="w-full text-[12.5px]">
            <tbody>
              {options.map((o) => (
                <tr key={o.k} className={clsx("border-b border-rule last:border-0", o.on && "bg-saffron-soft/50")}>
                  <td className="w-8 px-4 py-2 text-center">{o.on ? "●" : "○"}</td>
                  <td className="py-2 pr-3 font-semibold">{o.k}</td>
                  <td className="py-2 pr-4 text-muted">{o.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-[11px] text-faint">Indicated by the platform&apos;s deterministic evidence-to-decision rule (confidence {grade ?? "n/a"}). The decision remains with the competent authority.</p>
        </section>
      )}

      <SectionHeading n={9}>Limitations</SectionHeading>
      <ul className="list-disc pl-5 text-[13px]">{brief.limitations.map((l, i) => <li key={i} className="mb-1">{l}</li>)}</ul>

      <SectionHeading n={10}>Recommended further research</SectionHeading>
      {brief.furtherResearch.length === 0 ? <p className="text-muted">No priority identified for the current scenario.</p> : (
        <ol className="list-decimal pl-5 text-[13px]">
          {brief.furtherResearch.map((r, i) => <li key={i} className="mb-1.5"><span className="font-medium">{r.question}</span><span className="block text-[12px] text-muted">{r.assumption} — {r.why}</span></li>)}
        </ol>
      )}

      {brief.notes.length > 0 && (
        <>
          <SectionHeading n={11}>Researcher notes</SectionHeading>
          <ul className="list-disc pl-5 text-[13px]">{brief.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </>
      )}

      <h2 className="mb-2 mt-8 border-b border-ink-900/15 pb-1.5 font-serif text-[17px] font-semibold">References</h2>
      <ol className="space-y-1 text-[11.5px]">
        {brief.references.map((r) => (
          <li key={r.id} id={`ref-${r.id}`} className="flex gap-2 target:bg-saffron-soft">
            <span className="w-6 shrink-0 text-right font-semibold tabular">[{r.n}]</span>
            <span>
              <span className="font-mono text-faint">{r.id}</span> · {r.title}. {r.source}, {r.year}.{" "}
              {r.provenance === "synthetic" ? <em className="text-[#80600a]">Demonstration record.</em> : <em className="text-green-deep">Reference.</em>}{" "}
              {r.url && <a href={r.url} className="break-all text-documented underline" target="_blank" rel="noreferrer">{r.url}</a>}
            </span>
          </li>
        ))}
      </ol>

      <footer className="mt-8 border-t border-rule pt-3 text-[10.5px] leading-5 text-faint">
        Reproducible: composing a brief with the same question, geography, evidence set and levers under model {brief.modelVersion} yields fingerprint <span className="font-mono text-ink-800">{brief.fingerprint}</span>. {brief.dataNotice}. Independent SIH26019 prototype — not an official Government of India document.
      </footer>
    </article>
  );
}
