"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import { ChevronsUpDown, LogOut, Menu, RotateCcw, Search, X } from "lucide-react";
import { NAV } from "./nav";
import { BrandMark, TriRule, Wordmark } from "./Brand";
import { CasePill } from "./CaseProgress";
import { usePlatformStatus } from "./usePlatformStatus";
import { useHydrated, useStore } from "@/lib/store";
import { can, ROLE_META } from "@/lib/roles";
import { ROLES, type Role } from "@/lib/domain/schemas";
import { Kbd } from "@/components/ui";

function RoleSwitcher() {
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const resetDemo = useStore((s) => s.resetDemo);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const meta = role ? ROLE_META[role] : null;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-md border border-ink-700 bg-ink-900 px-2.5 py-2 text-left transition-colors hover:border-ink-500"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full font-serif text-[13px] font-semibold text-ink-950" style={{ background: meta?.accent ?? "var(--color-ink-400)" }}>
          {meta ? meta.label[0] : "?"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold text-paper">{meta?.label ?? "Choose a role"}</span>
          <span className="block truncate text-[10.5px] text-ink-300">{meta ? `${meta.hindi} · demo session` : "Demo accounts"}</span>
        </span>
        <ChevronsUpDown size={14} className="text-ink-400" />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full left-0 z-50 mb-2 w-[260px] overflow-hidden rounded-md border border-ink-700 bg-ink-900 shadow-float animate-fade-up">
          <div className="border-b border-ink-700 px-3 py-2 label-caps text-ink-400">Switch demo role</div>
          {ROLES.map((r: Role) => (
            <button
              key={r}
              role="menuitem"
              onClick={() => { setRole(r); setOpen(false); router.refresh(); }}
              className={clsx("flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-ink-800", role === r && "bg-ink-800")}
            >
              <span className="mt-0.5 size-2 shrink-0 rounded-full" style={{ background: ROLE_META[r].accent }} />
              <span>
                <span className="block text-[12.5px] font-semibold text-paper">{ROLE_META[r].label}</span>
                <span className="block text-[11px] text-ink-300">{ROLE_META[r].tagline}</span>
              </span>
            </button>
          ))}
          <div className="border-t border-ink-700">
            <button onClick={() => { resetDemo(); setOpen(false); router.push("/"); }} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-ink-300 hover:bg-ink-800 hover:text-paper">
              <RotateCcw size={13} /> Reset demo session
            </button>
            <button onClick={() => { setRole(null); setOpen(false); router.push("/"); }} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-ink-300 hover:bg-ink-800 hover:text-paper">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeIndicator() {
  const s = usePlatformStatus();
  if (!s) return <div className="h-[46px]" />;
  const llm = s.mode === "llm-assisted";
  return (
    <div className="rounded-md border border-ink-800 bg-ink-950/60 px-2.5 py-2 text-[10.5px] leading-[1.45] text-ink-300" title={`Data: ${s.data} · Retrieval: ${s.retrieval} · Simulation: ${s.simulation} · LLM: ${s.llm}${s.model ? ` (${s.model})` : ""}`}>
      <div className="flex items-center gap-1.5">
        <span className={clsx("size-1.5 rounded-full", llm ? "bg-green" : "bg-saffron")} />
        <span className="font-mono uppercase tracking-[0.12em] text-ink-200">{llm ? "Offline + LLM phrasing" : "Fully offline"}</span>
      </div>
      <div className="mt-0.5 truncate">{llm ? `LLM ${s.model} · citations validated` : "Deterministic retrieval, synthesis & simulation"}</div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const role = useStore((s) => s.role);
  const hydrated = useHydrated();
  return (
    <div className="flex h-full flex-col bg-ink-950 text-ink-200">
      <TriRule />
      <Link href="/" className="flex items-center gap-2.5 px-4 pb-4 pt-4" onClick={onNavigate}>
        <BrandMark />
        <Wordmark />
      </Link>
      <nav className="flex-1 overflow-y-auto px-2.5 pb-4" aria-label="Main">
        {NAV.map((g) => {
          const items = g.items.filter((it) => !it.requires || !hydrated || can(role, it.requires));
          if (!items.length) return null;
          return (
            <div key={g.group} className="mt-3">
              <div className="label-caps px-2 pb-1.5 text-ink-500">{g.group}</div>
              <ul className="space-y-0.5">
                {items.map((it) => {
                  const active = pathname === it.href || pathname.startsWith(it.href + "/");
                  const locked = hydrated && it.requires && !can(role, it.requires);
                  const Icon = it.icon;
                  if (it.primary) {
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={onNavigate}
                          title={it.hint}
                          className={clsx(
                            "flex items-center gap-2.5 rounded-md border px-2.5 py-2.5 text-[14px] font-semibold transition-colors",
                            active ? "border-saffron bg-saffron text-white" : "border-saffron/40 bg-saffron/10 text-saffron-soft hover:bg-saffron/20",
                          )}
                        >
                          <Icon size={17} strokeWidth={2} />
                          <span className="min-w-0">
                            <span className="block truncate">{it.label}</span>
                            <span className={clsx("block truncate text-[10.5px] font-normal", active ? "text-white/80" : "text-ink-300")}>Question → evidence → decision</span>
                          </span>
                        </Link>
                      </li>
                    );
                  }
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        onClick={onNavigate}
                        title={it.hint}
                        className={clsx(
                          "group relative flex items-center gap-2.5 rounded-[5px] px-2 py-[7px] text-[13.5px] transition-colors",
                          active ? "bg-ink-800 text-paper" : "text-ink-300 hover:bg-ink-900 hover:text-paper",
                          locked && "opacity-50",
                        )}
                      >
                        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-saffron" />}
                        <Icon size={16} strokeWidth={1.75} className={clsx(active ? "text-saffron" : "text-ink-400 group-hover:text-ink-200")} />
                        <span className="truncate">{it.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-ink-800 p-2.5">
        <ModeIndicator />
        <RoleSwitcher />
      </div>
    </div>
  );
}

function QuickSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form onSubmit={submit} role="search" className="relative hidden md:block">
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
      <input
        ref={input}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the evidence…"
        aria-label="Search the evidence"
        className="h-8 w-[220px] rounded-[5px] border border-rule bg-card pl-8 pr-14 text-[13px] placeholder:text-faint focus:border-ink-400 focus:outline-none lg:w-[260px]"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-80">
        <Kbd>Ctrl K</Kbd>
      </span>
    </form>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = useStore((s) => s.role);
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();

  // first-time visitors land on the role picker
  useEffect(() => {
    if (hydrated && !role && pathname !== "/") router.replace(`/?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, role, pathname, router]);

  return (
    <div className="min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-[236px] lg:block">
        <Sidebar />
      </aside>
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] animate-fade-up">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
          <button className="absolute right-3 top-3 rounded bg-ink-900 p-1.5 text-paper" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
      )}
      <div className="lg:pl-[236px]">
        <header className="no-print sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
          <div className="flex h-[52px] items-center gap-3 px-4 md:px-6">
            <button className="rounded p-1 text-ink-700 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="flex min-w-0 flex-1"><CasePill className="max-w-[640px]" /></div>
            <QuickSearch />
          </div>
        </header>
        <main className="app-main px-4 pb-16 pt-6 md:px-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
