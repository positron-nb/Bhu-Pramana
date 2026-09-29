"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Columns2, Crosshair, Flame, Layers, Library, MapPinned, ScrollText, X } from "lucide-react";
import { EVIDENCE } from "@/data/evidence";
import { indicatorById, SERIES_YEARS } from "@/data/indicators";
import { OPPORTUNITIES } from "@/data/opportunities";
import { INDICATOR_IDS, type IndicatorId, type Region } from "@/lib/domain/schemas";
import { DATA_NOTICE, DISTRICTS, FOCUS_STATES, getRegion, NATIONAL, regionByCode, STATES } from "@/lib/data/regions";
import { computeBreaks } from "@/components/map/breaks";
import { useHydrated, useStore } from "@/lib/store";
import { Badge, Button, LinkButton, NoticeBar, Panel, PramanaTag, TypeMark } from "@/components/ui";
import { RampLegend, Sparkline } from "@/components/charts";
import { SERIES } from "@/lib/viz";

const IndiaMap = dynamic(() => import("@/components/map/IndiaMap").then((m) => m.IndiaMap), { ssr: false, loading: () => <div className="absolute inset-0 animate-pulse-soft bg-[#dfe7ea]" /> });

const LAYER_GROUPS: { title: string; ids: IndicatorId[] }[] = [
  { title: "Land governance", ids: ["digitization", "mapLinkage", "mutationDays", "adminCapacity"] },
  { title: "Disputes", ids: ["disputePressure", "pendingCases"] },
  { title: "Land use & urban expansion", ids: ["landUsePressure", "urbanGrowth", "builtUp", "zoningStrictness"] },
  { title: "Climate", ids: ["climateVulnerability", "climateResilience", "degradation"] },
  { title: "Infrastructure & equity", ids: ["roadDensity", "womenOwnership", "researchActivity"] },
];

const MAP_PADDING = { top: 40, bottom: 40, left: 300, right: 390 };
const PILOT_DISTRICTS = [...new Set(OPPORTUNITIES.filter((o) => o.kind === "pilot").flatMap((o) => o.regions.filter((r) => r.startsWith("D"))))];

function percentile(r: Region, id: IndicatorId): number {
  const pool = r.level === "district" ? DISTRICTS : STATES;
  const vals = pool.map((x) => x.indicators[id]).sort((a, b) => a - b);
  const idx = vals.findIndex((v) => v >= r.indicators[id]);
  return Math.round((idx / Math.max(1, vals.length - 1)) * 100);
}

