/** OpenAPI 3.1 description of the public API (served at /api/v1/openapi.json). */
export interface EndpointDoc {
  method: "GET" | "POST";
  path: string;
  summary: string;
  description: string;
  example: string;
  body?: unknown;
  auth?: string;
  format: string;
}

export const ENDPOINTS: EndpointDoc[] = [
  { method: "GET", path: "/api/v1/status", summary: "Platform status", description: "Mode (offline / llm-assisted), active providers, model version and record counts.", example: "/api/v1/status", format: "JSON" },
  { method: "GET", path: "/api/v1/search", summary: "Evidence search", description: "BM25 + concept-vector retrieval with query understanding, facets and per-result explanations. Params: q, type, state, from, to, provenance, limit.", example: "/api/v1/search?q=peri-urban%20land%20disputes&limit=5", format: "JSON" },
  { method: "POST", path: "/api/v1/copilot", summary: "Evidence synthesis", description: "The casefile's Evidence step as an API: retrieves evidence, groups findings by intervention, detects recurring and conflicting findings, suggests datasets, places and a policy package. Every sentence cites source ids.", example: "/api/v1/copilot", body: { question: "How can mutation delays be reduced in Uttar Pradesh?" }, format: "JSON" },
  { method: "POST", path: "/api/v1/simulate", summary: "Simulation and decision", description: "The casefile's Decide step: the evidence-to-decision verdict with its reasons, driver assumption and next study, plus baseline vs scenario over 5 years with evidence-derived bands, sensitivity, confidence and research priorities.", example: "/api/v1/simulate", body: { region: "D521", levers: { digitization: 20, disputeCapacity: 40, rolloutYears: 3, climateInvestment: 0, infrastructure: 0, zoning: 71 } }, format: "JSON" },
  { method: "GET", path: "/api/v1/evidence", summary: "Evidence catalogue", description: "All evidence records with metadata, findings, provenance and links.", example: "/api/v1/evidence", format: "JSON" },
  { method: "GET", path: "/api/v1/evidence/{id}", summary: "Evidence record", description: "One record, the model assumptions it calibrates or contradicts, and similar records.", example: "/api/v1/evidence/RS-018", format: "JSON" },
  { method: "GET", path: "/api/v1/regions", summary: "Regions & indicators", description: "States and districts with 16 indicators. Params: level, parent.", example: "/api/v1/regions?level=state", format: "JSON" },
  { method: "GET", path: "/api/v1/regions/{code}", summary: "Region profile", description: "Indicators, 2019–2025 series, child districts and linked evidence.", example: "/api/v1/regions/D521", format: "JSON" },
  { method: "GET", path: "/api/v1/geo/{layer}", summary: "GeoJSON layers", description: "State or district boundaries joined with indicator values. Param: state.", example: "/api/v1/geo/districts?state=OD", format: "GeoJSON" },
  { method: "GET", path: "/api/v1/datasets", summary: "DCAT catalogue", description: "DCAT-AP JSON-LD catalogue for harvesting by CKAN / open-data portals.", example: "/api/v1/datasets", format: "JSON-LD" },
  { method: "GET", path: "/api/v1/indicators.csv", summary: "Indicator panel (CSV)", description: "Bulk download of the indicator panel. Param: level.", example: "/api/v1/indicators.csv?level=state", format: "CSV" },
  { method: "POST", path: "/api/v1/brief", summary: "Compose policy brief", description: "Evidence-backed, fingerprinted brief (JSON or Markdown). Requires researcher, policymaker or admin role (x-demo-role header).", example: "/api/v1/brief", body: { question: "How can land disputes be reduced in Pune?", region: "D521", levers: { digitization: 20, disputeCapacity: 40, rolloutYears: 3, climateInvestment: 0, infrastructure: 0, zoning: 71 }, format: "markdown" }, auth: "x-demo-role: policymaker", format: "JSON / Markdown" },
];

export function openApiSpec() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const e of ENDPOINTS) {
    const p = e.path;
    paths[p] ??= {};
    paths[p][e.method.toLowerCase()] = {
      summary: e.summary,
      description: e.description,
      ...(e.body ? { requestBody: { content: { "application/json": { example: e.body } } } } : {}),
      ...(e.auth ? { parameters: [{ in: "header", name: "x-demo-role", required: true, schema: { type: "string", enum: ["researcher", "policymaker", "admin"] } }] } : {}),
      responses: { "200": { description: e.format } },
    };
  }
  return {
    openapi: "3.1.0",
    info: { title: "Bhū-Pramāṇa API", version: "1.1.0", description: "Open APIs of the National Land Policy Evidence Lab. Demonstration data — not official government records." },
    servers: [{ url: "/" }],
    paths,
  };
}
