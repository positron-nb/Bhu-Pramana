"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Check, Database, Lock, ShieldCheck, X } from "lucide-react";
import { EVIDENCE } from "@/data/evidence";
import { ROLES } from "@/lib/domain/schemas";
import { useHydrated, useStore } from "@/lib/store";
import { ALL_PERMISSIONS, can, ROLE_META } from "@/lib/roles";
import { Badge, Button, DemoBadge, EmptyState, PageHeader, Panel, PanelHeader, ReferenceBadge, TYPE_META, TypeMark } from "@/components/ui";
import { usePlatformStatus } from "@/components/shell/usePlatformStatus";

const QUEUE = [
  { id: "SUB-101", title: "District land-record accuracy audit, Bundelkhand (2025)", type: "dataset", submitter: "State Remote Sensing Centre (demo)", licence: "CC BY 4.0", checks: { metadata: true, licence: true, geography: true, pii: true } },
  { id: "SUB-102", title: "Evaluation of revenue court e-filing in three Odisha districts", type: "research", submitter: "University research group (demo)", licence: "CC BY-NC 4.0", checks: { metadata: true, licence: true, geography: true, pii: true } },
  { id: "SUB-103", title: "Village-level land conflict register, Assam floodplains", type: "dataset", submitter: "Civil society network (demo)", licence: "Unspecified", checks: { metadata: true, licence: false, geography: true, pii: false } },
  { id: "SUB-104", title: "Case note: consent-based land pooling, Nagpur fringe", type: "case-study", submitter: "Planning authority (demo)", licence: "Government Open Data License", checks: { metadata: false, licence: true, geography: true, pii: true } },
];

