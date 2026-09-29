"use client";

import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

import { RAMP_RISK, SERIES, rampColor } from "@/lib/viz";

export { RAMP_GOOD, RAMP_RISK, SERIES, rampColor } from "@/lib/viz";

const fmt = (v: number, d: number) => (Number.isFinite(v) ? v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—");

/* ------------------------------------------------------------ sparkline */
export function Sparkline({ values, color = SERIES.baseline, width = 96, height = 26, label }: { values: number[]; color?: string; width?: number; height?: number; label?: string }) {
  if (!values.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [2 + (i / (values.length - 1 || 1)) * (width - 4), 3 + (1 - (v - min) / span) * (height - 6)] as const);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label ?? `Trend from ${values[0]} to ${values[values.length - 1]}`}>
      <title>{label ?? `${values[0]} → ${values[values.length - 1]}`}</title>
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} stroke="#fbf8f1" strokeWidth={1} />
    </svg>
  );
}

/* ------------------------------------------------------------ trend chart */
export interface TrendSeries { name: string; values: number[]; color: string; dashed?: boolean }

export function TrendChart({
  years, series, band, unit = "", decimals = 1, height = 220, yLabel, className, domain,
}: {
  years: number[];
  series: TrendSeries[];
  band?: { low: number[]; high: number[]; color: string; label?: string };
  unit?: string;
  decimals?: number;
  height?: number;
  yLabel?: string;
  className?: string;
  domain?: [number, number];
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const clip = useId();
  const W = 640, H = height, L = 44, R = 92, T = 14, B = 26;
  const all = [...series.flatMap((s) => s.values), ...(band ? [...band.low, ...band.high] : [])].filter(Number.isFinite);
  let [lo, hi] = domain ?? [Math.min(...all), Math.max(...all)];
  if (!domain) {
    const pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.1 || 1;
    lo = Math.max(0, lo - pad);
    hi = hi + pad;
  }
  const ticks = niceTicks(lo, hi, 4);
  lo = Math.min(lo, ticks[0]);
  hi = Math.max(hi, ticks[ticks.length - 1]);
  const x = (i: number) => L + (i / Math.max(1, years.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo || 1)) * (H - T - B);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const bandPath = band ? `${band.high.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join("")}${band.low.map((v, i) => `L${x(band.low.length - 1 - i)},${y(band.low[band.low.length - 1 - i])}`).join("")}Z` : "";

  // direct end labels, nudged apart when they collide
  const ends = series.map((s) => ({ name: s.name, color: s.color, v: s.values[s.values.length - 1], y: y(s.values[s.values.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 26) ends[i].y = ends[i - 1].y + 26;

  const onMove = (e: React.PointerEvent) => {
    const svg = ref.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (years.length - 1));
    setHover(i >= 0 && i < years.length ? i : null);
  };

  return (
    <div className={clsx("relative", className)}>
      {series.length > 1 && (
        <div className="mb-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted" aria-hidden>
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? "4 3" : undefined} /></svg>
              {s.name}
            </span>
          ))}
          {band && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: band.color, opacity: 0.22 }} />
              {band.label ?? "Plausible range"}
            </span>
          )}
        </div>
      )}
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" role="img" aria-label={`${series.map((s) => s.name).join(" vs ")} ${years[0]}–${years[years.length - 1]}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          <clipPath id={clip}><rect x={L} y={T - 2} width={W - L - R} height={H - T - B + 4} /></clipPath>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e4dccb" strokeWidth={1} />
            <text x={L - 8} y={y(t) + 3.5} textAnchor="end" className="fill-[#8b909a] text-[10.5px] tabular">{fmt(t, Math.abs(hi - lo) < 5 ? 1 : 0)}</text>
          </g>
        ))}
        {years.map((yr, i) => (
          <text key={yr} x={x(i)} y={H - 8} textAnchor="middle" className="fill-[#8b909a] text-[10.5px] tabular">{yr}</text>
        ))}
        {yLabel && <text x={L} y={T - 4} className="fill-[#8b909a] text-[10px]">{yLabel}</text>}
        <g clipPath={`url(#${clip})`}>
          {band && <path d={bandPath} fill={band.color} opacity={0.16} />}
          {series.map((s) => (
            <path key={s.name} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? "5 4" : undefined} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </g>
        {series.map((s) => (
          <circle key={s.name} cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r={4} fill={s.color} stroke="#fbf8f1" strokeWidth={2} />
        ))}
        {ends.map((e) => (
          <g key={e.name}>
            <text x={W - R + 8} y={e.y - 1} className="fill-[#161f2e] text-[12px] font-semibold tabular">{fmt(e.v, decimals)}{unit === "%" ? "%" : ""}</text>
            <text x={W - R + 8} y={e.y + 11} className="fill-[#5a6373] text-[10px]">{e.name}</text>
          </g>
        ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#161f2e" strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
            {series.map((s) => (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r={4} fill={s.color} stroke="#fbf8f1" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 min-w-[150px] rounded-md border border-rule bg-card px-2.5 py-2 text-[12px] shadow-float"
          style={{ left: `${(x(hover) / W) * 100}%`, top: 24, transform: `translateX(${x(hover) / W > 0.6 ? "-105%" : "8px"})` }}
        >
          <div className="mb-1 font-semibold text-ink-900 tabular">{years[hover]}</div>
          {series.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-muted"><span className="inline-block size-2 rounded-full" style={{ background: s.color }} />{s.name}</span>
              <span className="font-semibold tabular text-ink-900">{fmt(s.values[hover], decimals)}{unit === "%" ? "%" : unit && unit !== "index" && unit !== "score" ? ` ${unit}` : ""}</span>
            </div>
          ))}
          {band && (
            <div className="mt-1 border-t border-rule pt-1 text-[11px] text-muted tabular">Range {fmt(band.low[hover], decimals)}–{fmt(band.high[hover], decimals)}</div>
          )}
        </div>
      )}
    </div>
  );
}

function niceTicks(lo: number, hi: number, n: number): number[] {
  const span = hi - lo || 1;
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n + 0.5) ?? mag * 10;
  const start = Math.floor(lo / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 0.01; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

/* ------------------------------------------------------------ tornado */
export interface TornadoRow { id: string; label: string; low: number; high: number; share: number }

export function Tornado({ rows, center, decimals = 1, onSelect, highlight }: { rows: TornadoRow[]; center: number; decimals?: number; onSelect?: (id: string) => void; highlight?: string }) {
  const items = rows.slice(0, 6);
  if (!items.length) return <div className="py-6 text-center text-[13px] text-muted">No assumption moves this output for the current levers.</div>;
  const lo = Math.min(center, ...items.map((r) => Math.min(r.low, r.high)));
  const hi = Math.max(center, ...items.map((r) => Math.max(r.low, r.high)));
  const pad = (hi - lo) * 0.08 || 1;
  const scale = (v: number) => ((v - (lo - pad)) / (hi - lo + 2 * pad)) * 100;
  return (
    <div className="space-y-1.5" role="list" aria-label="Sensitivity of the projection to each assumption">
      {items.map((r) => {
        const a = scale(Math.min(r.low, r.high));
        const b = scale(Math.max(r.low, r.high));
        return (
          <button
            key={r.id}
            role="listitem"
            type="button"
            onClick={() => onSelect?.(r.id)}
            title={`${r.id} ${r.label}: ${fmt(r.low, decimals)} (low) to ${fmt(r.high, decimals)} (high) — ${(r.share * 100).toFixed(0)}% of variance`}
            className={clsx("group grid w-full grid-cols-[110px_1fr_44px] items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-paper-2", highlight === r.id && "bg-saffron-soft/60")}
          >
            <span className="truncate text-[11.5px] text-ink-800"><span className="font-mono text-inferred">{r.id}</span> {r.label.split("→")[0].trim()}</span>
            <span className="relative h-4">
              <span className="absolute inset-y-[7px] left-0 right-0 bg-paper-3" />
              <span className="absolute inset-y-0.5 rounded-[3px] bg-[#d0701a]/80 group-hover:bg-[#d0701a]" style={{ left: `${a}%`, width: `${Math.max(0.8, b - a)}%` }} />
              <span className="absolute inset-y-[-2px] w-px bg-ink-900" style={{ left: `${scale(center)}%` }} />
            </span>
            <span className="text-right text-[11px] tabular text-muted">{(r.share * 100).toFixed(0)}%</span>
          </button>
        );
      })}
      <div className="grid grid-cols-[110px_1fr_44px] gap-2 px-1 text-[10px] text-faint">
        <span />
        <span className="flex justify-between tabular"><span>{fmt(lo, decimals)}</span><span>central {fmt(center, decimals)}</span><span>{fmt(hi, decimals)}</span></span>
        <span className="text-right">share</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ bar list */
export function BarList({ items, decimals = 0, unit = "", color = SERIES.baseline, max, render }: { items: { key: string; label: ReactNode; value: number; hint?: string }[]; decimals?: number; unit?: string; color?: string; max?: number; render?: (it: { key: string; value: number }) => ReactNode }) {
  const m = max ?? Math.max(1e-9, ...items.map((i) => i.value));
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.key} className="grid grid-cols-[minmax(0,1fr)_minmax(80px,40%)_52px] items-center gap-2 text-[12.5px]" title={it.hint}>
          <span className="truncate text-ink-800">{it.label}</span>
          <span className="h-2.5 rounded-r-[3px] bg-paper-2">
            <span className="block h-full rounded-r-[3px]" style={{ width: `${Math.max(1.5, (it.value / m) * 100)}%`, background: color }} />
          </span>
          <span className="text-right tabular text-ink-900">{render ? render(it) : `${fmt(it.value, decimals)}${unit}`}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------ histogram */
export function Histogram({ values, bins = 12, ramp = RAMP_RISK, domain, marker, markerLabel, decimals = 2 }: { values: number[]; bins?: number; ramp?: string[]; domain?: [number, number]; marker?: number; markerLabel?: string; decimals?: number }) {
  const [lo, hi] = domain ?? [Math.min(...values), Math.max(...values)];
  const counts = useMemo(() => {
    const c = new Array(bins).fill(0);
    for (const v of values) c[Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo || 1)) * bins)))]++;
    return c;
  }, [values, bins, lo, hi]);
  const maxC = Math.max(...counts, 1);
  const W = 320, H = 110, gap = 2, bw = W / bins;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={`Distribution of ${values.length} districts`}>
      {counts.map((c, i) => {
        const h = (c / maxC) * (H - 6);
        const from = lo + (i / bins) * (hi - lo), to = lo + ((i + 1) / bins) * (hi - lo);
        return (
          <g key={i}>
            <title>{`${fmt(from, decimals)}–${fmt(to, decimals)}: ${c} districts`}</title>
            <rect x={i * bw + gap / 2} y={H - h} width={bw - gap} height={Math.max(h, c ? 1.5 : 0)} rx={2} fill={rampColor((i + 0.5) / bins, ramp)} />
          </g>
        );
      })}
      <line x1={0} x2={W} y1={H + 0.5} y2={H + 0.5} stroke="#c3b597" />
      {marker !== undefined && (
        <g>
          <line x1={((marker - lo) / (hi - lo)) * W} x2={((marker - lo) / (hi - lo)) * W} y1={0} y2={H} stroke="#161f2e" strokeDasharray="3 3" />
          <text x={((marker - lo) / (hi - lo)) * W + 4} y={10} className="fill-[#161f2e] text-[10px] font-semibold">{markerLabel}</text>
        </g>
      )}
      <text x={0} y={H + 14} className="fill-[#8b909a] text-[10px] tabular">{fmt(lo, decimals)}</text>
      <text x={W} y={H + 14} textAnchor="end" className="fill-[#8b909a] text-[10px] tabular">{fmt(hi, decimals)}</text>
    </svg>
  );
}

