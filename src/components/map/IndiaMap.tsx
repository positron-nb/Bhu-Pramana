"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MapLibreMap, NavigationControl, setWorkerUrl, type ExpressionSpecification, type GeoJSONSource, type MapMouseEvent } from "maplibre-gl";
import { indicatorById } from "@/data/indicators";
import type { IndicatorId } from "@/lib/domain/schemas";
import { DISTRICTS, regionByCode } from "@/lib/data/regions";
import { computeBreaks, type MapBreaks } from "./breaks";

/**
 * India map rendered fully offline: bundled vector boundaries (DataMeet,
 * CC BY), no remote basemap or glyphs required. Optional online street
 * context can be toggled on.
 */

// served from /public (see scripts/copy-maplibre-worker.mjs) so no CDN is needed
if (typeof window !== "undefined") setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`);

type FC = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>;
let geoCache: Promise<{ states: FC; districts: FC; outline: FC }> | null = null;
function loadGeo() {
  geoCache ??= Promise.all(["states", "districts", "india-outline"].map((n) => fetch(`/geo/${n}.geojson`).then((r) => { if (!r.ok) throw new Error(`Failed to load ${n}`); return r.json(); }))).then(([states, districts, outline]) => ({ states, districts, outline }));
  return geoCache;
}

function colorExpr(b: MapBreaks): ExpressionSpecification {
  const expr: unknown[] = ["step", ["coalesce", ["get", "v"], -1], "#e7e0d1"];
  // first real class starts at the minimum
  expr.push(b.min - 1e-6, b.ramp[0]);
  const uniq: number[] = [];
  b.breaks.forEach((x, i) => { if (!uniq.length || x > uniq[uniq.length - 1]) { uniq.push(x); expr.push(x, b.ramp[i + 1]); } });
  return expr as ExpressionSpecification;
}

export interface IndiaMapProps {
  layer: IndicatorId;
  level: "state" | "district";
  selected?: string | null;
  compare?: string | null;
  highlight?: string[];
  pilots?: string[];
  heat?: boolean;
  streets?: boolean;
  onSelect?: (code: string) => void;
  className?: string;
  interactive?: boolean;
  fitTo?: string | null;
  /** Extra padding (px) so fitted regions are not hidden under overlay panels. */
  padding?: { top: number; bottom: number; left: number; right: number };
}

export function IndiaMap({ layer, level, selected, compare, highlight = [], pilots = [], heat = false, streets = false, onSelect, className, interactive = true, fitTo, padding }: IndiaMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; code: string } | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const breaks = useMemo(() => computeBreaks(layer, level), [layer, level]);

  // init once
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = new MapLibreMap({
      container: el.current,
      style: {
        version: 8,
        sources: {
          osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" },
        },
        layers: [
          { id: "sea", type: "background", paint: { "background-color": "#dfe7ea" } },
          { id: "osm", type: "raster", source: "osm", layout: { visibility: "none" }, paint: { "raster-opacity": 0.55, "raster-saturation": -0.6 } },
        ],
      },
      center: [80.6, 22.6],
      zoom: 3.55,
      minZoom: 3,
      maxZoom: 11,
      attributionControl: { compact: true, customAttribution: "Boundaries © DataMeet (CC BY) · Demonstration data" },
      interactive,
      dragRotate: false,
      pitchWithRotate: false,
    });
    m.touchZoomRotate.disableRotation();
    if (interactive) m.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.current = m;
    m.on("load", async () => {
      try {
        const geo = await loadGeo();
        m.addSource("outline", { type: "geojson", data: geo.outline });
        m.addSource("states", { type: "geojson", data: geo.states, promoteId: "code" });
        m.addSource("districts", { type: "geojson", data: geo.districts, promoteId: "code" });
        m.addSource("centroids", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({ id: "states-fill", type: "fill", source: "states", paint: { "fill-color": "#efe8da", "fill-opacity": 0.95 } });
        m.addLayer({ id: "districts-fill", type: "fill", source: "districts", paint: { "fill-color": "#efe8da", "fill-opacity": 0.95 } });
        m.addLayer({ id: "heat", type: "heatmap", source: "centroids", layout: { visibility: "none" }, paint: {
          "heatmap-weight": ["get", "w"], "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 0.9, 7, 1.6],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 16, 6, 34, 9, 60],
          "heatmap-opacity": 0.72,
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(251,238,221,0)", 0.25, "#f6d3ac", 0.5, "#e3924d", 0.75, "#a8540f", 1, "#5d2a05"],
        } });
        m.addLayer({ id: "districts-line", type: "line", source: "districts", paint: { "line-color": "#7a6f5c", "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 7, 0.8], "line-opacity": 0.55 } });
        m.addLayer({ id: "states-line", type: "line", source: "states", paint: { "line-color": "#1f3656", "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.55, 7, 1.4], "line-opacity": 0.75 } });
        m.addLayer({ id: "outline-line", type: "line", source: "outline", paint: { "line-color": "#0c1828", "line-width": 1.3 } });
        m.addLayer({ id: "pilots-line", type: "line", source: "districts", filter: ["in", ["get", "code"], ["literal", []]], paint: { "line-color": "#1f8a5b", "line-width": 2, "line-dasharray": [2, 1.2] } });
        m.addLayer({ id: "highlight-line", type: "line", source: "districts", filter: ["in", ["get", "code"], ["literal", []]], paint: { "line-color": "#0c1828", "line-width": 1.6 } });
        m.addLayer({ id: "hover-line", type: "line", source: "districts", filter: ["==", ["get", "code"], ""], paint: { "line-color": "#0c1828", "line-width": 1.8 } });
        m.addLayer({ id: "hover-line-s", type: "line", source: "states", filter: ["==", ["get", "code"], ""], paint: { "line-color": "#0c1828", "line-width": 1.8 } });
        m.addLayer({ id: "compare-line", type: "line", source: "districts", filter: ["==", ["get", "code"], ""], paint: { "line-color": "#3a6db0", "line-width": 2.6, "line-dasharray": [1.5, 1] } });
        m.addLayer({ id: "compare-line-s", type: "line", source: "states", filter: ["==", ["get", "code"], ""], paint: { "line-color": "#3a6db0", "line-width": 2.6, "line-dasharray": [1.5, 1] } });
        m.addLayer({ id: "selected-line", type: "line", source: "districts", filter: ["==", ["get", "code"], ""], paint: { "line-color": "#c96f16", "line-width": 3 } });
        m.addLayer({ id: "selected-line-s", type: "line", source: "states", filter: ["==", ["get", "code"], ""], paint: { "line-color": "#c96f16", "line-width": 3 } });
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Map data failed to load");
      }
    });
    // raster tile errors (e.g. offline street context) are non-fatal: the vector map keeps working
    m.on("error", () => {});
    return () => {
      m.remove();
      map.current = null;
    };
  }, [interactive]);

  // data join + styling
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    loadGeo().then((geo) => {
      const withV = (fc: FC): FC => ({ ...fc, features: fc.features.map((f) => ({ ...f, properties: { ...f.properties, v: regionByCode[f.properties.code as string]?.indicators[layer] ?? null } })) });
      (m.getSource("states") as GeoJSONSource).setData(withV(geo.states));
      (m.getSource("districts") as GeoJSONSource).setData(withV(geo.districts));
      const vals = DISTRICTS.map((d) => d.indicators[layer]);
      const lo = Math.min(...vals), hi = Math.max(...vals);
      const inv = indicatorById[layer].higherIsBetter;
      (m.getSource("centroids") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: DISTRICTS.map((d) => {
          const n = (d.indicators[layer] - lo) / (hi - lo || 1);
          return { type: "Feature", geometry: { type: "Point", coordinates: d.centroid }, properties: { code: d.code, w: Math.pow(inv ? 1 - n : n, 2) } };
        }),
      });
      const stateBreaks = computeBreaks(layer, "state");
      m.setPaintProperty("states-fill", "fill-color", colorExpr(stateBreaks));
      m.setPaintProperty("states-fill", "fill-opacity", level === "district" ? ["case", ["in", ["get", "code"], ["literal", ["UP", "MH", "KA", "OD", "AS", "RJ"]]], 0, 0.55] : 0.95);
      m.setPaintProperty("districts-fill", "fill-color", colorExpr(breaks));
      m.setLayoutProperty("districts-fill", "visibility", level === "district" ? "visible" : "none");
      m.setLayoutProperty("districts-line", "visibility", level === "district" ? "visible" : "none");
    });
  }, [ready, layer, level, breaks]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    m.setLayoutProperty("heat", "visibility", heat ? "visible" : "none");
    m.setLayoutProperty("osm", "visibility", streets ? "visible" : "none");
    m.setFilter("pilots-line", ["in", ["get", "code"], ["literal", pilots]]);
    m.setFilter("highlight-line", ["in", ["get", "code"], ["literal", highlight]]);
    const sel = selected ?? "";
    const cmp = compare ?? "";
    m.setFilter("selected-line", ["==", ["get", "code"], sel]);
    m.setFilter("selected-line-s", ["==", ["get", "code"], sel]);
    m.setFilter("compare-line", ["==", ["get", "code"], cmp]);
    m.setFilter("compare-line-s", ["==", ["get", "code"], cmp]);
  }, [ready, heat, streets, pilots, highlight, selected, compare]);

  // fly to region
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const code = fitTo === undefined ? selected : fitTo;
    const r = code ? regionByCode[code] : null;
    if (r?.bbox && r.level !== "country") {
      const [x0, y0, x1, y1] = r.bbox;
      const wide = (el.current?.clientWidth ?? 0) > 900;
      m.fitBounds([[x0, y0], [x1, y1]], { padding: wide && padding ? padding : 40, maxZoom: r.level === "district" ? 7 : 5.8, duration: 700 });
    } else if (!code || r?.level === "country") {
      const wide = (el.current?.clientWidth ?? 0) > 900;
      m.easeTo({ center: [80.6, 22.6], zoom: 3.55, duration: 600, padding: wide && padding ? padding : undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fitTo, selected]);

  // interaction
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !interactive) return;
    const layers = level === "district" ? ["districts-fill", "states-fill"] : ["states-fill"];
    const pick = (e: MapMouseEvent) => {
      const fs = m.queryRenderedFeatures(e.point, { layers });
      const f = fs.find((x) => x.layer.id === "districts-fill") ?? fs[0];
      return (f?.properties?.code as string | undefined) ?? null;
    };
    const move = (e: MapMouseEvent) => {
      const code = pick(e);
      m.getCanvas().style.cursor = code ? "pointer" : "";
      const isD = code?.startsWith("D");
      m.setFilter("hover-line", ["==", ["get", "code"], isD ? code! : ""]);
      m.setFilter("hover-line-s", ["==", ["get", "code"], !isD && code ? code : ""]);
      setTip(code ? { x: e.point.x, y: e.point.y, code } : null);
    };
    const leave = () => { setTip(null); m.setFilter("hover-line", ["==", ["get", "code"], ""]); m.setFilter("hover-line-s", ["==", ["get", "code"], ""]); };
    const click = (e: MapMouseEvent) => { const code = pick(e); if (code) onSelectRef.current?.(code); };
    m.on("mousemove", move);
    m.on("mouseout", leave);
    m.on("click", click);
    return () => { m.off("mousemove", move); m.off("mouseout", leave); m.off("click", click); };
  }, [ready, level, interactive]);

  const tipRegion = tip ? regionByCode[tip.code] : null;
  const def = indicatorById[layer];
  return (
    <div className={className ?? "relative h-full w-full"}>
      <div ref={el} className="h-full w-full" aria-label="Map of India" role="application" />
      {!ready && !error && (
        <div className="absolute inset-0 grid place-items-center bg-[#dfe7ea]">
          <div className="text-[12.5px] text-muted animate-pulse-soft">Loading boundaries…</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-paper-2 p-6 text-center text-[13px] text-risk">Map could not load: {error}</div>
      )}
      {tip && tipRegion && (
        <div className="pointer-events-none absolute z-10 rounded-md border border-rule bg-card px-2.5 py-1.5 text-[12px] shadow-float" style={{ left: tip.x + 14, top: tip.y + 12 }}>
          <div className="font-semibold text-ink-900">{tipRegion.name}</div>
          <div className="text-[11px] text-muted">{tipRegion.level === "district" ? `District · ${regionByCode[tipRegion.parent!]?.name}` : "State / UT"}</div>
          <div className="mt-0.5 tabular text-ink-800">
            {def.short}: <strong>{tipRegion.indicators[layer]?.toFixed(def.decimals)}</strong> {def.unit !== "index" ? def.unit : ""}
          </div>
        </div>
      )}
    </div>
  );
}
