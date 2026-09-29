import clsx from "clsx";
import type { Cited } from "@/lib/ai/copilot";
import { Cite } from "@/components/ui";

/** Renders synthesised sentences with their citation chips. */
export function CitedList({ items, numbered = false, refNumbers, className, onCite }: { items: Cited[]; numbered?: boolean; refNumbers?: Map<string, number>; className?: string; onCite?: (id: string) => void }) {
  const Tag = numbered ? "ol" : "ul";
  return (
    <Tag className={clsx("space-y-2", className)}>
      {items.map((s, i) => (
        <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-800">
          {numbered ? <span className="mt-[3px] font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span> : <span className="mt-[9px] size-1 shrink-0 rounded-full bg-ink-400" />}
          <span>
            {s.text}{" "}
            {s.cites.map((id) => (
              <Cite key={id} id={id} n={refNumbers?.get(id)} onClick={onCite ? () => onCite(id) : undefined} />
            ))}
          </span>
        </li>
      ))}
    </Tag>
  );
}