export function AdminView() {
  const hydrated = useHydrated();
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const curation = useStore((s) => s.curation);
  const setCuration = useStore((s) => s.setCuration);
  const status = usePlatformStatus();
  const [prov, setProv] = useState<"all" | "reference" | "synthetic">("all");
  const counts = useMemo(() => {
    const m: Record<string, { reference: number; synthetic: number }> = {};
    for (const e of EVIDENCE) { m[e.type] ??= { reference: 0, synthetic: 0 }; m[e.type][e.provenance]++; }
    return m;
  }, []);

  if (!hydrated) return <div className="mx-auto h-[60vh] max-w-[1300px] animate-pulse-soft rounded-md bg-paper-2" />;
  if (!can(role, "admin")) {
    return (
      <div className="mx-auto max-w-[900px]">
        <PageHeader eyebrow="Data Stewardship" title="Provenance, curation and platform health" />
        <EmptyState title="Administrator access required" icon={<Lock />} action={<Button size="sm" variant="primary" onClick={() => setRole("admin")}>Switch to administrator (demo)</Button>}>
          The API enforces the same rule: admin endpoints return 403 for other roles.
        </EmptyState>
      </div>
    );
  }

  const rows = EVIDENCE.filter((e) => prov === "all" || e.provenance === prov);

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader eyebrow="Data Stewardship" title="Provenance, curation and platform health" description="Every record declares where it comes from and under which licence. Demonstration records are flagged everywhere they appear; reference records carry an official link and no copied values." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader eyebrow="Platform" title="Mode & providers" right={<ShieldCheck size={15} className="text-green" />} />
          <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 p-4 text-[12.5px]">
            <dt className="text-muted">Mode</dt><dd><Badge tone={status?.mode === "llm-assisted" ? "green" : "saffron"}>{status?.mode ?? "…"}</Badge></dd>
            <dt className="text-muted">Data</dt><dd>{status?.data ?? "…"}</dd>
            <dt className="text-muted">Retrieval</dt><dd>{status?.retrieval ?? "…"}</dd>
            <dt className="text-muted">LLM</dt><dd>{status ? (status.llm === "none" ? "None — deterministic synthesis" : `${status.llm} · ${status.model}`) : "…"}</dd>
            <dt className="text-muted">Simulation</dt><dd>{status?.simulation ?? "…"}</dd>
            <dt className="text-muted">Records</dt><dd className="tabular">{status ? `${status.counts.evidence} evidence · ${status.counts.regions} regions · ${status.counts.assumptions} assumptions` : "…"}</dd>
          </dl>
          <div className="border-t border-rule px-4 py-3 text-[12px] text-muted">The only optional provider is an LLM that rephrases syntheses (citations validated). Set it in <code className="font-mono">.env.local</code> — see <code className="font-mono">.env.example</code>.</div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Provenance" title="Repository composition" right={<Database size={15} className="text-observed" />} />
          <table className="w-full text-[12.5px]">
            <thead><tr className="border-b border-rule text-left text-[11px] text-muted"><th className="px-4 py-2 font-medium">Type</th><th className="px-2 py-2 text-right font-medium">Reference</th><th className="px-4 py-2 text-right font-medium">Demo</th></tr></thead>
            <tbody>
              {Object.entries(counts).map(([t, c]) => (
                <tr key={t} className="border-b border-rule/60"><td className="px-4 py-1.5"><TypeMark type={t as keyof typeof TYPE_META} /></td><td className="px-2 py-1.5 text-right tabular">{c.reference}</td><td className="px-4 py-1.5 text-right tabular">{c.synthetic}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-[12px] text-muted">Reference records: real Acts, programmes and portals (metadata + link). Demo records: illustrative studies, datasets and cases.</p>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Access control" title="Roles & permissions" />
          <div className="overflow-x-auto p-3">
            <table className="w-full text-[11.5px]">
              <thead><tr><th />{ROLES.map((r) => <th key={r} className="px-1 pb-1 text-center font-medium text-muted">{ROLE_META[r].label.split(" ")[0]}</th>)}</tr></thead>
              <tbody>
                {ALL_PERMISSIONS.map((p) => (
                  <tr key={p.id} className="border-t border-rule/60">
                    <td className="py-1 pr-2 text-ink-800">{p.label}</td>
                    {ROLES.map((r) => <td key={r} className="text-center">{can(r, p.id) ? <Check size={13} className="inline text-green" /> : <span className="text-faint">·</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader eyebrow="Curation queue" title="Submissions awaiting review" right={<span className="text-[12px] text-muted">{QUEUE.filter((q) => !curation[q.id]).length} pending</span>} />
        <div className="divide-y divide-rule/70">
          {QUEUE.map((q) => {
            const decided = curation[q.id];
            const ok = Object.values(q.checks).every(Boolean);
            return (
              <div key={q.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] text-faint">{q.id}</span><TypeMark type={q.type as keyof typeof TYPE_META} /><Badge>{q.licence}</Badge></div>
                  <div className="mt-0.5 text-[13.5px] font-medium text-ink-900">{q.title}</div>
                  <div className="text-[12px] text-muted">{q.submitter}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
                    {Object.entries(q.checks).map(([k, v]) => <Badge key={k} tone={v ? "green" : "risk"}>{v ? "✓" : "✗"} {k === "pii" ? "no personal data" : k}</Badge>)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {decided ? (
                    <Badge tone={decided === "approved" ? "green" : "risk"} className="py-1">{decided}</Badge>
                  ) : (
                    <>
                      <Button size="sm" variant="primary" disabled={!ok} title={ok ? "Publish to the repository" : "Fix failing checks first"} onClick={() => setCuration(q.id, "approved")}><Check size={13} /> Approve</Button>
                      <Button size="sm" onClick={() => setCuration(q.id, "rejected")}><X size={13} /> Return</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel className="mt-4 overflow-hidden">
        <PanelHeader
          eyebrow="Source registry"
          title="Every record, its provenance and licence"
          right={
            <div className="flex gap-1 rounded bg-paper-2 p-0.5 text-[12px]">
              {(["all", "reference", "synthetic"] as const).map((p) => (
                <button key={p} onClick={() => setProv(p)} className={clsx("rounded px-2 py-0.5", prov === p ? "bg-card font-semibold shadow-card" : "text-muted")}>{p === "synthetic" ? "demo" : p}</button>
              ))}
            </div>
          }
        />
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-[12.5px]">
            <thead className="sticky top-0 bg-card"><tr className="border-b border-rule text-left text-[11px] text-muted"><th className="px-4 py-2 font-medium">ID</th><th className="px-2 py-2 font-medium">Record</th><th className="px-2 py-2 font-medium">Provenance</th><th className="px-2 py-2 font-medium">Licence</th><th className="px-4 py-2 font-medium">Link</th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-rule/50 align-top hover:bg-paper-2/60">
                  <td className="px-4 py-1.5 font-mono text-[11.5px] text-muted">{e.id}</td>
                  <td className="px-2 py-1.5"><Link href={`/evidence/${e.id}`} className="text-ink-900 hover:text-saffron-deep">{e.title}</Link><div className="text-[11px] text-faint">{e.source} · {e.year}</div></td>
                  <td className="px-2 py-1.5">{e.provenance === "synthetic" ? <DemoBadge /> : <ReferenceBadge />}</td>
                  <td className="px-2 py-1.5 text-muted">{e.license ?? "—"}</td>
                  <td className="px-4 py-1.5">{e.url ? <a href={e.url} target="_blank" rel="noreferrer" className="text-documented underline">official</a> : <span className="text-faint">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
