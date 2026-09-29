"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { ChainEdge, ChainNode } from "@/lib/sim/chain";

const NODE_H = 48;
const GAP = 10;
const TOP = 30;
const COLS = [
  { title: "Evidence", note: "studies & baseline data" },
  { title: "Model assumptions", note: "graded for this place" },
  { title: "Projected outcomes", note: "status quo → scenario" },
];

const GRADE_COLOR: Record<string, string> = { High: "#27744f", Moderate: "#b88a12", Low: "#c96f16", "Very low": "#ae3f2a" };

/**
 * The traceable "why this number" chain. Hover a node to follow everything it
 * rests on and everything it drives; click to inspect.
 */
export function EvidenceChain({ nodes, edges, selected, onSelect }: { nodes: ChainNode[]; edges: ChainEdge[]; selected: string | null; onSelect: (id: string) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(560, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const colX = [0, width * 0.39, width * 0.69];

  const { pos, H } = useMemo(() => {
    const x = [0, width * 0.39, width * 0.69];
    const w = [width * 0.33, width * 0.26, width * 0.31];
    const rows = [0, 1, 2].map((c) => nodes.filter((n) => n.col === c));
    const height = TOP + Math.max(...rows.map((r) => r.length)) * (NODE_H + GAP) + 6;
    const m = new Map<string, { x: number; y: number; w: number }>();
    rows.forEach((list, c) => {
      const colH = list.length * (NODE_H + GAP) - GAP;
      const y0 = TOP + (height - TOP - 6 - colH) / 2;
      list.forEach((n, i) => m.set(n.id, { x: x[c], y: y0 + i * (NODE_H + GAP), w: w[c] }));
    });
    return { pos: m, H: height };
  }, [nodes, width]);

  const active = hover ?? selected;
  const lit = useMemo(() => {
    if (!active) return null;
    const ns = new Set([active]);
    const es = new Set<number>();
    for (const dir of ["up", "down"] as const) {
      const q = [active];
      const seen = new Set(q);
      while (q.length) {
        const id = q.shift()!;
        edges.forEach((e, i) => {
          const next = dir === "down" ? (e.from === id ? e.to : null) : e.to === id ? e.from : null;
          if (!next) return;
          es.add(i);
          ns.add(next);
          if (!seen.has(next)) { seen.add(next); q.push(next); }
        });
      }
    }
    return { ns, es };
  }, [active, edges]);

  if (!nodes.length) return <div className="py-8 text-center text-[13px] text-muted">Move a policy lever to see the evidence chain behind the result.</div>;

  return (
    <div ref={wrap} className="w-full overflow-x-auto">
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} className="block" role="img" aria-label="Evidence chain: studies to model assumptions to projected outcomes">
        {COLS.map((c, i) => (
          <text key={c.title} x={colX[i]} y={14} className="fill-[#5a6373] text-[10.5px] font-semibold uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
            {c.title} <tspan className="fill-[#8b909a] font-normal normal-case tracking-normal" style={{ fontFamily: "var(--font-sans)" }}>· {c.note}</tspan>
          </text>
        ))}
        {edges.map((e, i) => {
          const a = pos.get(e.from), b = pos.get(e.to);
          if (!a || !b) return null;
          const x1 = a.x + a.w, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2;
          const dx = (x2 - x1) * 0.5;
          const on = lit ? lit.es.has(i) : false;
          const stroke = e.kind === "contradicts" ? "#ae3f2a" : e.kind === "supports" ? "#27744f" : e.kind === "drives" ? "#c96f16" : "#226d86";
          const w = e.kind === "drives" ? 1 + e.weight * 6 : e.kind === "baseline" ? 1 : 1.4;
          return (
            <path
              key={i}
              d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`}
              fill="none"
              stroke={stroke}
              strokeWidth={on ? w + 0.8 : w}
              strokeDasharray={e.kind === "contradicts" ? "5 3" : e.kind === "baseline" ? "2 4" : undefined}
              opacity={lit ? (on ? 0.95 : 0.07) : e.kind === "baseline" ? 0.35 : 0.55}
              className="transition-opacity duration-200"
            >
              <title>{e.kind === "drives" ? `${e.from} drives ${Math.round(e.weight * 100)}% of the uncertainty in this outcome` : `${e.from} ${e.kind} ${e.to}`}</title>
            </path>
          );
        })}
        {nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const dim = lit && !lit.ns.has(n.id);
          const sel = selected === n.id;
          const accent = n.kind === "outcome" ? (n.improves ? "#27744f" : n.improves === false ? "#ae3f2a" : "#8b909a") : n.kind === "assumption" ? GRADE_COLOR[n.grade ?? "Moderate"] : n.kind === "dataset" ? "#226d86" : n.contradicts ? "#ae3f2a" : "#3b4a8a";
          return (
            <g
              key={n.id}
              transform={`translate(${p.x},${p.y})`}
              opacity={dim ? 0.28 : 1}
              className="cursor-pointer"
              style={{ transition: "opacity 200ms" }}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(n.id)}
              onBlur={() => setHover(null)}
              onClick={() => onSelect(n.id)}
              onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(n.id); } }}
              role="button"
              tabIndex={0}
              aria-label={`${n.label}. ${n.sub}`}
            >
              <rect width={p.w} height={NODE_H} rx={5} fill={n.contradicts ? "#fbf1ee" : "#fbf8f1"} stroke={sel ? "#c96f16" : n.contradicts ? "#ae3f2a" : "#c3b597"} strokeWidth={sel ? 2.2 : 1} strokeDasharray={n.contradicts && !sel ? "4 2" : undefined} />
              <rect width={4} height={NODE_H} rx={2} fill={accent} />
              <foreignObject x={10} y={4} width={p.w - 16} height={NODE_H - 8}>
                <div className="flex h-full flex-col justify-center leading-[1.15]">
                  <div className="flex items-center gap-1.5">
                    <span className="line-clamp-1 text-[12px] font-semibold text-ink-900">{n.label}</span>
                    {n.local && <span className="shrink-0 rounded-[2px] bg-observed px-1 text-[9px] font-bold uppercase tracking-wide text-white">local</span>}
                    {n.contradicts && <span className="shrink-0 rounded-[2px] bg-risk px-1 text-[9px] font-bold uppercase tracking-wide text-white">contradicts</span>}
                  </div>
                  <div className={clsx("mt-0.5 flex items-center gap-1.5 truncate font-mono text-[10px] text-muted")}>
                    <span className="truncate">{n.sub}</span>
                    {n.kind === "outcome" && n.delta !== undefined && (
                      <span className={clsx("shrink-0 font-sans text-[11px] font-semibold", n.improves ? "text-green" : n.improves === false ? "text-risk" : "text-faint")}>
                        {n.delta > 0 ? "+" : ""}{n.delta.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <Legend color="#27744f" label="supports" />
        <Legend color="#ae3f2a" label="contradicts" dash="5 3" />
        <Legend color="#c96f16" label="drives outcome (width = share of uncertainty)" thick />
        <Legend color="#226d86" label="baseline data" dash="2 4" />
      </div>
    </div>
  );
}

function Legend({ color, label, dash, thick }: { color: string; label: string; dash?: string; thick?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="22" height="8" aria-hidden><line x1="0" y1="4" x2="22" y2="4" stroke={color} strokeWidth={thick ? 4 : 2} strokeDasharray={dash} /></svg>
      {label}
    </span>
  );
}
