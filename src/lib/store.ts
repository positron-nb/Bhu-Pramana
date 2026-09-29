"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Levers, Role } from "@/lib/domain/schemas";
import type { Brief } from "@/lib/brief/compose";
import type { CopilotAnswer } from "@/lib/ai/copilot";
import { ROLE_COOKIE } from "@/lib/roles";

/**
 * Client-side workspace state (persisted to localStorage in demo mode).
 * The "investigation" is the thread that ties the signature journey together:
 * question → evidence → geography → scenario → simulation → insight → brief.
 */

export type SynthesisLite = Pick<CopilotAnswer, "summary" | "approaches" | "conflicts" | "mode" | "provider" | "model" | "labPreset" | "geography">;

export interface Investigation {
  id: string;
  question: string;
  createdAt: string;
  updatedAt: string;
  evidenceIds: string[];
  regionCode?: string;
  levers?: Levers;
  simulatedAt?: string;
  insight?: string[];
  briefId?: string;
  synthesis?: SynthesisLite;
}

export interface Note { id: string; targetId: string | null; text: string; createdAt: string; investigationId?: string }
export interface SavedScenario { id: string; name: string; regionCode: string; levers: Levers; createdAt: string; headline: string; confidence: string | null }

interface State {
  role: Role | null;
  current: Investigation | null;
  investigations: Investigation[];
  bookmarks: string[];
  notes: Note[];
  scenarios: SavedScenario[];
  briefs: Brief[];
  compare: string[];
  interests: string[];
  curation: Record<string, "approved" | "rejected">;
  setRole: (r: Role | null) => void;
  startInvestigation: (question: string) => Investigation;
  updateCurrent: (patch: Partial<Investigation>) => void;
  attachEvidence: (id: string) => void;
  detachEvidence: (id: string) => void;
  setRegion: (code: string) => void;
  setLevers: (l: Levers) => void;
  markSimulated: () => void;
  pinInsight: (lines: string[]) => void;
  archiveCurrent: () => void;
  resumeInvestigation: (id: string) => void;
  deleteInvestigation: (id: string) => void;
  toggleBookmark: (id: string) => void;
  addNote: (targetId: string | null, text: string) => void;
  deleteNote: (id: string) => void;
  saveScenario: (s: Omit<SavedScenario, "id" | "createdAt">) => void;
  deleteScenario: (id: string) => void;
  saveBrief: (b: Brief) => void;
  deleteBrief: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  toggleInterest: (id: string) => void;
  setCuration: (id: string, v: "approved" | "rejected") => void;
  resetDemo: () => void;
}

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

function writeRoleCookie(role: Role | null) {
  if (typeof document === "undefined") return;
  document.cookie = role ? `${ROLE_COOKIE}=${role}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax` : `${ROLE_COOKIE}=; path=/; max-age=0`;
}

const initial = {
  role: null as Role | null,
  current: null as Investigation | null,
  investigations: [] as Investigation[],
  bookmarks: [] as string[],
  notes: [] as Note[],
  scenarios: [] as SavedScenario[],
  briefs: [] as Brief[],
  compare: [] as string[],
  interests: [] as string[],
  curation: {} as Record<string, "approved" | "rejected">,
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const patchCurrent = (patch: Partial<Investigation>) => {
        const cur = get().current;
        if (!cur) return;
        set({ current: { ...cur, ...patch, updatedAt: now() } });
      };
      return {
        ...initial,
        setRole: (role) => {
          writeRoleCookie(role);
          set({ role });
        },
        startInvestigation: (question) => {
          const cur = get().current;
          if (cur && cur.question.trim().toLowerCase() === question.trim().toLowerCase()) return cur;
          const inv: Investigation = { id: uid("INV"), question: question.trim(), createdAt: now(), updatedAt: now(), evidenceIds: [] };
          const archived = cur && (cur.evidenceIds.length || cur.briefId) ? [cur, ...get().investigations.filter((i) => i.id !== cur.id)].slice(0, 20) : get().investigations;
          set({ current: inv, investigations: archived });
          return inv;
        },
        updateCurrent: (patch) => patchCurrent(patch),
        attachEvidence: (id) => {
          const cur = get().current;
          if (!cur || cur.evidenceIds.includes(id)) return;
          patchCurrent({ evidenceIds: [...cur.evidenceIds, id] });
        },
        detachEvidence: (id) => {
          const cur = get().current;
          if (!cur) return;
          patchCurrent({ evidenceIds: cur.evidenceIds.filter((x) => x !== id) });
        },
        setRegion: (code) => patchCurrent({ regionCode: code }),
        setLevers: (levers) => patchCurrent({ levers }),
        markSimulated: () => patchCurrent({ simulatedAt: now() }),
        pinInsight: (insight) => patchCurrent({ insight }),
        archiveCurrent: () => {
          const cur = get().current;
          if (!cur) return;
          set({ investigations: [cur, ...get().investigations.filter((i) => i.id !== cur.id)].slice(0, 20), current: null });
        },
        resumeInvestigation: (id) => {
          const inv = get().investigations.find((i) => i.id === id);
          if (!inv) return;
          const cur = get().current;
          const rest = get().investigations.filter((i) => i.id !== id);
          set({ current: inv, investigations: cur ? [cur, ...rest].slice(0, 20) : rest });
        },
        deleteInvestigation: (id) => set({ investigations: get().investigations.filter((i) => i.id !== id) }),
        toggleBookmark: (id) => {
          const b = get().bookmarks;
          set({ bookmarks: b.includes(id) ? b.filter((x) => x !== id) : [id, ...b] });
        },
        addNote: (targetId, text) => set({ notes: [{ id: uid("N"), targetId, text: text.trim(), createdAt: now(), investigationId: get().current?.id }, ...get().notes] }),
        deleteNote: (id) => set({ notes: get().notes.filter((n) => n.id !== id) }),
        saveScenario: (s) => set({ scenarios: [{ ...s, id: uid("SC"), createdAt: now() }, ...get().scenarios].slice(0, 30) }),
        deleteScenario: (id) => set({ scenarios: get().scenarios.filter((s) => s.id !== id) }),
        saveBrief: (b) => set({ briefs: [b, ...get().briefs.filter((x) => x.id !== b.id)].slice(0, 20) }),
        deleteBrief: (id) => set({ briefs: get().briefs.filter((b) => b.id !== id) }),
        toggleCompare: (id) => {
          const c = get().compare;
          set({ compare: c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-3) });
        },
        clearCompare: () => set({ compare: [] }),
        toggleInterest: (id) => {
          const i = get().interests;
          set({ interests: i.includes(id) ? i.filter((x) => x !== id) : [...i, id] });
        },
        setCuration: (id, v) => set({ curation: { ...get().curation, [id]: v } }),
        resetDemo: () => {
          writeRoleCookie(null);
          set({ ...initial });
        },
      };
    },
    {
      name: "bhu-pramana-workspace-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state?.role) writeRoleCookie(state.role);
      },
    },
  ),
);

/**
 * True once the persisted store has rehydrated on the client. Always false on
 * the server and during hydration, so server and client markup match.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
