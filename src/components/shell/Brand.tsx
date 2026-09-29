import clsx from "clsx";

/**
 * Brand mark: a surveyor's triangulation — three observation points (the three
 * pramāṇas) converging on one parcel. Saffron / ink / green.
 */
export function BrandMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="6" fill="#0c1828" stroke="#2d4a70" />
      <path d="M8 23 L16 8 L24 23 Z" fill="none" stroke="#7188ab" strokeWidth="1" strokeDasharray="1.6 1.6" />
      <path d="M8 23 L16 17 M24 23 L16 17 M16 8 L16 17" stroke="#cbd5e3" strokeWidth="1.1" />
      <rect x="13.2" y="14.2" width="5.6" height="5.6" transform="rotate(45 16 17)" fill="#c96f16" />
      <circle cx="16" cy="8" r="2" fill="#f4efe4" />
      <circle cx="8" cy="23" r="2" fill="#226d86" />
      <circle cx="24" cy="23" r="2" fill="#27744f" />
    </svg>
  );
}

export function Wordmark({ light = true, className }: { light?: boolean; className?: string }) {
  return (
    <div className={clsx("leading-none", className)}>
      <div className={clsx("font-serif text-[17px] font-semibold tracking-[-0.01em]", light ? "text-paper" : "text-ink-900")}>
        Bhū-Pramāṇa
      </div>
      <div className={clsx("mt-[3px] font-mono text-[9px] uppercase tracking-[0.16em]", light ? "text-ink-300" : "text-muted")}>
        भू-प्रमाण · Land Policy Evidence Lab
      </div>
    </div>
  );
}

/** Tricolour hairline used at the very top of surfaces. */
export function TriRule({ className }: { className?: string }) {
  return (
    <div className={clsx("flex h-[3px] w-full", className)} aria-hidden>
      <div className="flex-1 bg-saffron" />
      <div className="flex-1 bg-paper" />
      <div className="flex-1 bg-green" />
    </div>
  );
}
