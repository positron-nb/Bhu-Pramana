"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import clsx from "clsx";
import { AlertTriangle, ArrowRight, Filter, ScrollText, Search, X } from "lucide-react";
import { evidenceById } from "@/data/evidence";
import type { EvidenceType } from "@/lib/domain/schemas";
import type { SearchResponse } from "@/lib/search/engine";
import { regionByCode, regionLabel } from "@/lib/data/regions";
import { evidenceLevel } from "@/lib/evidence/strength";
import { Badge, Button, DemoBadge, EmptyState, LinkButton, Meter, PageHeader, Panel, PanelHeader, ReferenceBadge, Skeleton, TYPE_META, TypeMark } from "@/components/ui";
import { EvidenceActions } from "@/components/evidence/EvidenceActions";

const EXAMPLES = ["urban land disputes", "climate vulnerable land", "peri-urban expansion", "land digitization", "land use change", "rural infrastructure", "land acquisition delays", "khatauni errors UP"];

type Hit = SearchResponse["hits"][number];

export function SearchView() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const [input, setInput] = useState(q);
  const [inputFor, setInputFor] = useState(q);
  const [types, setTypes] = useState<EvidenceType[]>([]);
  const [state, setState] = useState<string>("");
  const [prov, setProv] = useState<"" | "reference" | "synthetic">("");

  // keep the box in sync when the URL query changes (adjusting state during render)
  if (inputFor !== q) {
    setInputFor(q);
    setInput(q);
  }

  // ranked results — loading/error are derived from which request key has completed
  const searchKey = useMemo(() => {
    const sp = new URLSearchParams({ q, limit: "40" });
    if (types.length) sp.set("type", types.join(","));
    if (state) sp.set("state", state);
    if (prov) sp.set("provenance", prov);
    return sp.toString();
  }, [q, types, state, prov]);
  const [result, setResult] = useState<{ key: string; res?: SearchResponse; error?: string } | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/v1/search?${searchKey}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Search failed (${r.status})`))))
      .then((d) => setResult({ key: searchKey, res: d }))
      .catch((e) => e.name !== "AbortError" && setResult({ key: searchKey, error: e.message }));
    return () => ctrl.abort();
  }, [searchKey]);
  const loading = result?.key !== searchKey;
  const res = result?.res ?? null;
  const error = !loading ? result?.error ?? null : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  const toggleType = (t: EvidenceType) => setTypes((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));
  const u = res?.understanding;
  const questionLike = q.trim().split(/\s+/).length >= 4;

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHeader
        eyebrow="Evidence Library"
        title="Search India's land governance evidence"
        description="One search across research, laws, policies, datasets, case studies and reports. Ranking combines word matching with a land-governance concept vocabulary, so related ideas are found even when the wording differs."
      />

      <form onSubmit={submit} role="search" className="panel flex items-center gap-2 p-2">
        <Search size={18} className="ml-2 shrink-0 text-ink-400" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search a topic, place or term — e.g. peri-urban land disputes, khatauni, Pune"
          aria-label="Search query"
          className="h-11 min-w-0 flex-1 bg-transparent text-[16px] placeholder:text-faint focus:outline-none"
        />
        {input && (
          <button type="button" onClick={() => setInput("")} className="rounded p-1 text-faint hover:text-ink-700" aria-label="Clear">
            <X size={16} />
          </button>
        )}
        <Button type="submit" variant="ink" size="lg">Search</Button>
      </form>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="label-caps mr-1 text-faint">Try</span>
        {EXAMPLES.map((ex) => (
          <Link key={ex} href={`/search?q=${encodeURIComponent(ex)}`} className="rounded-full border border-rule bg-card px-2.5 py-0.5 text-[12.5px] text-ink-700 transition-colors hover:border-ink-400 hover:text-ink-900">
            {ex}
          </Link>
        ))}
      </div>

      {u && q && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-rule bg-paper-2/60 px-3 py-2 text-[12.5px]">
          <span className="label-caps text-muted">Query understanding</span>
          {u.concepts.filter((c) => c.via === "direct").map((c) => (
            <Badge key={c.id} tone="documented" title={`Matched “${c.matched}”`}>{c.label}</Badge>
          ))}
          {u.concepts.filter((c) => c.via !== "direct").slice(0, 5).map((c) => (
            <Badge key={c.id} title={`Expanded via ${c.via} concept (weight ${c.weight})`}>+ {c.label}</Badge>
          ))}
          {u.regions.map((r) => <Badge key={r.code} tone="observed">⌖ {regionLabel(r.code)}</Badge>)}
          {u.yearFrom && <Badge>from {u.yearFrom}</Badge>}
          <span className="ml-auto text-muted tabular">Hybrid lexical + concept retrieval · {res?.total ?? 0} matches · {res?.tookMs ?? 0} ms</span>
        </div>
      )}

      {questionLike && (
        <Link href={`/case?q=${encodeURIComponent(q)}`} className="group mt-4 flex items-center justify-between gap-4 rounded-md border border-saffron/40 bg-saffron-soft/40 px-4 py-3 transition-colors hover:border-saffron">
          <span className="flex items-center gap-3">
            <ScrollText size={18} className="shrink-0 text-saffron-deep" />
            <span>
              <span className="block text-[14px] font-semibold text-ink-900">Turn this question into a policy casefile</span>
              <span className="block text-[12.5px] text-muted">Cited evidence, where it matters, a simulated decision and a traceable brief.</span>
            </span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-saffron-deep transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-serif text-[18px] font-semibold text-ink-900">{q ? `Results for “${q}”` : "Browse the repository"}</h2>
            <span className="text-[12px] text-muted tabular">{res ? `${res.hits.length} of ${res.total}` : ""}</span>
          </div>
          {error && <EmptyState title="Search is unavailable" icon={<AlertTriangle />}>{error}. The offline index is bundled — try reloading the page.</EmptyState>}
          {loading && !res && <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>}
          {res && !res.hits.length && !loading && (
            <EmptyState title="No matching evidence" icon={<Search />} action={<LinkButton href="/search" size="sm">Clear search</LinkButton>}>
              Try broader terms, remove filters, or use a vernacular term such as “khatauni”, “7/12”, “dakhil kharij” — the concept vocabulary understands them.
            </EmptyState>
          )}
          <ul className={clsx("space-y-2.5", loading && "opacity-60 transition-opacity")}>
            {res?.hits.map((h, i) => <ResultCard key={h.id} hit={h} rank={i + 1} maxScore={res.hits[0]?.score ?? 1} />)}
          </ul>
        </div>

        <aside className="space-y-4">
          <Panel>
            <PanelHeader title="Refine" eyebrow="Facets" right={<Filter size={14} className="text-faint" />} />
            <div className="space-y-4 p-4 text-[13px]">
              <div>
                <div className="label-caps mb-1.5 text-muted">Evidence type</div>
                <div className="space-y-1">
                  {(Object.keys(TYPE_META) as EvidenceType[]).map((t) => (
                    <label key={t} className="flex cursor-pointer items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-paper-2">
                      <span className="flex items-center gap-2">
                        <input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} className="accent-[var(--color-saffron)]" />
                        <TypeMark type={t} />
                      </span>
                      <span className="text-[11.5px] text-faint tabular">{res?.facets.type[t] ?? 0}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-caps mb-1.5 block text-muted" htmlFor="facet-state">Geography</label>
                <select id="facet-state" value={state} onChange={(e) => setState(e.target.value)} className="h-8 w-full rounded border border-rule bg-card px-2 text-[13px]">
                  <option value="">All India</option>
                  {Object.entries(res?.facets.state ?? {}).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
                    <option key={c} value={c}>{regionByCode[c]?.name ?? c} ({n})</option>
                  ))}
                  {state && !res?.facets.state[state] && <option value={state}>{regionByCode[state]?.name ?? state}</option>}
                </select>
              </div>
              <div>
                <div className="label-caps mb-1.5 text-muted">Provenance</div>
                <div className="flex gap-1">
                  {([["", "All"], ["reference", "Reference"], ["synthetic", "Demo"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setProv(v)} className={clsx("flex-1 rounded border px-2 py-1 text-[12px]", prov === v ? "border-ink-700 bg-ink-900 text-paper" : "border-rule bg-card text-ink-700 hover:border-ink-400")}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="label-caps mb-1.5 text-muted">Evidence level</div>
                <div className="flex flex-wrap gap-1">{Object.entries(res?.facets.level ?? {}).sort().map(([l, n]) => <Badge key={l}>{l} · {n}</Badge>)}</div>
                <p className="mt-1.5 text-[11px] leading-snug text-faint">L1 synthesis · L2 causal design · L3 longitudinal · L4 associational · L5 descriptive · N normative/official</p>
              </div>
              {(types.length > 0 || state || prov) && <Button size="sm" variant="ghost" onClick={() => { setTypes([]); setState(""); setProv(""); }}>Clear filters</Button>}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function ResultCard({ hit, rank, maxScore }: { hit: Hit; rank: number; maxScore: number }) {
  const e = evidenceById[hit.id];
  if (!e) return null;
  const lvl = evidenceLevel(e.design);
  const geo = e.geography.scope === "national" ? "National" : e.geography.regions.slice(0, 3).map((r) => regionByCode[r]?.name ?? r).join(", ");
  return (
    <li className="panel group animate-fade-up p-4 transition-colors hover:border-rule-strong" style={{ animationDelay: `${Math.min(rank, 10) * 25}ms` }}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-muted">
        <TypeMark type={e.type} />
        <span className="font-mono text-[11px] text-faint">{e.id}</span>
        <span>·</span>
        <span className="tabular">{e.year}</span>
        <span>·</span>
        <span className="truncate">{geo}</span>
        <Badge title={lvl.label}>{lvl.level}</Badge>
        {e.provenance === "synthetic" ? <DemoBadge /> : <ReferenceBadge />}
        <span className="ml-auto flex items-center gap-2" title={`Relevance ${hit.score} = 0.5·lexical ${hit.components.lexical} + 0.35·concept ${hit.components.concept} + 0.1·geo ${hit.components.geo} + 0.05·quality ${hit.components.quality}`}>
          <span className="label-caps text-faint">Relevance</span>
          <Meter value={hit.score} max={maxScore} className="w-16" tone="ink" />
        </span>
      </div>
      <Link href={`/evidence/${e.id}`} className="mt-1.5 block font-serif text-[17px] font-semibold leading-snug text-ink-900 hover:text-saffron-deep">{e.title}</Link>
      <div className="mt-0.5 text-[12px] text-muted">{e.source}{e.authors?.length ? ` · ${e.authors.join(", ")}` : ""}</div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-800">
        <span className="mr-1.5 inline-flex items-center rounded-[3px] bg-inferred-soft px-1 text-[10px] font-semibold uppercase tracking-wide text-inferred" title="Extracted from the record's structured findings — not free-generated text">Auto-summary</span>
        {hit.explanation}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
          {hit.matchedConcepts.map((c) => <Badge key={c} tone="documented">{c}</Badge>)}
          {hit.geoMatch && hit.geoMatch !== "National" && <Badge tone="observed">⌖ {hit.geoMatch}</Badge>}
          {!hit.matchedConcepts.length && hit.matchedTerms.slice(0, 4).map((t) => <Badge key={t}>“{t}”</Badge>)}
        </div>
        <EvidenceActions id={e.id} compact />
      </div>
    </li>
  );
}
