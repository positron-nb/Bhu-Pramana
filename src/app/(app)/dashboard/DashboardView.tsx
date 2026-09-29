"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowDownUp, ArrowRight, Download, Flame, FlaskConical } from "lucide-react";
import { EVIDENCE } from "@/data/evidence";
import { indicatorById, SERIES_YEARS } from "@/data/indicators";
import { OPPORTUNITIES } from "@/data/opportunities";
import { INTERVENTIONS } from "@/data/taxonomy";
import type { IndicatorId } from "@/lib/domain/schemas";
import { DATA_NOTICE, DISTRICTS, FOCUS_STATES, NATIONAL, regionByCode, STATES } from "@/lib/data/regions";
import { useHydrated, useStore } from "@/lib/store";
import { ROLE_META } from "@/lib/roles";
import { SERIES } from "@/lib/viz";
import { Badge, LinkButton, Meter, NoticeBar, PageHeader, Panel, PanelHeader, PramanaTag } from "@/components/ui";
import { BarList, Histogram, RampLegend, Sparkline, TrendChart } from "@/components/charts";
import { computeBreaks } from "@/components/map/breaks";

const IndiaMap = dynamic(() => import("@/components/map/IndiaMap").then((m) => m.IndiaMap), { ssr: false, loading: () => <div className="h-full w-full animate-pulse-soft bg-[#dfe7ea]" /> });

const MAP_LAYERS: IndicatorId[] = ["disputePressure", "digitization", "landUsePressure", "climateVulnerability", "mutationDays"];
const RANK_COLS: IndicatorId[] = ["digitization", "disputePressure", "mutationDays", "landUsePressure", "climateResilience", "adminCapacity"];

