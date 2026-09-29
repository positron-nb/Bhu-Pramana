import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { BookOpen, Database, FileText, Gavel, Landmark, NotebookPen } from "lucide-react";
import type { EvidenceType, Pramana } from "@/lib/domain/schemas";
import type { Grade } from "@/lib/evidence/strength";

export { clsx };

/* ------------------------------------------------------------------ buttons */
type Variant = "primary" | "ink" | "outline" | "ghost" | "subtle";
const BTN: Record<Variant, string> = {
  primary: "bg-saffron text-white hover:bg-saffron-deep border border-saffron-deep/40 shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]",
  ink: "bg-ink-900 text-paper hover:bg-ink-800 border border-ink-950",
  outline: "bg-card text-text border border-rule-strong hover:border-ink-500 hover:bg-white",
  ghost: "text-text hover:bg-paper-2 border border-transparent",
  subtle: "bg-paper-2 text-text hover:bg-paper-3 border border-rule",
};
const SIZE = { sm: "h-7 px-2.5 text-[12.5px] gap-1.5", md: "h-9 px-3.5 text-[13.5px] gap-2", lg: "h-11 px-5 text-[15px] gap-2" };

export function Button({ variant = "outline", size = "md", className, ...p }: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof SIZE }) {
  return (
    <button
      {...p}
      className={clsx(
        "inline-flex items-center justify-center rounded-[5px] font-medium transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none select-none whitespace-nowrap",
        BTN[variant],
        SIZE[size],
        className,
      )}
    />
  );
}