export function AtlasView() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const current = useStore((s) => s.current);
  const updateCase = useStore((s) => s.updateCurrent);
  const initialLayer = (INDICATOR_IDS as readonly string[]).includes(params.get("layer") ?? "") ? (params.get("layer") as IndicatorId) : "disputePressure";
  const initialRegion = getRegion(params.get("region")) ? params.get("region") : null;
  const [layer, setLayer] = useState<IndicatorId>(initialLayer);
  const [selected, setSelected] = useState<string | null>(initialRegion);
  const [level, setLevel] = useState<"state" | "district">(initialRegion && regionByCode[initialRegion]?.level === "state" && !regionByCode[initialRegion].focus ? "state" : "district");
  const [heat, setHeat] = useState(false);
  const [pilots, setPilots] = useState(true);
  const [streets, setStreets] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compare, setCompare] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const def = indicatorById[layer];
  const breaks = useMemo(() => computeBreaks(layer, level), [layer, level]);
  const region = selected ? regionByCode[selected] : null;
  const cmpRegion = compare ? regionByCode[compare] : null;

  const syncUrl = useCallback((code: string | null, l: IndicatorId) => {
    const sp = new URLSearchParams();
    if (code) sp.set("region", code);
    sp.set("layer", l);
    router.replace(`/atlas?${sp}`, { scroll: false });
  }, [router]);

  const onSelect = useCallback((code: string) => {
    if (compareMode && selected && code !== selected) {
      setCompare(code);
      return;
    }
    setSelected(code);
    syncUrl(code, layer);
  }, [compareMode, selected, layer, syncUrl]);

  const chooseLayer = (id: IndicatorId) => {
    setLayer(id);
    syncUrl(selected, id);
  };

  const topDistricts = useMemo(() => {
    const pool = region?.level === "state" ? DISTRICTS.filter((d) => d.parent === region.code) : region?.level === "district" ? DISTRICTS.filter((d) => d.parent === region.parent) : DISTRICTS;
    return [...pool].sort((a, b) => (def.higherIsBetter ? a.indicators[layer] - b.indicators[layer] : b.indicators[layer] - a.indicators[layer])).slice(0, 5);
  }, [region, layer, def.higherIsBetter]);

  return (
    <div className="-mx-4 -mb-16 -mt-6 md:-mx-6 xl:-mx-8">
      <div className="relative h-[calc(100vh-52px)] min-h-[560px] overflow-hidden">
        <IndiaMap
          className="absolute inset-0"
          layer={layer}
          level={level}
          selected={selected}
          compare={compare}
          pilots={pilots ? PILOT_DISTRICTS : []}
          heat={heat}
          streets={streets}
          onSelect={onSelect}
          padding={MAP_PADDING}
        />

        {/* layer control */}
        <div className="absolute left-3 top-3 z-10 w-[268px] max-w-[calc(100%-24px)]">
          <Panel className="overflow-hidden bg-card/95 backdrop-blur">
            <div className="flex items-center justify-between border-b border-rule px-3 py-2">
              <div>
                <div className="label-caps text-saffron-deep">Geo-Intelligence Atlas</div>
                <div className="font-serif text-[15px] font-semibold text-ink-900">Layers</div>
              </div>
              <button onClick={() => setPanelOpen((o) => !o)} className="rounded p-1 text-muted hover:bg-paper-2" aria-label={panelOpen ? "Collapse layers" : "Expand layers"}>
                <Layers size={16} />
              </button>
            </div>
            {panelOpen && (
              <div className="max-h-[calc(100vh-230px)] overflow-y-auto p-3">
                <div className="mb-3 grid grid-cols-2 gap-1 rounded-md bg-paper-2 p-0.5 text-[12.5px]">
                  {(["state", "district"] as const).map((l) => (
                    <button key={l} onClick={() => setLevel(l)} className={clsx("rounded px-2 py-1 font-medium", level === l ? "bg-card text-ink-900 shadow-card" : "text-muted")}>{l === "state" ? "States & UTs" : "Districts (6 states)"}</button>
                  ))}
                </div>
                {LAYER_GROUPS.map((g) => (
                  <div key={g.title} className="mb-2.5">
                    <div className="label-caps mb-1 text-faint">{g.title}</div>
                    <div className="space-y-0.5">
                      {g.ids.map((id) => (
                        <label key={id} className={clsx("flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[12.5px]", layer === id ? "bg-ink-900 text-paper" : "text-ink-800 hover:bg-paper-2")}>
                          <input type="radio" name="layer" className="sr-only" checked={layer === id} onChange={() => chooseLayer(id)} />
                          <span className="size-2.5 rounded-sm" style={{ background: indicatorById[id].higherIsBetter ? SERIES.baseline : SERIES.scenario }} />
                          {indicatorById[id].label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="mt-3 space-y-1.5 border-t border-rule pt-3 text-[12.5px]">
                  <Toggle on={heat} set={setHeat} icon={<Flame size={13} />} label="Hotspot heat (district centroids)" />
                  <Toggle on={pilots} set={setPilots} icon={<MapPinned size={13} />} label="Policy intervention pilots" />
                  <Toggle on={compareMode} set={(v) => { setCompareMode(v); if (!v) setCompare(null); }} icon={<Columns2 size={13} />} label="Compare mode (click a second region)" />
                  <Toggle on={streets} set={setStreets} icon={<Crosshair size={13} />} label="Street context (online tiles)" />
                </div>
                <div className="mt-3 border-t border-rule pt-3">
                  <label className="label-caps mb-1 block text-faint" htmlFor="jump">Jump to</label>
                  <select id="jump" value={selected ?? ""} onChange={(e) => { const v = e.target.value || null; setSelected(v); syncUrl(v, layer); if (v && regionByCode[v].level === "district") setLevel("district"); }} className="h-8 w-full rounded border border-rule bg-card px-2 text-[12.5px]">
                    <option value="">India (national view)</option>
                    <optgroup label="Focus states">
                      {FOCUS_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </optgroup>
                    {FOCUS_STATES.map((s) => (
                      <optgroup key={s.code} label={`${s.name} districts`}>
                        {DISTRICTS.filter((d) => d.parent === s.code).sort((a, b) => a.name.localeCompare(b.name)).map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                      </optgroup>
                    ))}
                    <optgroup label="Other states & UTs">
                      {STATES.filter((s) => !s.focus).map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* legend */}
        <div className="absolute bottom-7 left-3 z-10 w-[268px] max-w-[calc(100%-24px)]">
          <Panel className="bg-card/95 p-3 backdrop-blur">
            <RampLegend ramp={breaks.ramp} min={breaks.min} max={breaks.max} label={`${def.label} (${def.unit}) · quantile classes`} decimals={def.decimals} />
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted">
              <PramanaTag p="pratyaksha" compact />
              <span>{DATA_NOTICE}</span>
            </div>
            <div className="mt-1 text-[10.5px] text-faint">Modelled on: {def.modelledOn}</div>
          </Panel>
        </div>

        {/* region panel */}
        <div className="absolute bottom-3 right-3 top-3 z-10 w-[360px] max-w-[calc(100%-24px)] overflow-hidden max-md:top-auto max-md:h-[45%]">
          <Panel className="flex h-full flex-col overflow-hidden bg-card/97 backdrop-blur">
            {region ? (
              <RegionPanel region={region} layer={layer} onClose={() => { setSelected(null); setCompare(null); syncUrl(null, layer); }} cmp={cmpRegion} onClearCompare={() => setCompare(null)} compareMode={compareMode}
                caseQuestion={hydrated && current?.synthesis ? current.question : null}
                onDecideHere={() => {
                  // an open casefile moves to this place and re-runs the decision; otherwise a new casefile starts here
                  if (current?.synthesis) {
                    updateCase({ regionCode: region.code, levers: undefined, simulatedAt: undefined, insight: undefined, briefId: undefined });
                    router.push("/case?step=simulate");
                  } else router.push(`/case?region=${region.code}`);
                }}
                onDrill={(code) => { setSelected(code); syncUrl(code, layer); setLevel("district"); }}
              />
            ) : (
              <div className="flex h-full flex-col overflow-y-auto p-4">
                <div className="label-caps text-muted">National view</div>
                <h2 className="mt-1 font-serif text-[22px] font-semibold text-ink-900">India</h2>
                <p className="mt-1 text-[13px] text-muted">Click any state or district to open its governance profile, trends and linked evidence. {level === "state" ? "Switch to Districts for the six focus states." : ""}</p>
                <div className="mt-4 rounded-md border border-rule bg-paper p-3">
                  <div className="label-caps text-muted">{def.short} · national</div>
                  <div className="mt-1 flex items-end justify-between">
                    <span className="font-serif text-[28px] font-semibold tabular text-ink-900">{NATIONAL.indicators[layer].toFixed(def.decimals)}<span className="ml-1 text-[12px] font-normal text-muted">{def.unit}</span></span>
                    {NATIONAL.series[layer] && <Sparkline values={NATIONAL.series[layer]} color={def.higherIsBetter ? SERIES.baseline : SERIES.scenario} width={110} height={34} />}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="label-caps mb-2 text-muted">{def.higherIsBetter ? "Lowest" : "Highest"} {def.short.toLowerCase()} · districts</div>
                  <ol className="space-y-1">
                    {topDistricts.map((d, i) => (
                      <li key={d.code}>
                        <button onClick={() => { setLevel("district"); onSelect(d.code); }} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[13px] hover:bg-paper-2">
                          <span><span className="mr-2 font-mono text-[11px] text-faint">{i + 1}</span>{d.name}<span className="text-muted">, {regionByCode[d.parent!].name}</span></span>
                          <span className="font-semibold tabular text-ink-900">{d.indicators[layer].toFixed(def.decimals)}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
                <NoticeBar className="mt-auto">Synthetic district values for demonstration. Boundaries: Census 2011 districts (DataMeet).</NoticeBar>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, set, icon, label }: { on: boolean; set: (v: boolean) => void; icon: React.ReactNode; label: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => set(!on)} className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-paper-2">
      <span className="flex items-center gap-2 text-ink-800">{icon}{label}</span>
      <span className={clsx("relative h-4 w-7 shrink-0 rounded-full transition-colors", on ? "bg-saffron" : "bg-paper-3")}>
        <span className={clsx("absolute top-0.5 size-3 rounded-full bg-white shadow transition-all", on ? "left-3.5" : "left-0.5")} />
      </span>
    </button>
  );
}

function RegionPanel({ region, layer, onClose, cmp, onClearCompare, compareMode, caseQuestion, onDecideHere, onDrill }: {
  region: Region; layer: IndicatorId; onClose: () => void; cmp: Region | null; onClearCompare: () => void; compareMode: boolean;
  caseQuestion: string | null; onDecideHere: () => void; onDrill: (code: string) => void;
}) {
  const parent = region.parent && region.parent !== "IN" ? regionByCode[region.parent] : null;
  const evidence = useMemo(() => EVIDENCE.filter((e) => e.geography.regions.includes(region.code) || (region.level === "state" && e.geography.regions.some((r) => regionByCode[r]?.parent === region.code)) || (parent && e.geography.regions.includes(parent.code))).sort((a, b) => b.year - a.year), [region, parent]);
  const pilots = OPPORTUNITIES.filter((o) => o.kind === "pilot" && (o.regions.includes(region.code) || (parent && o.regions.includes(parent.code))));
  const shown: IndicatorId[] = [layer, ...(["disputePressure", "digitization", "mutationDays", "urbanGrowth", "landUsePressure", "climateVulnerability", "climateResilience", "adminCapacity"] as IndicatorId[]).filter((x) => x !== layer)];
  const districts = region.level === "state" && region.focus ? DISTRICTS.filter((d) => d.parent === region.code) : [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-rule px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="label-caps text-muted">{region.level === "district" ? `District · ${parent?.name}` : region.level === "state" ? "State / Union Territory" : "Country"}</div>
            <h2 className="font-serif text-[22px] font-semibold leading-tight text-ink-900">{region.name}</h2>
            <div className="mt-1 text-[12px] text-muted tabular">Pop. {(region.population / 1e6).toFixed(2)} M · {region.areaKm2.toLocaleString("en-IN")} km² <span className="text-faint">(demo)</span></div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-faint hover:bg-paper-2 hover:text-ink-800" aria-label="Close profile"><X size={16} /></button>
        </div>
        {region.archetypes.length > 0 && region.archetypes[0] !== "rural" && (
          <div className="mt-2 flex flex-wrap gap-1">{region.archetypes.map((a) => <Badge key={a}>{a.replace("-", " ")}</Badge>)}</div>
        )}
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
          <Button size="sm" variant="primary" onClick={onDecideHere} title={caseQuestion ? `Re-run “${caseQuestion}” for ${region.name}` : `Start a casefile for ${region.name}`}>
            <ScrollText size={13} /> {caseQuestion ? "Decide for this place" : "Start a casefile here"}
          </Button>
          <LinkButton href={`/search?q=${encodeURIComponent(region.name)}`} size="sm" variant="ink"><Library size={13} /> Evidence</LinkButton>
        </div>
        {caseQuestion && <p className="mt-1.5 truncate text-[11px] text-muted" title={caseQuestion}>Casefile: {caseQuestion}</p>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {cmp ? (
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="label-caps text-muted">Compare</div>
              <button onClick={onClearCompare} className="text-[12px] text-muted hover:text-risk">Clear</button>
            </div>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-rule text-left text-[11px] text-muted">
                  <th className="py-1 font-medium">Indicator</th>
                  <th className="py-1 text-right font-medium"><span className="text-saffron-deep">■</span> {region.name}</th>
                  <th className="py-1 text-right font-medium"><span className="text-[#3a6db0]">■</span> {cmp.name}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((id) => {
                  const d = indicatorById[id];
                  const a = region.indicators[id], b = cmp.indicators[id];
                  const aBetter = d.higherIsBetter ? a > b : a < b;
                  return (
                    <tr key={id} className="border-b border-rule/60">
                      <td className="py-1.5 text-ink-800">{d.short}</td>
                      <td className={clsx("py-1.5 text-right tabular", aBetter ? "font-semibold text-green" : "text-ink-800")}>{a.toFixed(d.decimals)}</td>
                      <td className={clsx("py-1.5 text-right tabular", !aBetter && a !== b ? "font-semibold text-green" : "text-ink-800")}>{b.toFixed(d.decimals)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-faint">Green marks the better value for each indicator.</p>
          </div>
        ) : compareMode ? (
          <div className="mx-4 mt-3 rounded border border-dashed border-[#3a6db0]/50 bg-[#3a6db0]/5 px-3 py-2 text-[12px] text-[#2b5590]">Compare mode: click a second region on the map.</div>
        ) : null}

        <div className="p-4 pt-3">
          <div className="label-caps mb-2 text-muted">Indicators · 2019–2025</div>
          <ul className="divide-y divide-rule/70">
            {shown.map((id) => {
              const d = indicatorById[id];
              const v = region.indicators[id];
              const p = percentile(region, id);
              const worse = d.higherIsBetter ? p < 33 : p > 66;
              const better = d.higherIsBetter ? p > 66 : p < 33;
              return (
                <li key={id} className={clsx("flex items-center gap-3 py-2", id === layer && "-mx-2 rounded bg-saffron-soft/40 px-2")}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] text-ink-800">{d.label}</div>
                    <div className="text-[10.5px] text-faint">{region.level === "country" ? "" : `${p}th percentile among ${region.level === "district" ? "districts" : "states"}`}</div>
                  </div>
                  {region.series[id] && <Sparkline values={region.series[id]} width={64} height={22} color={d.higherIsBetter ? SERIES.baseline : SERIES.scenario} label={`${d.short} ${SERIES_YEARS[0]}–${SERIES_YEARS[SERIES_YEARS.length - 1]}`} />}
                  <div className={clsx("w-14 text-right text-[13.5px] font-semibold tabular", worse ? "text-risk" : better ? "text-green" : "text-ink-900")}>
                    {v.toFixed(d.decimals)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {districts.length > 0 && (
          <div className="px-4 pb-3">
            <div className="label-caps mb-1.5 text-muted">Districts · {indicatorById[layer].short}</div>
            <div className="flex flex-wrap gap-1">
              {[...districts].sort((a, b) => b.indicators[layer] - a.indicators[layer]).slice(0, 12).map((d) => (
                <button key={d.code} onClick={() => onDrill(d.code)} className="rounded border border-rule bg-paper px-1.5 py-0.5 text-[11.5px] text-ink-800 hover:border-ink-400">
                  {d.name} <span className="tabular text-faint">{d.indicators[layer].toFixed(indicatorById[layer].decimals)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {pilots.length > 0 && (
          <div className="px-4 pb-3">
            <div className="label-caps mb-1.5 text-muted">Policy pilots here</div>
            {pilots.map((p) => (
              <Link key={p.id} href="/agenda#opportunities" className="mb-1 block rounded border border-green/30 bg-green-soft/50 px-2.5 py-1.5 text-[12.5px] text-green-deep hover:border-green">
                {p.title} {p.progress !== undefined && <span className="tabular text-[11px]">· {p.progress}% complete</span>}
              </Link>
            ))}
          </div>
        )}

        <div className="border-t border-rule px-4 py-3">
          <div className="label-caps mb-2 text-muted">Linked evidence · {evidence.length}</div>
          {evidence.length === 0 ? (
            <p className="text-[12.5px] text-muted">No records specific to this region — national evidence applies. This is itself an evidence gap.</p>
          ) : (
            <ul className="space-y-1.5">
              {evidence.slice(0, 8).map((e) => (
                <li key={e.id}>
                  <Link href={`/evidence/${e.id}`} className="group block rounded px-1.5 py-1 hover:bg-paper-2">
                    <div className="flex items-center gap-2"><TypeMark type={e.type} /><span className="font-mono text-[10.5px] text-faint">{e.id} · {e.year}</span></div>
                    <div className="text-[12.5px] leading-snug text-ink-800 group-hover:text-saffron-deep">{e.title}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {evidence.length > 8 && <Link href={`/search?q=${encodeURIComponent(region.name)}`} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-saffron-deep hover:underline">All evidence for {region.name} <ArrowRight size={12} /></Link>}
        </div>
      </div>
    </div>
  );
}
