"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { VERDICT_META } from "@/lib/sim/decision";
import { useHydrated, useStore } from "@/lib/store";
import { can } from "@/lib/roles";
import { Badge, EmptyState, LinkButton, PageHeader, Panel } from "@/components/ui";
import { BriefDocument, BriefToolbar } from "./BriefDocument";

/** Viewer for saved briefs. Briefs are written at the end of a Policy Casefile. */
export function BriefView() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="mx-auto h-[70vh] max-w-[1100px] animate-pulse-soft rounded-md bg-paper-2" />;
  return <BriefInner />;
}

function BriefInner() {
  const params = useSearchParams();
  const role = useStore((s) => s.role);
  const briefs = useStore((s) => s.briefs);
  const id = params.get("id");
  const shown = id ? briefs.find((b) => b.id === id) : null;

  if (shown) {
    return (
      <div className="mx-auto max-w-[1100px]">
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
          <Link href="/brief" className="text-[13px] text-muted hover:text-ink-900">← All briefs</Link>
          <span className="text-[12px] text-muted">Saved to workspace · {new Date(shown.createdAt).toLocaleString("en-IN")}</span>
        </div>
        <BriefToolbar brief={shown} />
        <BriefDocument brief={shown} decisionAnnex={can(role, "brief.decision") || shown.role === "policymaker"} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHeader eyebrow="Policy briefs" title="Saved briefs" description="Every brief is written at the end of a Policy Casefile, cites every claim, and carries a fingerprint that reproduces it from the same inputs." right={<LinkButton href="/case" variant="primary">Open a casefile</LinkButton>} />
      {id && <EmptyState title="Brief not found in this browser" icon={<FileText />}>Briefs are stored locally. Re-run its casefile — the same inputs reproduce fingerprint {id}.</EmptyState>}
      {!briefs.length ? (
        <EmptyState title="No briefs yet" icon={<FileText />} action={<LinkButton href="/case" size="sm" variant="primary">Start a casefile</LinkButton>}>Ask a policy question in the Casefile; the last step writes the brief.</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {briefs.map((b) => (
            <Panel key={b.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-muted">{b.fingerprint}</span>
                {b.decision && <Badge tone={VERDICT_META[b.decision.verdict].tone === "neutral" ? "neutral" : VERDICT_META[b.decision.verdict].tone}>{b.decision.label}</Badge>}
              </div>
              <Link href={`/brief?id=${b.id}`} className="mt-1 block font-serif text-[16px] font-semibold leading-snug text-ink-900 hover:text-saffron-deep">{b.question}</Link>
              <div className="mt-1 text-[12px] text-muted">{b.region.name} · {b.references.length} references · {new Date(b.createdAt).toLocaleDateString("en-IN")}</div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
