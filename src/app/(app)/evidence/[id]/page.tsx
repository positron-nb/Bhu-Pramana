import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ScrollText } from "lucide-react";
import { ASSUMPTIONS } from "@/data/assumptions";
import { EVIDENCE, evidenceById } from "@/data/evidence";
import { conceptById } from "@/data/concepts";
import { indicatorById } from "@/data/indicators";
import { interventionById, outcomeById } from "@/data/taxonomy";
import { regionByCode } from "@/lib/data/regions";
import { DESIGN_LABEL, DESIGN_WEIGHT, evidenceLevel, recency } from "@/lib/evidence/strength";
import { similarTo } from "@/lib/search/engine";
import { Badge, DemoBadge, LinkButton, Panel, PanelHeader, PramanaTag, ReferenceBadge, TYPE_META, TypeMark } from "@/components/ui";
import { EvidenceActions } from "@/components/evidence/EvidenceActions";
import { EvidenceNotes } from "./EvidenceNotes";

export function generateStaticParams() {
  return EVIDENCE.map((e) => ({ id: e.id }));
}

export async function generateMetadata(props: PageProps<"/evidence/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const e = evidenceById[id];
  return { title: e ? `${e.id} · ${e.title}` : "Evidence" };
}

export default async function EvidencePage(props: PageProps<"/evidence/[id]">) {
  const { id } = await props.params;
  const e = evidenceById[id];
  if (!e) notFound();
  const lvl = evidenceLevel(e.design);
  const related = e.related.map((r) => evidenceById[r]).filter(Boolean);
  const citedBy = EVIDENCE.filter((x) => x.related.includes(e.id) || x.datasets.includes(e.id));
  const datasets = e.datasets.map((d) => evidenceById[d]).filter(Boolean);
  const calibrates = ASSUMPTIONS.filter((a) => a.supporting.includes(e.id));
  const contradicts = ASSUMPTIONS.filter((a) => a.contradicting.includes(e.id));
  const similar = similarTo(e.id, 5).map((s) => ({ ...s, e: evidenceById[s.id] }));
  const f0 = e.findings[0];
  const lc = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
  const caseQ = f0 ? `What does the evidence say about ${lc(interventionById[f0.intervention].label)} and ${lc(outcomeById[f0.outcome].label)}?` : null;
  const geo = e.geography.regions.map((r) => regionByCode[r]).filter(Boolean);

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-3 text-[12.5px] text-muted">
        <Link href="/search" className="hover:text-ink-900">Evidence</Link> <span className="text-faint">/</span> {TYPE_META[e.type].plural} <span className="text-faint">/</span> <span className="font-mono">{e.id}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Panel className="p-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <TypeMark type={e.type} />
              <span className="font-mono text-[12px] text-faint">{e.id}</span>
              <Badge title={lvl.label}>{lvl.level} · {lvl.label}</Badge>
              {e.provenance === "synthetic" ? <DemoBadge /> : <ReferenceBadge />}
              <PramanaTag p={TYPE_META[e.type].pramana} />
            </div>
            <h1 className="mt-3 font-serif text-[28px] font-semibold leading-[1.15] text-ink-900">{e.title}</h1>
            <div className="mt-2 text-[13.5px] text-muted">
              {e.source}{e.authors?.length ? ` · ${e.authors.join(", ")}` : ""} · {e.year}
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-800">{e.summary}</p>
            {e.provenance === "synthetic" ? (
              <p className="mt-3 rounded border border-[#b88a12]/30 bg-[#f7efd2] px-3 py-2 text-[12.5px] text-[#6d520a]">Demonstration record: authors, institution and findings are illustrative, created to demonstrate the platform. Not a published study.</p>
            ) : (
              <p className="mt-3 rounded border border-green/25 bg-green-soft/60 px-3 py-2 text-[12.5px] text-green-deep">Reference record: a real public document, programme or portal. The platform stores descriptive metadata and the official link only.</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <EvidenceActions id={e.id} />
              {e.url && (
                <a href={e.url} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-[4px] border border-rule bg-card px-2 text-[12px] font-medium text-ink-800 hover:border-ink-400">
                  Official source <ArrowUpRight size={13} />
                </a>
              )}
              {caseQ && <LinkButton href={`/case?q=${encodeURIComponent(caseQ)}`} size="sm" variant="ink"><ScrollText size={13} /> Open as a policy casefile</LinkButton>}
            </div>
          </Panel>

          {e.findings.length > 0 && (
            <Panel>
              <PanelHeader eyebrow="Structured findings" title="What this evidence reports" />
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-rule text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-2 font-medium">Intervention → outcome</th>
                    <th className="px-2 py-2 font-medium">Direction</th>
                    <th className="px-2 py-2 font-medium">Effect</th>
                    <th className="px-4 py-2 font-medium">Statement</th>
                  </tr>
                </thead>
                <tbody>
                  {e.findings.map((f) => (
                    <tr key={f.id} className="border-b border-rule/60 align-top">
                      <td className="px-4 py-2.5"><span className="font-medium text-ink-900">{interventionById[f.intervention].short}</span> → {outcomeById[f.outcome].short}</td>
                      <td className="px-2 py-2.5"><Badge tone={f.direction === "decrease" ? "observed" : f.direction === "increase" ? "saffron" : "amber"}>{f.direction}</Badge></td>
                      <td className="px-2 py-2.5 font-mono text-[12px] tabular">{f.effect ? `${f.effect.value > 0 ? "+" : ""}${f.effect.value}${f.effect.unit === "%" ? "%" : ` ${f.effect.unit}`}${f.effect.low !== undefined ? ` [${f.effect.low}, ${f.effect.high}]` : ""}` : "—"}<div className="font-sans text-[11px] text-faint">{f.effect?.per}</div></td>
                      <td className="px-4 py-2.5 text-ink-800">{f.statement}{f.context && <div className="text-[11.5px] text-muted">Context: {f.context}</div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}


          <EvidenceNotes id={e.id} />
        </div>

        <aside className="space-y-4">
          <Panel>
            <PanelHeader eyebrow="Metadata" title="Record" />
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 p-4 text-[12.5px]">
              <dt className="text-muted">Type</dt><dd>{TYPE_META[e.type].label}</dd>
              <dt className="text-muted">Design</dt><dd>{DESIGN_LABEL[e.design]}</dd>
              {e.sample && <><dt className="text-muted">Sample</dt><dd>{e.sample}</dd></>}
              <dt className="text-muted">Geography</dt><dd>{e.geography.scope}{geo.length ? ` · ${geo.map((g) => g.name).join(", ")}` : ""}</dd>
              <dt className="text-muted">Licence</dt><dd>{e.license ?? "—"}</dd>
              <dt className="text-muted">Evidence weight</dt><dd className="tabular">{DESIGN_WEIGHT[e.design].toFixed(2)} design × {recency(e.year).toFixed(2)} recency <span className="text-faint">× geographic relevance</span></dd>
              {e.distribution && (
                <>
                  <dt className="text-muted">Formats</dt><dd>{e.distribution.format.join(", ")}</dd>
                  <dt className="text-muted">Coverage</dt><dd>{e.distribution.coverage}</dd>
                  <dt className="text-muted">Cadence</dt><dd>{e.distribution.cadence}</dd>
                </>
              )}
            </dl>
            <div className="border-t border-rule px-4 py-3">
              <div className="label-caps mb-1.5 text-muted">Concepts</div>
              <div className="flex flex-wrap gap-1">{e.concepts.map((c) => <Link key={c} href={`/search?q=${encodeURIComponent(conceptById[c]?.label ?? c)}`}><Badge tone="documented">{conceptById[c]?.label ?? c}</Badge></Link>)}</div>
              <div className="mt-2 flex flex-wrap gap-1">{e.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
            </div>
            {e.indicators.length > 0 && (
              <div className="border-t border-rule px-4 py-3">
                <div className="label-caps mb-1.5 text-muted">Indicators</div>
                <ul className="space-y-1 text-[12.5px]">{e.indicators.map((i) => <li key={i}><Link className="text-observed hover:underline" href={`/atlas?layer=${i}`}>{indicatorById[i as keyof typeof indicatorById]?.label ?? i}</Link></li>)}</ul>
              </div>
            )}
          </Panel>

          {(calibrates.length > 0 || contradicts.length > 0) && (
            <Panel>
              <PanelHeader eyebrow="Anumāna" title="Model assumptions it informs" />
              <ul className="space-y-1.5 p-4 text-[12.5px]">
                {calibrates.map((a) => <li key={a.id}><Link href={`/agenda?focus=${a.id}#assumptions`} className="hover:underline"><Badge tone="green">calibrates</Badge> <span className="font-mono text-inferred">{a.id}</span> {a.label}</Link></li>)}
                {contradicts.map((a) => <li key={a.id}><Link href={`/agenda?focus=${a.id}#assumptions`} className="hover:underline"><Badge tone="risk">contradicts</Badge> <span className="font-mono text-inferred">{a.id}</span> {a.label}</Link></li>)}
              </ul>
            </Panel>
          )}

          {[{ title: "Links to", items: [...related, ...datasets] }, { title: "Cited by", items: citedBy }, { title: "Similar records", items: similar.map((s) => s.e) }].map((g) =>
            g.items.length ? (
              <Panel key={g.title}>
                <PanelHeader title={g.title} />
                <ul className="space-y-1 p-3">
                  {g.items.slice(0, 8).map((x) => (
                    <li key={x.id}>
                      <Link href={`/evidence/${x.id}`} className="block rounded px-1.5 py-1 hover:bg-paper-2">
                        <div className="flex items-center gap-2"><TypeMark type={x.type} showLabel={false} /><span className="font-mono text-[10.5px] text-faint">{x.id} · {x.year}</span></div>
                        <div className="text-[12.5px] leading-snug text-ink-800">{x.title}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null,
          )}
        </aside>
      </div>
    </div>
  );
}