export function LinkButton({ variant = "outline", size = "md", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof SIZE }) {
  return (
    <Link
      {...p}
      className={clsx(
        "inline-flex items-center justify-center rounded-[5px] font-medium transition-colors duration-150 select-none whitespace-nowrap",
        BTN[variant],
        SIZE[size],
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ badges */
export function Badge({ children, tone = "neutral", className, title }: { children: ReactNode; tone?: "neutral" | "saffron" | "green" | "risk" | "ink" | "observed" | "documented" | "inferred" | "amber"; className?: string; title?: string }) {
  const tones = {
    neutral: "bg-paper-2 text-muted border-rule",
    saffron: "bg-saffron-soft text-saffron-deep border-saffron/30",
    green: "bg-green-soft text-green-deep border-green/25",
    risk: "bg-risk-soft text-risk border-risk/25",
    ink: "bg-ink-900 text-paper border-ink-950",
    observed: "bg-observed-soft text-observed border-observed/25",
    documented: "bg-documented-soft text-documented border-documented/25",
    inferred: "bg-inferred-soft text-inferred border-inferred/25",
    amber: "bg-[#f6ecc8] text-[#80600a] border-[#b88a12]/30",
  };
  return (
    <span title={title} className={clsx("inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-[1px] text-[11px] font-medium leading-4 whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

export const PRAMANA_META: Record<Pramana, { label: string; sanskrit: string; tone: "observed" | "documented" | "inferred"; help: string }> = {
  pratyaksha: { label: "Observed", sanskrit: "Pratyakṣa", tone: "observed", help: "Observed data — datasets, indicators, remote sensing" },
  shabda: { label: "Documented", sanskrit: "Śabda", tone: "documented", help: "Documented testimony — research, law, policy, case studies" },
  anumana: { label: "Inferred", sanskrit: "Anumāna", tone: "inferred", help: "Inference — model outputs, syntheses, assumptions" },
};

export function PramanaTag({ p, compact = false }: { p: Pramana; compact?: boolean }) {
  const m = PRAMANA_META[p];
  return (
    <Badge tone={m.tone} title={`${m.sanskrit}: ${m.help}`} className="font-mono uppercase tracking-[0.06em] text-[10px]">
      <span className="inline-block size-1.5 rounded-full bg-current" />
      {compact ? m.label : `${m.label} · ${m.sanskrit}`}
    </Badge>
  );
}

export const TYPE_META: Record<EvidenceType, { label: string; plural: string; color: string; icon: typeof FileText; pramana: Pramana }> = {
  research: { label: "Research", plural: "Research", color: "var(--color-documented)", icon: BookOpen, pramana: "shabda" },
  policy: { label: "Policy", plural: "Policies & programmes", color: "var(--color-green)", icon: Landmark, pramana: "shabda" },
  law: { label: "Law", plural: "Laws", color: "var(--color-sepia)", icon: Gavel, pramana: "shabda" },
  dataset: { label: "Dataset", plural: "Datasets", color: "var(--color-observed)", icon: Database, pramana: "pratyaksha" },
  "case-study": { label: "Case study", plural: "Case studies", color: "var(--color-plum)", icon: NotebookPen, pramana: "shabda" },
  report: { label: "Report", plural: "Reports", color: "var(--color-muted)", icon: FileText, pramana: "shabda" },
};

export function TypeMark({ type, showLabel = true }: { type: EvidenceType; showLabel?: boolean }) {
  const m = TYPE_META[type];
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: m.color }}>
      <Icon size={13} strokeWidth={2} aria-hidden />
      {showLabel && m.label}
    </span>
  );
}

export function GradeBadge({ grade, score }: { grade: Grade | null | undefined; score?: number | null }) {
  if (!grade) return <Badge>—</Badge>;
  const tone = grade === "High" ? "green" : grade === "Moderate" ? "amber" : grade === "Low" ? "saffron" : "risk";
  return (
    <Badge tone={tone} title="Evidence confidence (design × geographic relevance × recency, penalised for contradicting evidence)">
      {grade}
      {score !== undefined && score !== null && <span className="tabular opacity-70">· {Math.round(score * 100)}</span>}
    </Badge>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge tone="amber" className={className} title="Synthetic demonstration record — not an official or published source">
      Demo record
    </Badge>
  );
}

export function ReferenceBadge() {
  return (
    <Badge tone="green" title="Real public document or portal — metadata and official link only">
      Reference
    </Badge>
  );
}

/* ------------------------------------------------------------------ layout */
export function Panel({ children, className, as: As = "section", ...rest }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" | "aside" } & Omit<ComponentProps<"section">, "className" | "children" | "ref">) {
  return (
    <As {...rest} className={clsx("panel", className)}>
      {children}
    </As>
  );
}

export function PanelHeader({ title, eyebrow, right, className }: { title: ReactNode; eyebrow?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex items-start justify-between gap-3 border-b border-rule px-4 py-3", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="label-caps text-muted mb-0.5">{eyebrow}</div>}
        <h3 className="font-serif text-[16.5px] font-semibold leading-snug text-ink-900">{title}</h3>
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, right, children }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; right?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <div className="label-caps text-saffron-deep mb-1.5">{eyebrow}</div>}
        <h1 className="font-serif text-[28px] md:text-[32px] font-semibold leading-[1.1] text-ink-900">{title}</h1>
        {description && <p className="mt-2 text-[15px] text-muted leading-relaxed">{description}</p>}
        {children}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </header>
  );
}

export function Stat({ label, value, unit, sub, tone, className }: { label: ReactNode; value: ReactNode; unit?: string; sub?: ReactNode; tone?: "good" | "bad" | "neutral"; className?: string }) {
  return (
    <div className={clsx("min-w-0", className)}>
      <div className="label-caps text-muted truncate">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={clsx("font-serif text-[26px] font-semibold leading-none tabular", tone === "good" ? "text-green" : tone === "bad" ? "text-risk" : "text-ink-900")}>{value}</span>
        {unit && <span className="text-[12px] text-muted">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-rule-strong bg-paper/60 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-ink-400">{icon}</div>}
      <div className="font-serif text-[17px] font-semibold text-ink-900">{title}</div>
      {children && <div className="mt-1.5 max-w-md text-[13.5px] text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse-soft rounded bg-paper-3/70", className)} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-ink-600 bg-ink-800 px-1.5 py-[1px] font-mono text-[10.5px] text-ink-200">{children}</kbd>;
}

export function Meter({ value, max = 1, tone = "saffron", className }: { value: number; max?: number; tone?: "saffron" | "green" | "observed" | "risk" | "ink"; className?: string }) {
  const colors = { saffron: "bg-saffron", green: "bg-green", observed: "bg-observed", risk: "bg-risk", ink: "bg-ink-600" };
  return (
    <div className={clsx("h-1.5 overflow-hidden rounded-full bg-paper-3", !/(^|\s)w-/.test(className ?? "") && "w-full", className)} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={clsx("h-full rounded-full transition-[width] duration-500", colors[tone])} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  );
}

export function NoticeBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex items-start gap-2 rounded-[5px] border border-[#b88a12]/35 bg-[#f7efd2] px-3 py-2 text-[12.5px] text-[#6d520a]", className)}>
      <span aria-hidden className="mt-[3px] inline-block size-1.5 shrink-0 rounded-full bg-[#b88a12]" />
      <div>{children}</div>
    </div>
  );
}

/** Citation chip: shows an evidence / assumption id and links to it. */
export function Cite({ id, n, onClick }: { id: string; n?: number; onClick?: () => void }) {
  const isAssumption = /^A\d{2}$/.test(id);
  const href = isAssumption ? `/agenda?focus=${id}#assumptions` : `/evidence/${id}`;
  const inner = n !== undefined ? `${n}` : id;
  const cls = clsx(
    "mx-[1px] inline-flex items-center rounded-[3px] border px-1 align-[1px] font-mono text-[10.5px] leading-[15px] transition-colors",
    isAssumption ? "border-inferred/30 bg-inferred-soft text-inferred hover:bg-inferred hover:text-white" : "border-documented/25 bg-documented-soft text-documented hover:bg-documented hover:text-white",
  );
  if (onClick) return <button type="button" onClick={onClick} className={cls} title={id}>{inner}</button>;
  return <Link href={href} className={cls} title={id}>{inner}</Link>;
}
