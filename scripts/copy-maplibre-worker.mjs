// MapLibre GL v6 ships its web worker as a separate ES module that bundlers do
// not emit. Copy it (and the shared chunk it imports) into /public so the map
// works fully offline; IndiaMap calls setWorkerUrl("/maplibre/…").
import fs from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "node_modules", "maplibre-gl", "dist");
const dst = path.join(process.cwd(), "public", "maplibre");
fs.mkdirSync(dst, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
}
console.log("maplibre worker copied to public/maplibre");
