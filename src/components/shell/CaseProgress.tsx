"use client";

import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Check } from "lucide-react";
import { useHydrated, useStore, type Investigation } from "@/lib/store";

export const CASE_STEPS = [
  { key: "ask", label: "Ask", hint: "The policy question" },
  { key: "evidence", label: "Evidence", hint: "What studies, law and data say" },
  { key: "place", label: "Place", hint: "Where it matters" },
  { key: "simulate", label: "Decide", hint: "Simulate and see the decision" },
  { key: "brief", label: "Brief", hint: "Traceable policy brief" },
] as const;

export type CaseStep = (typeof CASE_STEPS)[number]["key"];

export function caseProgress(inv: Investigation | null): Record<CaseStep, boolean> {
  return {
    ask: !!inv?.question,
    evidence: !!inv?.synthesis && (inv?.evidenceIds.length ?? 0) > 0,
    place: !!inv?.regionCode,
    simulate: !!inv?.simulatedAt,
    brief: !!inv?.briefId,
  };
}

/** Compact casefile indicator for the top bar. */
export function CasePill({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const cur = useStore((s) => s.current);
  if (!hydrated) return <div className={clsx("h-8", className)} />;
  if (!cur) {
    return (
      <Link href="/case" className={clsx("group inline-flex items-center gap-2 text-[13px] text-muted hover:text-ink-900", className)}>
        <span className="label-caps text-faint">Casefile</span>
        <span className="hidden sm:inline">No open casefile —</span>
        <span className="font-medium text-saffron-deep group-hover:underline">start with a policy question</span>
        <ArrowRight size={13} className="text-saffron-deep" />
      </Link>
    );
  }
  const done = caseProgress(cur);
  const n = CASE_STEPS.filter((s) => done[s.key]).length;
  return (
    <Link href="/case" title={cur.question} className={clsx("group flex min-w-0 items-center gap-3 rounded-full border border-rule bg-card py-1 pl-3 pr-2 hover:border-ink-400", className)}>
      <span className="label-caps shrink-0 text-saffron-deep">Casefile</span>
      <span className="min-w-0 truncate text-[13px] text-ink-800">{cur.question}</span>
      <span className="flex shrink-0 items-center gap-1" aria-label={`${n} of ${CASE_STEPS.length} steps complete`}>
        {CASE_STEPS.map((s) => (
          <span key={s.key} className={clsx("grid size-4 place-items-center rounded-full", done[s.key] ? "bg-green text-white" : "bg-paper-3")}>
            {done[s.key] && <Check size={9} strokeWidth={3.5} />}
          </span>
        ))}
      </span>
    </Link>
  );
}
