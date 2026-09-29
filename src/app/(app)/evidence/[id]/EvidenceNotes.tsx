"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useHydrated, useStore } from "@/lib/store";
import { can } from "@/lib/roles";
import { Button, Panel, PanelHeader } from "@/components/ui";

export function EvidenceNotes({ id }: { id: string }) {
  const hydrated = useHydrated();
  const role = useStore((s) => s.role);
  const notes = useStore((s) => s.notes);
  const add = useStore((s) => s.addNote);
  const del = useStore((s) => s.deleteNote);
  const [text, setText] = useState("");
  if (!hydrated || !can(role, "notes")) return null;
  const mine = notes.filter((n) => n.targetId === id);
  return (
    <Panel>
      <PanelHeader eyebrow="Workspace" title="Research notes" />
      <div className="p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); if (text.trim()) { add(id, text); setText(""); } }}
          className="flex gap-2"
        >
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Add a note on method, relevance or caveats…" aria-label="New note" className="min-h-[44px] flex-1 resize-y rounded border border-rule bg-card px-2.5 py-2 text-[13px] focus:border-ink-400 focus:outline-none" />
          <Button type="submit" variant="ink" disabled={!text.trim()}>Save</Button>
        </form>
        {mine.length > 0 && (
          <ul className="mt-3 space-y-2">
            {mine.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 rounded border border-rule bg-paper px-3 py-2 text-[13px]">
                <div>
                  <p className="whitespace-pre-wrap text-ink-800">{n.text}</p>
                  <div className="mt-0.5 text-[11px] text-faint">{new Date(n.createdAt).toLocaleString("en-IN")}</div>
                </div>
                <button onClick={() => del(n.id)} className="text-faint hover:text-risk" aria-label="Delete note"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
