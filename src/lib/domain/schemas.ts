/**
 * Core domain model for Bhū-Pramāṇa.
 *
 * Every record in the platform carries an epistemic label (pramāṇa):
 *  - pratyaksha : observed  — datasets, indicators, remote-sensing layers
 *  - shabda     : documented — research, law, policy, case studies, reports
 *  - anumana    : inferred  — simulations, syntheses, model assumptions
 *
 * Schemas are the single source of truth: seed data is validated against
 * them in tests, and API routes validate request bodies with them.
 */
import { z } from "zod";

export const PRAMANA = ["pratyaksha", "shabda", "anumana"] as const;
export const PramanaSchema = z.enum(PRAMANA);
export type Pramana = z.infer<typeof PramanaSchema>;

/* ------------------------------------------------------------------ */
/* Taxonomy: interventions (policy levers) and outcomes                */
/* ------------------------------------------------------------------ */

export const INTERVENTION_IDS = [
  "record-digitization",
  "e-mutation",
  "resurvey",
  "conclusive-titling",
  "dispute-resolution",
  "zoning",
  "land-pooling",
  "acquisition-reform",
  "climate-adaptation",
  "infrastructure",
  "tenancy-reform",
  "gender-rights",
] as const;
export const InterventionIdSchema = z.enum(INTERVENTION_IDS);
export type InterventionId = z.infer<typeof InterventionIdSchema>;

export const OUTCOME_IDS = [
  "dispute-incidence",
  "processing-time",
  "tenure-security",
  "credit-access",
  "land-use-change",
  "climate-resilience",
  "revenue",
  "equity",
  "implementation",
] as const;
export const OutcomeIdSchema = z.enum(OUTCOME_IDS);
export type OutcomeId = z.infer<typeof OutcomeIdSchema>;

/* ------------------------------------------------------------------ */
/* Evidence records                                                    */
/* ------------------------------------------------------------------ */

export const EVIDENCE_TYPES = ["research", "policy", "law", "dataset", "case-study", "report"] as const;
export const EvidenceTypeSchema = z.enum(EVIDENCE_TYPES);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const STUDY_DESIGNS = [
  "systematic-review",
  "rct",
  "quasi-experimental",
  "panel",
  "cross-sectional",
  "case-study",
  "qualitative",
  "modelling",
  "administrative",
  "statutory",
  "expert-opinion",
] as const;
export const StudyDesignSchema = z.enum(STUDY_DESIGNS);
export type StudyDesign = z.infer<typeof StudyDesignSchema>;

/**
 * reference  — a real, public document or programme; we store metadata and a
 *              link only, never claim numbers from it.
 * synthetic  — a demonstration record written for this prototype. Always
 *              labelled in the UI as "Demonstration record".
 */
export const ProvenanceSchema = z.enum(["reference", "synthetic"]);
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const FindingSchema = z.object({
  id: z.string(),
  intervention: InterventionIdSchema,
  outcome: OutcomeIdSchema,
  direction: z.enum(["decrease", "increase", "no-effect", "mixed"]),
  /** Effect size, e.g. -14 (%) for "disputes fell 14%". */
  effect: z
    .object({
      value: z.number(),
      unit: z.enum(["%", "pp", "days", "index"]),
      low: z.number().optional(),
      high: z.number().optional(),
      per: z.string().optional(),
    })
    .optional(),
  statement: z.string().min(10),
  context: z.string().optional(),
});
export type Finding = z.infer<typeof FindingSchema>;

export const GeographySchema = z.object({
  scope: z.enum(["national", "multi-state", "state", "district", "international"]),
  /** Region codes: state codes (e.g. "UP") or district codes (e.g. "D521"). */
  regions: z.array(z.string()),
});
export type Geography = z.infer<typeof GeographySchema>;

export const EvidenceSchema = z.object({
  id: z.string().regex(/^[A-Z]{2}-\d{3}$/),
  type: EvidenceTypeSchema,
  title: z.string().min(8),
  source: z.string(),
  authors: z.array(z.string()).optional(),
  year: z.number().int().min(1850).max(2026),
  geography: GeographySchema,
  concepts: z.array(z.string()).min(1),
  tags: z.array(z.string()),
  summary: z.string().min(40),
  findings: z.array(FindingSchema),
  design: StudyDesignSchema,
  sample: z.string().optional(),
  url: z.string().url().optional(),
  provenance: ProvenanceSchema,
  license: z.string().optional(),
  /** Explicit links to other evidence (policy evaluated, law cited, …). */
  related: z.array(z.string()).default([]),
  /** Dataset records used by this study. */
  datasets: z.array(z.string()).default([]),
  /** Indicator ids measured or provided. */
  indicators: z.array(z.string()).default([]),
  /** For datasets: format / coverage / update cadence. */
  distribution: z
    .object({
      format: z.array(z.string()),
      coverage: z.string(),
      cadence: z.string(),
      records: z.string().optional(),
    })
    .optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

/* ------------------------------------------------------------------ */
/* Controlled vocabulary (LandVoc-inspired)                            */
/* ------------------------------------------------------------------ */

export const ConceptSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Synonyms, acronyms, vernacular terms (e.g. "khatauni", "dakhil kharij"). */
  alt: z.array(z.string()),
  broader: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  group: z.enum(["tenure", "administration", "disputes", "land-use", "climate", "urban", "infrastructure", "finance", "equity", "method", "law"]),
});
export type Concept = z.infer<typeof ConceptSchema>;