export function DashboardView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const role = useStore((s) => s.role);
  const [scope, setScope] = useState<string>("IN");
  const [layer, setLayer] = useState<IndicatorId>("disputePressure");
  const [sortBy, setSortBy] = useState<IndicatorId>("disputePressure");
  const [sortDesc, setSortDesc] = useState(true);

  const region = regionByCode[scope];
  const districts = useMemo(() => (scope === "IN" ? DISTRICTS : DISTRICTS.filter((d) => d.parent === scope)), [scope]);
  const evidence = useMemo(() => (scope === "IN" ? EVIDENCE : EVIDENCE.filter((e) => e.geography.scope === "national" || e.geography.regions.some((r) => r === scope || regionByCode[r]?.parent === scope))), [scope]);
  const pilots = OPPORTUNITIES.filter((o) => (o.kind === "pilot") && (scope === "IN" || o.regions.includes(scope) || o.regions.some((r) => regionByCode[r]?.parent === scope)));
  const vulnerable = districts.filter((d) => d.indicators.climateVulnerability >= 0.7).length;

  const hotspots = useMemo(() => {
    const vals = (id: IndicatorId) => { const v = districts.map((d) => d.indicators[id]); return [Math.min(...v), Math.max(...v)] as const; };
    const [dl, dh] = vals("disputePressure");
    const [ul, uh] = vals("urbanGrowth");
    return [...districts]
      .map((d) => ({ d, s: ((d.indicators.disputePressure - dl) / (dh - dl || 1)) * 0.6 + ((d.indicators.urbanGrowth - ul) / (uh - ul || 1)) * 0.4 }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 7);
  }, [districts]);

  const byTopic = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of evidence) for (const iv of new Set(e.findings.map((f) => f.intervention))) m.set(iv, (m.get(iv) ?? 0) + 1);
    return INTERVENTIONS.map((i) => ({ key: i.id, label: i.short, value: m.get(i.id) ?? 0 })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [evidence]);
  const byYear = useMemo(() => {
    const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
    return years.map((y) => ({ key: String(y), label: String(y), value: evidence.filter((e) => e.year === y && e.type !== "law").length }));
  }, [evidence]);

  const ranked = useMemo(() => {
    const pool = scope === "IN" ? STATES : DISTRICTS.filter((d) => d.parent === scope);
    return [...pool].sort((a, b) => (sortDesc ? b.indicators[sortBy] - a.indicators[sortBy] : a.indicators[sortBy] - b.indicators[sortBy]));
  }, [scope, sortBy, sortDesc]);

  const kpis: { id: IndicatorId; label: string; unit?: string }[] = [
    { id: "digitization", label: "Land record digitisation", unit: "%" },
    { id: "disputePressure", label: "Land-dispute pressure" },
    { id: "mutationDays", label: "Median mutation time", unit: "days" },
    { id: "landUsePressure", label: "Land-use conversion pressure" },
  ];

  const breaks = computeBreaks(layer, "district");
  const roleIntro = hydrated && role ? ROLE_META[role] : null;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        eyebrow="Governance Dashboard"
        title={scope === "IN" ? "National land governance at a glance" : `${region.name}: land governance at a glance`}
        description={roleIntro ? `${roleIntro.label} view — ${role === "policymaker" ? "decision indicators, hotspots and active policy experiments first." : role === "researcher" ? "research activity, evidence coverage and data you can download." : role === "admin" ? "platform coverage and data provenance at a glance." : "open indicators and maps; demonstration data only."}` : undefined}
        right={
          <>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="h-9 rounded border border-rule bg-card px-2 text-[13.5px]" aria-label="Scope">
              <option value="IN">All India</option>
              {FOCUS_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
            <LinkButton href={`/api/v1/indicators.csv?level=${scope === "IN" ? "state" : "district"}`} size="md" prefetch={false}><Download size={14} /> CSV</LinkButton>
          </>
        }
      />

      <NoticeBar className="mb-4">{DATA_NOTICE}. Indicator structures follow the public systems named under each metric; values are synthetic and illustrative.</NoticeBar>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((k) => {
          const def = indicatorById[k.id];
          const s = region.series[k.id];
          const v = region.indicators[k.id];
          const first = s?.[0] ?? v;
          const change = v - first;
          const good = def.higherIsBetter ? change > 0 : change < 0;
          return (
            <Panel key={k.id} className="p-4">
              <div className="label-caps text-muted">{k.label}</div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <span className="font-serif text-[28px] font-semibold leading-none tabular text-ink-900">{v.toFixed(def.decimals)}</span>
                  <span className="ml-1 text-[12px] text-muted">{k.unit ?? ""}</span>
                </div>
                {s && <Sparkline values={s} color={def.higherIsBetter ? SERIES.baseline : SERIES.scenario} width={80} height={30} />}
              </div>
              <div className={clsx("mt-1.5 text-[12px] tabular", good ? "text-green" : "text-risk")}>
                {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(def.decimals)} since 2019
              </div>
            </Panel>
          );
        })}
        <Panel className="p-4">
          <div className="label-caps text-muted">Climate-vulnerable districts</div>
          <div className="mt-2 font-serif text-[28px] font-semibold leading-none tabular text-ink-900">{vulnerable}<span className="ml-1 text-[12px] font-normal text-muted">of {districts.length}</span></div>
          <div className="mt-1.5 text-[12px] text-muted">vulnerability index ≥ 0.70</div>
        </Panel>
        <Panel className="p-4">
          <div className="label-caps text-muted">Evidence & experiments</div>
          <div className="mt-2 font-serif text-[28px] font-semibold leading-none tabular text-ink-900">{evidence.length}<span className="ml-1 text-[12px] font-normal text-muted">records</span></div>
          <div className="mt-1.5 text-[12px] text-muted">{pilots.length} active or planned pilots</div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <PanelHeader
            eyebrow="Geographic hotspots"
            title={indicatorById[layer].label}
            right={
              <select value={layer} onChange={(e) => setLayer(e.target.value as IndicatorId)} className="h-8 rounded border border-rule bg-card px-2 text-[12.5px]" aria-label="Map layer">
                {MAP_LAYERS.map((l) => <option key={l} value={l}>{indicatorById[l].short}</option>)}
              </select>
            }
          />
          <div className="relative h-[380px]">
            <IndiaMap className="relative h-full w-full" layer={layer} level="district" selected={scope === "IN" ? null : scope} onSelect={(code) => router.push(`/atlas?region=${code}&layer=${layer}`)} heat={false} />
            <div className="absolute bottom-3 left-3 w-[220px] rounded-md border border-rule bg-card/95 p-2.5 backdrop-blur">
              <RampLegend ramp={breaks.ramp} min={breaks.min} max={breaks.max} label={`${indicatorById[layer].short} · districts`} decimals={indicatorById[layer].decimals} />
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Pressure × growth" title="Hotspot districts" right={<Flame size={15} className="text-saffron" />} />
          <ol className="divide-y divide-rule/70">
            {hotspots.map(({ d }, i) => (
              <li key={d.code}>
                <Link href={`/atlas?region=${d.code}&layer=disputePressure`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper-2/70">
                  <span className="w-5 font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink-900">{d.name}</span>
                    <span className="block text-[11.5px] text-muted">{regionByCode[d.parent!].name} · {d.archetypes.filter((a) => a !== "rural").join(", ") || "rural"}</span>
                  </span>
                  <span className="text-right text-[12px] tabular">
                    <span className="block font-semibold text-risk">{d.indicators.disputePressure.toFixed(0)}</span>
                    <span className="block text-muted">+{d.indicators.urbanGrowth.toFixed(1)}%/yr</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="border-t border-rule px-4 py-2 text-[11.5px] text-muted">Score = 0.6 × dispute pressure + 0.4 × built-up growth (normalised within scope).</div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {(["digitization", "disputePressure", "mutationDays"] as IndicatorId[]).map((id) => {
          const def = indicatorById[id];
          return (
            <Panel key={id}>
              <PanelHeader eyebrow={`Trend ${SERIES_YEARS[0]}–${SERIES_YEARS[SERIES_YEARS.length - 1]}`} title={def.label} right={<PramanaTag p="pratyaksha" compact />} />
              <div className="p-3">
                <TrendChart years={SERIES_YEARS} series={[{ name: region.name, values: region.series[id], color: def.higherIsBetter ? SERIES.baseline : SERIES.scenario }, ...(scope !== "IN" ? [{ name: "India", values: NATIONAL.series[id], color: "#8b909a", dashed: true }] : [])]} unit={def.unit} decimals={def.decimals} height={170} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader eyebrow="Research outputs" title="Evidence by policy approach" />
          <div className="p-4">
            <BarList items={byTopic} color={SERIES.baseline} />
            <div className="mt-4 label-caps text-muted">Studies, data & reports by year</div>
            <div className="mt-2 flex h-20 items-end gap-1.5">
              {byYear.map((y) => {
                const max = Math.max(...byYear.map((x) => x.value), 1);
                return (
                  <div key={y.key} className="flex flex-1 flex-col items-center gap-1" title={`${y.label}: ${y.value}`}>
                    <div className="w-full rounded-t-[3px] bg-[#3a6db0]" style={{ height: `${Math.max(4, (y.value / max) * 64)}px` }} />
                    <span className="text-[10px] text-faint tabular">{y.label.slice(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Climate" title="Vulnerability across districts" />
          <div className="p-4">
            <Histogram values={districts.map((d) => d.indicators.climateVulnerability)} bins={12} domain={[0.2, 1]} marker={0.7} markerLabel="0.70" />
            <p className="mt-2 text-[12px] text-muted">{vulnerable} districts at or above 0.70 — candidates for climate-resilient land-use investment (A07) and hazard zoning (A12).</p>
            <LinkButton href={`/case?q=${encodeURIComponent("What works for climate-vulnerable land on the Odisha coast?")}`} size="sm" className="mt-3 w-full">Open the climate casefile <ArrowRight size={13} /></LinkButton>
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Active policy experiments" title="Pilots & sandboxes" right={<FlaskConical size={15} className="text-green" />} />
          <ul className="divide-y divide-rule/70">
            {(pilots.length ? pilots : OPPORTUNITIES.filter((o) => o.kind === "pilot")).map((p) => (
              <li key={p.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink-900">{p.title}</span>
                  <Badge tone={p.status === "active" ? "green" : "amber"}>{p.status}</Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Meter value={p.progress ?? 0} max={100} tone="green" />
                  <span className="w-9 text-right text-[11px] tabular text-muted">{p.progress ?? 0}%</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-rule px-4 py-2"><Link href="/agenda#opportunities" className="text-[12.5px] font-medium text-saffron-deep hover:underline">Innovation portal →</Link></div>
        </Panel>
      </div>

      <Panel className="mt-4 overflow-hidden">
        <PanelHeader eyebrow={scope === "IN" ? "All states & UTs" : `${region.name} districts`} title="Performance ranking" right={<span className="text-[12px] text-muted">Click a column to sort</span>} />
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-[12.5px]">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-rule text-left">
                <th className="px-4 py-2 font-medium text-muted">{scope === "IN" ? "State / UT" : "District"}</th>
                {RANK_COLS.map((c) => (
                  <th key={c} className="px-2 py-2 text-right font-medium">
                    <button onClick={() => { if (sortBy === c) setSortDesc(!sortDesc); else { setSortBy(c); setSortDesc(true); } }} className={clsx("inline-flex items-center gap-1", sortBy === c ? "text-ink-900" : "text-muted hover:text-ink-900")}>
                      {indicatorById[c].short} <ArrowDownUp size={11} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.code} className="border-b border-rule/50 hover:bg-paper-2/60">
                  <td className="px-4 py-1.5"><Link href={`/atlas?region=${r.code}`} className="font-medium text-ink-900 hover:text-saffron-deep">{r.name}</Link>{r.focus && r.level === "state" && <Badge className="ml-2">districts</Badge>}</td>
                  {RANK_COLS.map((c) => {
                    const def = indicatorById[c];
                    const nat = NATIONAL.indicators[c];
                    const better = def.higherIsBetter ? r.indicators[c] > nat : r.indicators[c] < nat;
                    return <td key={c} className={clsx("px-2 py-1.5 text-right tabular", better ? "text-green" : "text-ink-800")}>{r.indicators[c].toFixed(def.decimals)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-rule px-4 py-2 text-[11.5px] text-muted">Green: better than the national value. Source: DS-011 (demonstration panel).</div>
      </Panel>
    </div>
  );
}
