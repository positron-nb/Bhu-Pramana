"use client";

import { useState } from "react";
import clsx from "clsx";
import { Braces, Play } from "lucide-react";
import { ENDPOINTS, type EndpointDoc } from "@/lib/openapi";
import { useStore } from "@/lib/store";
import { Badge, Button, LinkButton, PageHeader, Panel } from "@/components/ui";

export function DevelopersView() {
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        eyebrow="Open APIs & interoperability"
        title="Every screen is an API"
        description="REST endpoints return the same numbers the interface shows. Datasets are published as a DCAT-AP JSON-LD catalogue (harvestable by CKAN and open-data portals), boundaries and indicators as GeoJSON, panels as CSV, and the whole surface as OpenAPI 3.1."
        right={<LinkButton href="/api/v1/openapi.json" target="_blank" variant="ink" prefetch={false}><Braces size={14} /> openapi.json</LinkButton>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[["REST + JSON", "Search, copilot, simulate, graph, evidence, regions"], ["DCAT-AP JSON-LD", "Dataset catalogue for federation"], ["GeoJSON", "Boundaries joined with indicators"], ["CSV", "Bulk indicator panel"]].map(([k, v]) => (
          <Panel key={k} className="p-3"><div className="font-semibold text-ink-900">{k}</div><div className="text-[12px] text-muted">{v}</div></Panel>
        ))}
      </div>
      <div className="space-y-3">
        {ENDPOINTS.map((e) => <Endpoint key={e.method + e.path} e={e} />)}
      </div>
    </div>
  );
}

function Endpoint({ e }: { e: EndpointDoc }) {
  const role = useStore((s) => s.role);
  const [out, setOut] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const r = await fetch(e.example, e.method === "POST" ? { method: "POST", headers: { "content-type": "application/json", ...(role ? { "x-demo-role": role } : {}) }, body: JSON.stringify(e.body) } : undefined);
      setStatus(r.status);
      const ct = r.headers.get("content-type") ?? "";
      const text = await r.text();
      setOut(ct.includes("json") ? JSON.stringify(JSON.parse(text), null, 2).slice(0, 4000) : text.slice(0, 4000));
    } catch (err) {
      setOut(String(err));
    } finally {
      setBusy(false);
    }
  };
  const curl = e.method === "GET" ? `curl "http://localhost:3000${e.example}"` : `curl -X POST http://localhost:3000${e.example} \\\n  -H "content-type: application/json"${e.auth ? ` \\\n  -H "${e.auth}"` : ""} \\\n  -d '${JSON.stringify(e.body)}'`;
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx("rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold", e.method === "GET" ? "bg-observed-soft text-observed" : "bg-saffron-soft text-saffron-deep")}>{e.method}</span>
            <code className="font-mono text-[13px] text-ink-900">{e.path}</code>
            <Badge>{e.format}</Badge>
            {e.auth && <Badge tone="risk">role: {e.auth.split(": ")[1]}</Badge>}
          </div>
          <div className="mt-1 text-[13px] font-medium text-ink-900">{e.summary}</div>
          <div className="text-[12.5px] text-muted">{e.description}</div>
        </div>
        <Button size="sm" variant="ink" onClick={run} disabled={busy}><Play size={12} /> {busy ? "Running…" : "Try it"}</Button>
      </div>
      <pre className="overflow-x-auto border-t border-rule bg-ink-950 px-4 py-2.5 font-mono text-[11.5px] leading-relaxed text-ink-200">{curl}</pre>
      {out !== null && (
        <div className="border-t border-rule">
          <div className="flex items-center justify-between px-4 py-1.5 text-[11.5px] text-muted"><span>Response <span className={clsx("font-semibold", status && status < 300 ? "text-green" : "text-risk")}>{status}</span></span><button onClick={() => setOut(null)} className="hover:text-ink-900">Close</button></div>
          <pre className="max-h-[320px] overflow-auto bg-paper-2 px-4 py-2.5 font-mono text-[11.5px] leading-relaxed text-ink-800">{out}</pre>
        </div>
      )}
    </Panel>
  );
}