/* ------------------------------------------------------------------ */
/* Regions & indicators                                                */
/* ------------------------------------------------------------------ */

export const INDICATOR_IDS = [
  "digitization",
  "mapLinkage",
  "disputePressure",
  "pendingCases",
  "mutationDays",
  "urbanGrowth",
  "builtUp",
  "landUsePressure",
  "climateVulnerability",
  "climateResilience",
  "degradation",
  "roadDensity",
  "adminCapacity",
  "zoningStrictness",
  "womenOwnership",
  "researchActivity",
] as const;
export const IndicatorIdSchema = z.enum(INDICATOR_IDS);
export type IndicatorId = z.infer<typeof IndicatorIdSchema>;

export const IndicatorDefSchema = z.object({
  id: IndicatorIdSchema,
  label: z.string(),
  short: z.string(),
  unit: z.string(),
  description: z.string(),
  domain: z.enum(["administration", "disputes", "land-use", "climate", "infrastructure", "equity", "research"]),
  /** true when a higher value is a better governance outcome. */
  higherIsBetter: z.boolean(),
  min: z.number(),
  max: z.number(),
  decimals: z.number().int().min(0).max(2),
  /** Real-world source the demo indicator is modelled on (structure only). */
  modelledOn: z.string(),
  outcome: OutcomeIdSchema.optional(),
});
export type IndicatorDef = z.infer<typeof IndicatorDefSchema>;

export const RegionSchema = z.object({
  code: z.string(),
  name: z.string(),
  level: z.enum(["country", "state", "district"]),
  parent: z.string().nullable(),
  centroid: z.tuple([z.number(), z.number()]),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  population: z.number(),
  areaKm2: z.number(),
  /** Focus regions carry district-level detail in the demo dataset. */
  focus: z.boolean(),
  archetypes: z.array(z.string()),
  indicators: z.record(IndicatorIdSchema, z.number()),
  /** Annual series 2019–2025 for headline indicators. */
  series: z.record(z.string(), z.array(z.number())),
});
export type Region = z.infer<typeof RegionSchema>;

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

export const LEVER_IDS = ["digitization", "disputeCapacity", "rolloutYears", "climateInvestment", "infrastructure", "zoning"] as const;
export const LeverIdSchema = z.enum(LEVER_IDS);
export type LeverId = z.infer<typeof LeverIdSchema>;

export const LeversSchema = z.object({
  /** Percentage-point increase in digitised & map-linked records. */
  digitization: z.number().min(0).max(40),
  /** % increase in dispute-resolution capacity (revenue courts, ADR, tribunals). */
  disputeCapacity: z.number().min(0).max(100),
  /** Years over which reforms are rolled out (implementation speed). */
  rolloutYears: z.number().min(1).max(5),
  /** Climate-resilient land-use investment, % of land-sector budget. */
  climateInvestment: z.number().min(0).max(30),
  /** % expansion of rural road / utility network. */
  infrastructure: z.number().min(0).max(50),
  /** Zoning strictness index, 0 (laissez-faire) – 100 (strict). */
  zoning: z.number().min(0).max(100),
});
export type Levers = z.infer<typeof LeversSchema>;

export const AssumptionSchema = z.object({
  id: z.string().regex(/^A\d{2}$/),
  key: z.string(),
  label: z.string(),
  description: z.string(),
  central: z.number(),
  low: z.number(),
  high: z.number(),
  unit: z.string(),
  intervention: InterventionIdSchema,
  outcome: OutcomeIdSchema,
  supporting: z.array(z.string()),
  contradicting: z.array(z.string()).default([]),
  rationale: z.string(),
});
export type Assumption = z.infer<typeof AssumptionSchema>;

export const OUTPUT_IDS = ["disputePressure", "processingDays", "digitizationCoverage", "landUsePressure", "climateResilience", "implementationScore"] as const;
export type OutputId = (typeof OUTPUT_IDS)[number];

export const SimulateRequestSchema = z.object({
  region: z.string().default("IN"),
  levers: LeversSchema,
  horizon: z.number().int().min(1).max(10).default(5),
});
export type SimulateRequest = z.infer<typeof SimulateRequestSchema>;

/* ------------------------------------------------------------------ */
/* Innovation / research agenda                                        */
/* ------------------------------------------------------------------ */

export const OpportunitySchema = z.object({
  id: z.string(),
  kind: z.enum(["research-call", "challenge", "pilot", "fellowship"]),
  title: z.string(),
  summary: z.string(),
  intervention: InterventionIdSchema,
  outcome: OutcomeIdSchema.optional(),
  regions: z.array(z.string()),
  status: z.enum(["open", "in-review", "active", "closed"]),
  deadline: z.string().optional(),
  budgetLakh: z.number().optional(),
  partners: z.array(z.string()),
  progress: z.number().min(0).max(100).optional(),
  origin: z.enum(["evidence-gap", "sensitivity", "conflict", "ministry-priority"]),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */

export const ROLES = ["public", "researcher", "policymaker", "admin"] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;
