"use client";

import clsx from "clsx";
import { Bookmark, BookmarkCheck, Columns2, Plus, Check } from "lucide-react";
import { useHydrated, useStore } from "@/lib/store";
import { can } from "@/lib/roles";

export function EvidenceActions({ id, compact = false, className }: { id: string; compact?: boolean; className?: string }) {
  const hydrated = useHydrated();
  const role = useStore((s) => s.role);
  const current = useStore((s) => s.current);
  const bookmarks = useStore((s) => s.bookmarks);
  const compare = useStore((s) => s.compare);
  const attach = useStore((s) => s.attachEvidence);
  const detach = useStore((s) => s.detachEvidence);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const toggleCompare = useStore((s) => s.toggleCompare);
  if (!hydrated) return <div className={clsx("h-7", className)} />;
  const attached = !!current?.evidenceIds.includes(id);
  const marked = bookmarks.includes(id);
  const comparing = compare.includes(id);
  const ws = can(role, "workspace");
  const btn = "inline-flex h-7 items-center gap-1 rounded-[4px] border px-2 text-[12px] font-medium transition-colors";
  return (
    <div className={clsx("flex flex-wrap items-center gap-1.5", className)}>
      {current && (
        <button
          type="button"
          onClick={() => (attached ? detach(id) : attach(id))}
          className={clsx(btn, attached ? "border-green/40 bg-green-soft text-green-deep" : "border-rule bg-card text-ink-800 hover:border-ink-400")}
          title={attached ? "Remove from the current investigation" : `Attach to “${current.question}”`}
        >
          {attached ? <Check size={13} /> : <Plus size={13} />}
          {!compact && (attached ? "Attached" : "Attach")}
        </button>
      )}
      {ws && (
        <button type="button" onClick={() => toggleBookmark(id)} aria-pressed={marked} className={clsx(btn, marked ? "border-saffron/40 bg-saffron-soft text-saffron-deep" : "border-rule bg-card text-ink-800 hover:border-ink-400")} title={marked ? "Remove bookmark" : "Bookmark"}>
          {marked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          {!compact && (marked ? "Saved" : "Save")}
        </button>
      )}
      {ws && (
        <button type="button" onClick={() => toggleCompare(id)} aria-pressed={comparing} className={clsx(btn, comparing ? "border-documented/40 bg-documented-soft text-documented" : "border-rule bg-card text-ink-800 hover:border-ink-400")} title="Compare side-by-side (up to 3) in the workspace">
          <Columns2 size={13} />
          {!compact && (comparing ? "Comparing" : "Compare")}
        </button>
      )}
    </div>
  );
}
