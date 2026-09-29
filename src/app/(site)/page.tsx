import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, GitBranch, MapPin, Microscope, Scale } from "lucide-react";
import { EVIDENCE } from "@/data/evidence";
import { ASSUMPTIONS } from "@/data/assumptions";
import { INDICATORS } from "@/data/indicators";
import { DATA_NOTICE, DISTRICTS, STATES } from "@/lib/data/regions";
import { evidenceById } from "@/data/evidence";
import { signatureContrast } from "@/lib/case/signature";
import type { Verdict } from "@/lib/sim/decision";
import { BrandMark, TriRule, Wordmark } from "@/components/shell/Brand";
import { IndiaSilhouette } from "@/components/IndiaSilhouette";
import { JourneyButton, RolePicker } from "./RolePicker";

const FLOW = [
  { k: "Ask", d: "A policy question in plain language" },
  { k: "Evidence", d: "Studies, law, policy and data — ranked, graded, every sentence cited" },
  { k: "Place", d: "The districts the evidence points to, on the map" },
  { k: "Decide", d: "Simulate the reform; get a verdict, how sure it is, and why" },
  { k: "Brief", d: "A reproducible brief in which every number traces to its source" },
];

const PILLARS = [
  {
    icon: Scale,
    title: "A decision, not a dashboard",
    body: "A transparent evidence-to-decision rule turns the simulation into Adopt, Pilot first, Build the evidence first or Reconsider — and names the assumption, the studies and the next study that would change it.",
  },
  {
    icon: MapPin,
    title: "Evidence that knows where it applies",
    body: "Studies count more where they were done. When local evidence contradicts the assumption a result rests on, the verdict changes for that district — even if the national picture is clear.",
  },
  {
    icon: GitBranch,
    title: "Every number has a chain",
    body: "Studies → model assumptions → projected outcomes, drawn from the data. Hover to trace a lineage, click to open the record. The brief carries a fingerprint that reproduces it from the same inputs.",
  },
  {
    icon: Microscope,
    title: "Doubt becomes the research agenda",
    body: "Sensitivity analysis shows which weakly evidenced assumption drives the uncertainty. That becomes \u201cwhat would change this decision\u201d, a research call, and a cell on the evidence gap map.",
  },
];

const VERDICT_COLOR: Record<Verdict, string> = { adopt: "#1f8a5b", pilot: "#b07a0c", research: "#d0701a", reconsider: "#ae3f2a", none: "#8a8f98" };

