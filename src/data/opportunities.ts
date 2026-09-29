import type { Opportunity } from "@/lib/domain/schemas";

/**
 * Innovation portal: research calls, challenges and pilots.
 * DEMONSTRATION RECORDS. `origin` records *why* the opportunity exists —
 * most are generated from evidence gaps, model sensitivity or conflicting
 * evidence found by the platform itself.
 */
export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "OP-01", kind: "research-call", title: "Does resurvey-before-digitisation prevent dispute spikes in riverine districts?",
    summary: "Quasi-experimental study comparing villages digitised with and without prior resurvey in erosion-affected districts. Resolves the conflict between RS-004 and the digitisation–dispute consensus.",
    intervention: "record-digitization", outcome: "dispute-incidence", regions: ["AS", "UP", "OD"], status: "open", deadline: "2026-12-15", budgetLakh: 45,
    partners: ["State revenue departments", "Remote sensing centres"], origin: "conflict",
  },
  {
    id: "OP-02", kind: "research-call", title: "Measuring urbanisation-driven dispute drift with district panels",
    summary: "The simulation's status-quo trajectory is most sensitive to the urbanisation drift assumption (A11), which rests on a single cross-section. Build a multi-state district panel to estimate it properly.",
    intervention: "infrastructure", outcome: "dispute-incidence", regions: ["UP", "MH", "KA", "RJ"], status: "open", deadline: "2027-01-31", budgetLakh: 60,
    partners: ["Universities", "Court data teams"], origin: "sensitivity",
  },
  {
    id: "OP-03", kind: "challenge", title: "Open challenge: satellite flags for unauthorised land-use change",
    summary: "Build and validate change-detection tools that help planning authorities enforce zoning without adding field staff.",
    intervention: "zoning", outcome: "land-use-change", regions: ["MH", "KA", "UP"], status: "open", deadline: "2026-11-30", budgetLakh: 25,
    partners: ["Startups", "Academic GIS labs"], origin: "ministry-priority",
  },
  {
    id: "OP-04", kind: "research-call", title: "Tenancy reform and equity outcomes: first rigorous evaluation",
    summary: "The evidence gap map shows almost no causal evidence on tenancy reform beyond credit. Evaluate equity and tenure-security effects of leasing registration.",
    intervention: "tenancy-reform", outcome: "equity", regions: ["MH", "KA", "OD"], status: "open", deadline: "2027-02-28", budgetLakh: 38,
    partners: ["Agricultural universities"], origin: "evidence-gap",
  },
  {
    id: "OP-05", kind: "pilot", title: "Registration–mutation integration pilot, 12 tehsils",
    summary: "Automatic mutation on registration in 12 tehsils with a matched comparison group and monthly processing-time monitoring.",
    intervention: "e-mutation", outcome: "processing-time", regions: ["UP", "D157", "D141"], status: "active", progress: 62,
    partners: ["UP Revenue Department (demo)", "NIC (demo)"], origin: "ministry-priority",
  },
  {
    id: "OP-06", kind: "pilot", title: "Mobile revenue courts in flood season",
    summary: "Seasonal on-site adjudication of erosion-related boundary disputes using updated drone maps.",
    intervention: "dispute-resolution", outcome: "dispute-incidence", regions: ["AS", "D303", "D301", "D308"], status: "active", progress: 41,
    partners: ["Assam Revenue & DM Department (demo)"], origin: "evidence-gap",
  },
  {
    id: "OP-07", kind: "pilot", title: "Coastal setback zoning with mangrove restoration",
    summary: "Integrates hazard setbacks into land-use plans for four coastal blocks, funded through watershed and coastal programmes.",
    intervention: "climate-adaptation", outcome: "climate-resilience", regions: ["OD", "D379", "D387"], status: "active", progress: 78,
    partners: ["Odisha Revenue Department (demo)", "Forest Department (demo)"], origin: "ministry-priority",
  },
  {
    id: "OP-08", kind: "pilot", title: "Peri-urban land pooling with tenant safeguards",
    summary: "Tests whether recording tenants before pooling extends benefits beyond landowners.",
    intervention: "land-pooling", outcome: "equity", regions: ["MH", "D521"], status: "in-review", progress: 12,
    partners: ["Planning authority (demo)"], origin: "conflict",
  },
  {
    id: "OP-09", kind: "fellowship", title: "Land governance policy fellowship 2026–27",
    summary: "Twelve-month placements for researchers inside state revenue departments to co-design and evaluate reforms.",
    intervention: "record-digitization", regions: ["IN"], status: "open", deadline: "2026-11-15", budgetLakh: 120,
    partners: ["DoLR (demo)", "Universities"], origin: "ministry-priority",
  },
  {
    id: "OP-10", kind: "research-call", title: "Women's land rights: what makes joint titling stick?",
    summary: "Evidence on persistence of joint-titling gains is limited to case studies. Longitudinal study across three states.",
    intervention: "gender-rights", outcome: "tenure-security", regions: ["KA", "OD", "RJ"], status: "in-review", deadline: "2026-10-31", budgetLakh: 30,
    partners: ["Women's collectives", "Universities"], origin: "evidence-gap",
  },
];