/* ------------------------------------------------------------ ramp legend */
export function RampLegend({ ramp, min, max, label, decimals = 0, unit = "" }: { ramp: string[]; min: number; max: number; label: string; decimals?: number; unit?: string }) {
  return (
    <div className="text-[11px] text-muted">
      <div className="mb-1 font-medium text-ink-800">{label}</div>
      <div className="flex h-2.5 overflow-hidden rounded-[2px]">
        {ramp.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
      </div>
      <div className="mt-0.5 flex justify-between tabular">
        <span>{fmt(min, decimals)}{unit}</span>
        <span>{fmt(max, decimals)}{unit}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ delta pill */
export function Delta({ value, goodWhenNegative, decimals = 1, suffix = "%" }: { value: number; goodWhenNegative: boolean; decimals?: number; suffix?: string }) {
  if (Math.abs(value) < 0.05) return <span className="text-[12px] text-faint tabular">±0{suffix}</span>;
  const good = goodWhenNegative ? value < 0 : value > 0;
  return (
    <span className={clsx("inline-flex items-center gap-0.5 text-[12.5px] font-semibold tabular", good ? "text-green" : "text-risk")}>
      <span aria-hidden>{value > 0 ? "▲" : "▼"}</span>
      {value > 0 ? "+" : ""}
      {fmt(value, decimals)}
      {suffix}
      <span className="sr-only">{good ? "(improvement)" : "(worsening)"}</span>
    </span>
  );
}
