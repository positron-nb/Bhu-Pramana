"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpenCheck, Landmark, ShieldCheck, Users } from "lucide-react";
import { ROLES, type Role } from "@/lib/domain/schemas";
import { ROLE_META } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { SIGNATURE_QUESTION } from "@/lib/case/signature";

const ICONS: Record<Role, typeof Users> = { public: Users, researcher: BookOpenCheck, policymaker: Landmark, admin: ShieldCheck };


export function RolePicker() {
  const router = useRouter();
  const params = useSearchParams();
  const setRole = useStore((s) => s.setRole);
  const role = useStore((s) => s.role);
  const next = params.get("next");
  const go = (r: Role) => {
    setRole(r);
    router.push(next && next.startsWith("/") ? next : ROLE_META[r].home);
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {ROLES.map((r) => {
        const m = ROLE_META[r];
        const Icon = ICONS[r];
        return (
          <button
            key={r}
            onClick={() => go(r)}
            className="group relative flex flex-col rounded-md border border-rule bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-ink-400 hover:shadow-float focus-visible:border-saffron"
          >
            <span className="absolute inset-x-0 top-0 h-[3px] rounded-t-md" style={{ background: m.accent }} />
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-full border border-rule bg-paper" style={{ color: m.accent }}>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              {role === r && <span className="label-caps text-green">Current</span>}
            </div>
            <div className="mt-3 font-serif text-[18px] font-semibold text-ink-900">{m.label}</div>
            <div className="text-[12px] text-faint">{m.hindi}</div>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">{m.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-saffron-deep">
              Enter as {m.label.toLowerCase()} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function JourneyButton({ label = "Open the demo casefile" }: { label?: string }) {
  const router = useRouter();
  const setRole = useStore((s) => s.setRole);
  return (
    <button
      onClick={() => {
        setRole("policymaker");
        router.push(`/case?q=${encodeURIComponent(SIGNATURE_QUESTION)}`);
      }}
      className="inline-flex h-12 items-center gap-2 rounded-[5px] border border-saffron-deep/50 bg-saffron px-5 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] transition-colors hover:bg-saffron-deep"
    >
      {label} <ArrowRight size={17} />
    </button>
  );
}
