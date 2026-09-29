"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import clsx from "clsx";
import { Archive, Bookmark, Columns2, FileText, FolderOpen, Lock, NotebookPen, Play, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import { evidenceById } from "@/data/evidence";
import { interventionById, outcomeById } from "@/data/taxonomy";
import { regionLabel } from "@/lib/data/regions";
import { DESIGN_LABEL, evidenceLevel } from "@/lib/evidence/strength";
import { useHydrated, useStore } from "@/lib/store";
import { can } from "@/lib/roles";
import type { Grade } from "@/lib/evidence/strength";
import { Badge, Button, DemoBadge, EmptyState, GradeBadge, LinkButton, PageHeader, Panel, TypeMark } from "@/components/ui";
import { CASE_STEPS, caseProgress } from "@/components/shell/CaseProgress";

type Tab = "investigations" | "bookmarks" | "notes" | "scenarios" | "briefs" | "compare";

export function WorkspaceView() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="mx-auto h-[60vh] max-w-[1200px] animate-pulse-soft rounded-md bg-paper-2" />;
  return <WorkspaceInner />;
}

function WorkspaceInner() {
  const router = useRouter();
  const s = useStore();
  const [tab, setTab] = useState<Tab>("investigations");
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");

  if (!can(s.role, "workspace")) {
    return (
      <div className="mx-auto max-w-[900px]">
        <PageHeader eyebrow="Research Workspace" title="Your casefiles and saved work" />
        <EmptyState title="Workspace requires a researcher or policymaker role" icon={<Lock />} action={<Button size="sm" variant="primary" onClick={() => s.setRole("researcher")}>Switch to researcher (demo)</Button>}>
          Public users can search, browse maps and dashboards, and read published briefs.
        </EmptyState>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; n: number; icon: typeof FolderOpen }[] = [
    { id: "investigations", label: "Casefiles", n: (s.current ? 1 : 0) + s.investigations.length, icon: FolderOpen },
    { id: "bookmarks", label: "Saved evidence", n: s.bookmarks.length, icon: Bookmark },
    { id: "notes", label: "Notes", n: s.notes.length, icon: NotebookPen },
    { id: "scenarios", label: "Scenarios", n: s.scenarios.length, icon: SlidersHorizontal },
    { id: "briefs", label: "Briefs", n: s.briefs.length, icon: FileText },
    { id: "compare", label: "Compare", n: s.compare.length, icon: Columns2 },
  ];

  const newQuestion = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/case?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader eyebrow="Research Workspace" title="Your casefiles and saved work" description="Casefiles, briefs, notes and saved evidence are stored in this browser." />

      <form onSubmit={newQuestion} className="panel mb-5 flex items-center gap-2 p-2">
        <Plus size={16} className="ml-2 text-saffron" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Start a casefile with a new policy question…" aria-label="New policy question" className="h-10 min-w-0 flex-1 bg-transparent text-[14.5px] placeholder:text-faint focus:outline-none" />
        <Button type="submit" variant="ink" disabled={!q.trim()}>Start casefile</Button>
      </form>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-rule">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={clsx("-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13.5px]", tab === t.id ? "border-saffron font-semibold text-ink-900" : "border-transparent text-muted hover:text-ink-900")}>
            <t.icon size={14} /> {t.label} <span className="rounded bg-paper-2 px-1.5 text-[11px] tabular text-muted">{t.n}</span>
          </button>
        ))}
      </div>

      {tab === "investigations" && (
        <div className="space-y-3">
          {!s.current && !s.investigations.length && <EmptyState title="No casefiles yet" icon={<FolderOpen />}>Ask a policy question above to open a casefile.</EmptyState>}
          {[...(s.current ? [s.current] : []), ...s.investigations].map((inv) => {
            const isCur = s.current?.id === inv.id;
            const done = caseProgress(inv);
            return (
              <Panel key={inv.id} className={clsx("p-4", isCur && "ring-1 ring-saffron/50")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">{isCur ? <Badge tone="saffron">Active</Badge> : <Badge>Archived</Badge>}<span className="text-[11.5px] text-muted">Updated {new Date(inv.updatedAt).toLocaleString("en-IN")}</span></div>
                    <h3 className="mt-1.5 font-serif text-[17px] font-semibold text-ink-900">{inv.question}</h3>
                    <div className="mt-1 text-[12.5px] text-muted">{inv.evidenceIds.length} sources · {inv.regionCode ? regionLabel(inv.regionCode) : "no geography"}{inv.briefId ? ` · brief ${inv.briefId}` : ""}</div>
                  </div>
                  <div className="flex gap-2">
                    {isCur ? (
                      <>
                        <LinkButton href="/case" size="sm" variant="ink"><Play size={13} /> Continue</LinkButton>
                        <Button size="sm" onClick={() => s.archiveCurrent()}><Archive size={13} /> Archive</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="ink" onClick={() => { s.resumeInvestigation(inv.id); router.push("/case"); }}>Resume</Button>
                        <Button size="sm" variant="ghost" onClick={() => s.deleteInvestigation(inv.id)} aria-label="Delete"><Trash2 size={13} /></Button>
                      </>
                    )}
                  </div>
                </div>
                <ol className="mt-3 flex flex-wrap gap-1.5">
                  {CASE_STEPS.map((t) => <li key={t.key}><Badge tone={done[t.key] ? "green" : "neutral"}>{done[t.key] ? "✓" : "○"} {t.label}</Badge></li>)}
                </ol>
              </Panel>
            );
          })}
        </div>
      )}

      {tab === "bookmarks" && (
        s.bookmarks.length === 0 ? <EmptyState title="No saved evidence" icon={<Bookmark />}>Use <em>Save</em> on any search result or record.</EmptyState> : (
          <div className="grid gap-3 md:grid-cols-2">
            {s.bookmarks.map((id) => {
              const e = evidenceById[id];
              if (!e) return null;
              return (
                <Panel key={id} className="p-4">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2"><TypeMark type={e.type} /><span className="font-mono text-[11px] text-faint">{e.id} · {e.year}</span></div><button onClick={() => s.toggleBookmark(id)} className="text-faint hover:text-risk" aria-label="Remove"><X size={14} /></button></div>
                  <Link href={`/evidence/${id}`} className="mt-1 block font-serif text-[15.5px] font-semibold leading-snug text-ink-900 hover:text-saffron-deep">{e.title}</Link>
                  <div className="mt-2 flex gap-2">
                    {s.current && !s.current.evidenceIds.includes(id) && <Button size="sm" onClick={() => s.attachEvidence(id)}><Plus size={12} /> Attach to investigation</Button>}
                    <Button size="sm" onClick={() => s.toggleCompare(id)}>{s.compare.includes(id) ? "✓ Comparing" : "Compare"}</Button>
                  </div>
                </Panel>
              );
            })}
          </div>
        )
      )}

      {tab === "notes" && (
        <div className="space-y-3">
          {can(s.role, "notes") && (
            <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) { s.addNote(null, note); setNote(""); } }} className="panel flex gap-2 p-3">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Write a research note…" aria-label="New note" className="flex-1 resize-y rounded border border-rule bg-card px-2.5 py-2 text-[13.5px] focus:border-ink-400 focus:outline-none" />
              <Button type="submit" variant="ink" disabled={!note.trim()}>Add</Button>
            </form>
          )}
          {s.notes.length === 0 ? <EmptyState title="No notes" icon={<NotebookPen />}>Notes added on records or in the research agenda appear here.</EmptyState> : s.notes.map((n) => (
            <Panel key={n.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                {n.targetId && evidenceById[n.targetId] && <Link href={`/evidence/${n.targetId}`} className="font-mono text-[11px] text-documented hover:underline">{n.targetId} · {evidenceById[n.targetId].title}</Link>}
                <p className="mt-0.5 whitespace-pre-wrap text-[13.5px] text-ink-800">{n.text}</p>
                <div className="mt-1 text-[11px] text-faint">{new Date(n.createdAt).toLocaleString("en-IN")}</div>
              </div>
              <button onClick={() => s.deleteNote(n.id)} className="text-faint hover:text-risk" aria-label="Delete note"><Trash2 size={14} /></button>
            </Panel>
          ))}
        </div>
      )}

      {tab === "scenarios" && (
        s.scenarios.length === 0 ? <EmptyState title="No saved scenarios" icon={<SlidersHorizontal />} action={<LinkButton href="/case" size="sm">Open casefile</LinkButton>}>Save a scenario from the Decide step of a casefile.</EmptyState> : (
          <div className="grid gap-3 md:grid-cols-2">
            {s.scenarios.map((sc) => (
              <Panel key={sc.id} className="p-4">
                <div className="flex items-center justify-between"><span className="font-serif text-[16px] font-semibold text-ink-900">{sc.name}</span><GradeBadge grade={sc.confidence as Grade | null} /></div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{sc.headline}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                  {Object.entries(sc.levers).map(([k, v]) => <Badge key={k}>{k}: {v}</Badge>)}
                </div>
                <div className="mt-3 flex gap-2">
                  {s.current && <LinkButton href="/case?step=simulate" size="sm" variant="ink" onClick={() => s.updateCurrent({ levers: sc.levers, regionCode: sc.regionCode, simulatedAt: undefined, briefId: undefined })}>Load into casefile</LinkButton>}
                  <Button size="sm" variant="ghost" onClick={() => s.deleteScenario(sc.id)} aria-label="Delete scenario"><Trash2 size={13} /></Button>
                </div>
              </Panel>
            ))}
          </div>
        )
      )}

      {tab === "briefs" && (
        s.briefs.length === 0 ? <EmptyState title="No briefs yet" icon={<FileText />} action={<LinkButton href="/case" size="sm">Open casefile</LinkButton>}>The last step of a casefile writes the brief.</EmptyState> : (
          <div className="grid gap-3 md:grid-cols-2">
            {s.briefs.map((b) => (
              <Panel key={b.id} className="p-4">
                <div className="flex items-center justify-between"><span className="font-mono text-[11px] text-muted">{b.fingerprint}</span><GradeBadge grade={b.simulation.confidence.grade as Grade | null} /></div>
                <Link href={`/brief?id=${b.id}`} className="mt-1 block font-serif text-[16px] font-semibold leading-snug text-ink-900 hover:text-saffron-deep">{b.question}</Link>
                <div className="mt-1 text-[12px] text-muted">{b.region.name} · {b.references.length} references · {new Date(b.createdAt).toLocaleDateString("en-IN")}</div>
                <div className="mt-3 flex gap-2"><LinkButton href={`/brief?id=${b.id}`} size="sm" variant="ink">Open</LinkButton><Button size="sm" variant="ghost" onClick={() => s.deleteBrief(b.id)} aria-label="Delete brief"><Trash2 size={13} /></Button></div>
              </Panel>
            ))}
          </div>
        )
      )}

      {tab === "compare" && (
        s.compare.length < 2 ? <EmptyState title="Select two or three records to compare" icon={<Columns2 />}>Use <em>Compare</em> on search results or saved evidence.</EmptyState> : (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-rule">
                  <th className="w-[150px] px-4 py-3" />
                  {s.compare.map((id) => (
                    <th key={id} className="px-4 py-3 text-left align-top font-normal">
                      <div className="flex items-center justify-between"><TypeMark type={evidenceById[id].type} /><button onClick={() => s.toggleCompare(id)} className="text-faint hover:text-risk" aria-label="Remove"><X size={13} /></button></div>
                      <Link href={`/evidence/${id}`} className="mt-1 block font-serif text-[15px] font-semibold leading-snug text-ink-900 hover:text-saffron-deep">{evidenceById[id].title}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Source", (id: string) => evidenceById[id].source],
                  ["Year", (id: string) => String(evidenceById[id].year)],
                  ["Design", (id: string) => `${DESIGN_LABEL[evidenceById[id].design]} (${evidenceLevel(evidenceById[id].design).level})`],
                  ["Sample", (id: string) => evidenceById[id].sample ?? "—"],
                  ["Geography", (id: string) => `${evidenceById[id].geography.scope}: ${evidenceById[id].geography.regions.slice(0, 4).join(", ")}`],
                  ["Findings", (id: string) => evidenceById[id].findings.map((f) => `${interventionById[f.intervention].short} → ${outcomeById[f.outcome].short}: ${f.direction}${f.effect ? ` (${f.effect.value}${f.effect.unit === "%" ? "%" : " " + f.effect.unit})` : ""}`).join("\n") || "—"],
                  ["Provenance", (id: string) => (evidenceById[id].provenance === "synthetic" ? "Demonstration record" : "Reference")],
                ].map(([label, fn]) => (
                  <tr key={label as string} className="border-b border-rule/60 align-top">
                    <th className="px-4 py-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-muted">{label as string}</th>
                    {s.compare.map((id) => <td key={id} className="whitespace-pre-line px-4 py-2.5 text-ink-800">{(fn as (id: string) => string)(id)}{label === "Provenance" && evidenceById[id].provenance === "synthetic" ? <> <DemoBadge /></> : null}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2"><Button size="sm" variant="ghost" onClick={() => s.clearCompare()}>Clear comparison</Button></div>
          </Panel>
        )
      )}
    </div>
  );
}
