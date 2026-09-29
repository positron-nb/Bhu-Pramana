import type { Assumption } from "@/lib/domain/schemas";

/**
 * Policy Lab model coefficients. Each coefficient is an evidence-backed
 * assumption: its central value and plausible range are read from the
 * studies listed in `supporting`, and `contradicting` lists evidence that
 * points the other way. Ranges drive the uncertainty band; evidence quality
 * drives the confidence score.
 */
export const ASSUMPTIONS: Assumption[] = [
  {
    id: "A01", key: "digDispute", label: "Digitisation → dispute incidence",
    description: "% change in land-dispute incidence for each +10 pp of digitised, map-linked records.",
    central: -6, low: -2, high: -11, unit: "% per +10 pp",
    intervention: "record-digitization", outcome: "dispute-incidence",
    supporting: ["RS-001", "RS-002", "RS-003", "RS-030", "RP-001"], contradicting: ["RS-004"],
    rationale: "Quasi-experimental and panel estimates cluster at −4% to −9%; the systematic review pools at −6%. Evidence from riverine Assam shows digitisation without resurvey can raise disputes in the short run.",
  },
  {
    id: "A02", key: "capDispute", label: "Dispute-resolution capacity → pendency",
    description: "% change in pending land cases for each +10% of adjudication and mediation capacity.",
    central: -5, low: -2, high: -8, unit: "% per +10%",
    intervention: "dispute-resolution", outcome: "dispute-incidence",
    supporting: ["RS-005", "RS-006", "CS-003"], contradicting: ["RS-007"],
    rationale: "Matched-district and panel evidence finds −4% to −6%. In fast-appreciating peri-urban districts added capacity induces new filings, shrinking the net effect.",
  },
  {
    id: "A03", key: "infraDispute", label: "Infrastructure expansion → disputes",
    description: "% change in disputes for each +10% expansion of road / corridor network (land-value channel).",
    central: 3, low: 1, high: 6, unit: "% per +10%",
    intervention: "infrastructure", outcome: "dispute-incidence",
    supporting: ["RS-008", "RS-009"], contradicting: ["RS-010"],
    rationale: "Corridor studies find disputes rise with land values; where records are mature the effect disappears — so the effect is scaled down by the region's digitisation level.",
  },
  {
    id: "A04", key: "zoningConversion", label: "Zoning enforcement → farmland conversion",
    description: "% change in land-use conversion pressure for each +10 points of zoning enforcement.",
    central: -4, low: -1, high: -7, unit: "% per +10 pts",
    intervention: "zoning", outcome: "land-use-change",
    supporting: ["RS-011", "RS-012", "RP-003"], contradicting: ["RS-013"],
    rationale: "Satellite comparisons around Pune and Bengaluru find −3% to −5%. Very strict zoning without regularisation displaces conversion into informal subdivision.",
  },
  {
    id: "A05", key: "zoningInformal", label: "Over-strict zoning → informal disputes",
    description: "% increase in disputes per +10 points of zoning enforcement above an index of 70.",
    central: 2, low: 0, high: 4, unit: "% per +10 pts above 70",
    intervention: "zoning", outcome: "dispute-incidence",
    supporting: ["RS-013", "CS-004"], contradicting: [],
    rationale: "Only case-study evidence from the NCR fringe; treated as a threshold effect.",
  },
  {
    id: "A06", key: "infraConversion", label: "Infrastructure expansion → conversion pressure",
    description: "% change in land-use conversion pressure for each +10% expansion of road / corridor network.",
    central: 5, low: 2, high: 8, unit: "% per +10%",
    intervention: "infrastructure", outcome: "land-use-change",
    supporting: ["RS-008", "RS-014"], contradicting: [],
    rationale: "Two corridor studies with remote-sensing outcomes estimate +6%; the central value is shaded down to reflect narrower rural roads.",
  },
  {
    id: "A07", key: "climateResilience", label: "Climate investment → resilience",
    description: "Resilience-index points gained per 1% of land-sector budget invested in climate-resilient land use, at average vulnerability.",
    central: 0.9, low: 0.4, high: 1.4, unit: "pts per 1% budget",
    intervention: "climate-adaptation", outcome: "climate-resilience",
    supporting: ["RS-015", "RS-016", "RS-017", "CS-005", "PO-009"], contradicting: [],
    rationale: "Coastal and dryland studies estimate +1.0 to +1.2; floodplain evidence without land allotment is lower (+0.5). Gains scale with vulnerability.",
  },
  {
    id: "A08", key: "digProcessing", label: "Digitisation → mutation time",
    description: "% change in median mutation / processing time for each +10 pp of digitised, linked records.",
    central: -9, low: -4, high: -15, unit: "% per +10 pp",
    intervention: "record-digitization", outcome: "processing-time",
    supporting: ["RS-001", "RS-002", "RS-018", "RS-019", "RS-030"], contradicting: ["CS-002"],
    rationale: "Strongest evidence base in the corpus: estimates range −6% (high staff vacancies) to −14% (registration–mutation integration). System migrations can raise times temporarily.",
  },
  {
    id: "A09", key: "capProcessing", label: "Capacity → processing time",
    description: "% change in processing time for each +10% of revenue court and support capacity.",
    central: -3, low: -1, high: -5, unit: "% per +10%",
    intervention: "dispute-resolution", outcome: "processing-time",
    supporting: ["RS-005", "RS-020"], contradicting: [],
    rationale: "Two panel / matched studies at −3% to −4%, conditional on filling support posts.",
  },
  {
    id: "A10", key: "absorption", label: "Implementation overload penalty",
    description: "Share of planned progress lost per unit of reform ambition above administrative absorptive capacity.",
    central: 0.35, low: 0.2, high: 0.5, unit: "share per unit overload",
    intervention: "record-digitization", outcome: "implementation",
    supporting: ["RS-021", "RP-002"], contradicting: [],
    rationale: "Implementation analysis of state roll-outs; front-loaded targets underperform phased targets when capacity is low.",
  },
  {
    id: "A11", key: "urbanDrift", label: "Urbanisation → baseline dispute drift",
    description: "% per year added to dispute pressure for each 1%/yr of built-up growth, absent policy change.",
    central: 0.6, low: 0.3, high: 0.9, unit: "%/yr per 1%/yr growth",
    intervention: "infrastructure", outcome: "dispute-incidence",
    supporting: ["RS-022", "RP-003"], contradicting: [],
    rationale: "Single multi-state cross-section; governs the status-quo trajectory, so it matters for every scenario.",
  },
  {
    id: "A12", key: "zoningResilience", label: "Hazard zoning → resilience",
    description: "Resilience-index points per +10 points of zoning enforcement, at average vulnerability.",
    central: 1.2, low: 0.3, high: 2.0, unit: "pts per +10 pts",
    intervention: "zoning", outcome: "climate-resilience",
    supporting: ["RS-017", "RS-023", "CS-005"], contradicting: [],
    rationale: "Floodplain and coastal-setback evidence; benefits depend on alternative land allotments and scale with exposure.",
  },
];

export const assumptionById: Record<string, Assumption> = Object.fromEntries(ASSUMPTIONS.map((a) => [a.id, a]));
export const assumptionByKey: Record<string, Assumption> = Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, a]));
