"use client";

import { useEffect, useState } from "react";

export interface PlatformStatus {
  mode: "offline" | "llm-assisted";
  data: string;
  retrieval: string;
  llm: string;
  model?: string;
  simulation: string;
  counts: { evidence: number; regions: number; assumptions: number; indicators: number };
}

let cache: PlatformStatus | null = null;
let inflight: Promise<PlatformStatus | null> | null = null;

export function usePlatformStatus() {
  const [status, setStatus] = useState<PlatformStatus | null>(cache);
  useEffect(() => {
    if (cache) return;
    inflight ??= fetch("/api/v1/status")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    inflight.then((s) => {
      cache = s;
      setStatus(s);
    });
  }, []);
  return status;
}