export default function Landing() {
  const nStudies = EVIDENCE.filter((e) => e.type === "research" || e.type === "case-study" || e.type === "report").length;
  const nNorm = EVIDENCE.filter((e) => e.type === "policy" || e.type === "law").length;
  const nData = EVIDENCE.filter((e) => e.type === "dataset").length;
  const contrast = signatureContrast();
  return (
    <div className="min-h-screen bg-paper">
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden bg-ink-950 text-paper">
        <TriRule />
        <div className="survey-grid absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <BrandMark size={34} />
            <Wordmark />
          </div>
          <div className="hidden items-center gap-3 text-[12px] text-ink-300 md:flex">
            <span className="font-mono uppercase tracking-[0.14em]">SIH 2026 · SIH26019</span>
            <span className="h-3 w-px bg-ink-700" />
            <span>Problem statement of the Department of Land Resources, MoRD</span>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-[1240px] items-center gap-8 px-5 pb-14 pt-6 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pb-20 lg:pt-10">
          <div className="animate-fade-up">
            <div className="label-caps text-saffron">National Land Policy Intelligence &amp; Research Lab</div>
            <h1 className="mt-4 font-serif text-[40px] font-semibold leading-[1.04] tracking-[-0.02em] text-paper sm:text-[52px] lg:text-[60px]">
              From a policy question to a decision <span className="italic text-saffron-soft">you can defend.</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-[16.5px] leading-relaxed text-ink-200">
              The Policy Casefile finds the evidence, shows where it matters, tests the reform and tells you how sure it can be — and why. Then it writes a brief in which every number traces back to a study, a law or a dataset.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Suspense fallback={<span className="inline-block h-12 w-64 rounded bg-saffron/60" />}>
                <JourneyButton />
              </Suspense>
              <Link href="#roles" className="inline-flex h-12 items-center gap-2 rounded-[5px] border border-ink-600 px-5 text-[15px] font-medium text-paper transition-colors hover:border-ink-400 hover:bg-ink-900">
                Choose a role <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-8 grid max-w-[560px] grid-cols-3 gap-4 border-t border-ink-800 pt-5">
              {[
                { k: "Pratyakṣa", v: "Observed", d: "datasets & indicators", c: "#6fb3c9" },
                { k: "Śabda", v: "Documented", d: "research, law, policy", c: "#9aa6dc" },
                { k: "Anumāna", v: "Inferred", d: "models & syntheses", c: "#e8a45a" },
              ].map((p) => (
                <div key={p.k}>
                  <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em]" style={{ color: p.c }}>
                    <span className="size-1.5 rounded-full" style={{ background: p.c }} />
                    {p.k}
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-paper">{p.v}</div>
                  <div className="text-[12px] text-ink-300">{p.d}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 max-w-[560px] text-[12px] leading-relaxed text-ink-400">
              Every output carries its <em>pramāṇa</em> — the classical Indian term for a valid means of knowledge — so users always know whether a claim was observed, documented or inferred.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[460px]">
            <IndiaSilhouette className="w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]" />
            <div className="absolute bottom-2 left-0 rounded border border-ink-700 bg-ink-900/90 px-3 py-2 text-[11px] text-ink-300 backdrop-blur">
              <div className="font-mono uppercase tracking-[0.12em] text-ink-200">Land-dispute pressure</div>
              <div>State shading · district survey points · demo data</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- stats strip ---------- */}
      <section className="border-b border-rule bg-card">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-y-4 px-5 py-5 md:grid-cols-5 md:px-8">
          {[
            { v: EVIDENCE.length, l: "Evidence records", s: `${nStudies} studies · ${nNorm} laws & policies · ${nData} datasets` },
            { v: STATES.length, l: "States & UTs", s: "State indicator profiles" },
            { v: DISTRICTS.length, l: "Districts", s: "6 focus states, 2019–2025" },
            { v: INDICATORS.length, l: "Indicators", s: "Governance, land use, climate, equity" },
            { v: ASSUMPTIONS.length, l: "Evidence-backed assumptions", s: "Every model coefficient cited" },
          ].map((x) => (
            <div key={x.l} className="px-2">
              <div className="font-serif text-[30px] font-semibold leading-none text-ink-900 tabular">{x.v}</div>
              <div className="mt-1 text-[13px] font-semibold text-ink-800">{x.l}</div>
              <div className="text-[12px] text-muted">{x.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- the moment ---------- */}
      <section className="mx-auto max-w-[1240px] px-5 pt-12 md:px-8">
        <div className="label-caps text-saffron-deep">Why it matters</div>
        <h2 className="mt-2 max-w-3xl font-serif text-[28px] font-semibold leading-tight text-ink-900 md:text-[34px]">The same land reform. Two different decisions. Because the evidence says so.</h2>
        <p className="mt-2 max-w-3xl text-[15px] text-muted">One evidence-backed package, judged by the platform for all of India and for one fast-urbanising district. Computed live by the casefile engine from the bundled demonstration data.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {contrast.map((c) => {
            const local = c.driver?.localContradicting ?? [];
            return (
              <div key={c.code} className="panel relative overflow-hidden p-5 pl-6">
                <span className="absolute inset-y-0 left-0 w-1" style={{ background: VERDICT_COLOR[c.verdict] }} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="label-caps text-muted">{c.name}</span>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold text-white" style={{ background: VERDICT_COLOR[c.verdict] }}>{c.label}</span>
                </div>
                <p className="mt-3 font-serif text-[18px] leading-snug text-ink-900">{c.headline}</p>
                {c.driver && (
                  <div className="mt-4 flex items-start gap-3 border-t border-rule pt-3 text-[13px] leading-relaxed">
                    <span className="shrink-0 rounded bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] text-inferred">{c.driver.id}</span>
                    {local.length ? (
                      <span className="text-ink-800">
                        Contradicted here by <span className="font-mono text-[12px] text-risk">{local[0]}</span>
                        {evidenceById[local[0]] && <span className="text-muted"> — “{evidenceById[local[0]].title}”</span>}
                      </span>
                    ) : (
                      <span className="text-muted">Backed by {c.driver.supporting} supporting studies · evidence confidence {c.confidence === null ? "—" : Math.round(c.confidence * 100)}/100</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Suspense fallback={<span className="inline-block h-12 w-72 rounded bg-saffron/60" />}>
            <JourneyButton label="Walk through this casefile" />
          </Suspense>
          <span className="text-[13px] text-muted">Five steps, about three minutes, no sign-up. Runs fully offline.</span>
        </div>
      </section>

      {/* ---------- flow ---------- */}
      <section className="mx-auto max-w-[1240px] px-5 pb-12 pt-14 md:px-8">
        <div className="label-caps text-saffron-deep">One workflow: the Policy Casefile</div>
        <h2 className="mt-2 max-w-3xl font-serif text-[28px] font-semibold leading-tight text-ink-900 md:text-[34px]">Five steps on one page, with the evidence attached at every step.</h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5">
          {FLOW.map((f, i) => (
            <li key={f.k} className="relative bg-card p-4">
              <div className="font-mono text-[11px] text-faint">0{i + 1}</div>
              <div className="mt-1 font-serif text-[17px] font-semibold text-ink-900">{f.k}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-muted">{f.d}</div>
              {i < FLOW.length - 1 && <ArrowRight size={14} className="absolute right-2 top-4 hidden text-rule-strong lg:block" />}
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- roles ---------- */}
      <section id="roles" className="border-y border-rule bg-paper-2/60">
        <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-8">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <div className="label-caps text-saffron-deep">Demo accounts</div>
              <h2 className="mt-2 font-serif text-[28px] font-semibold text-ink-900">Enter the platform</h2>
            </div>
            <p className="max-w-md text-[13.5px] text-muted">No sign-up needed. The interface, permissions and API access adapt to the role you choose; switch at any time from the sidebar.</p>
          </div>
          <div className="mt-6">
            <Suspense fallback={<div className="h-56" />}>
              <RolePicker />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ---------- pillars ---------- */}
      <section className="mx-auto max-w-[1240px] px-5 py-14 md:px-8">
        <div className="label-caps text-saffron-deep">What makes it different</div>
        <h2 className="mt-2 max-w-3xl font-serif text-[28px] font-semibold leading-tight text-ink-900 md:text-[34px]">Not another AI + GIS dashboard: a decision you can trace.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="panel flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-ink-900 text-saffron">
                <p.icon size={19} strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="font-serif text-[18px] font-semibold text-ink-900">{p.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-rule bg-ink-950 text-ink-300">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 text-[12px] md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <span className="font-semibold text-ink-100">{DATA_NOTICE}.</span> Independent hackathon prototype for problem statement SIH26019 — not an official Government of India website.
          </div>
          <div>Boundaries © DataMeet India community (CC BY 4.0 / CC BY 2.5 IN) · Laws & programmes linked to official sources.</div>
        </div>
      </footer>
    </div>
  );
}
