"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-md border border-risk/30 bg-card p-6 text-center shadow-card">
      <AlertTriangle className="mx-auto text-risk" />
      <h2 className="mt-3 font-serif text-[20px] font-semibold text-ink-900">Something went wrong on this page</h2>
      <p className="mt-1.5 text-[13.5px] text-muted">The rest of the platform keeps working — the data and models run locally. Try again, or reset the demo session from the role menu.</p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-faint">ref {error.digest}</p>}
      <button onClick={reset} className="mt-4 inline-flex items-center gap-2 rounded-[5px] bg-ink-900 px-4 py-2 text-[13.5px] font-medium text-paper hover:bg-ink-800">
        <RotateCcw size={14} /> Try again
      </button>
    </div>
  );
}
