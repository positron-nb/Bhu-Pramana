import type { InterventionId, OutcomeId } from "@/lib/domain/schemas";

export interface InterventionDef {
  id: InterventionId;
  label: string;
  short: string;
  description: string;
  /** Concept ids that signal this intervention in text and queries. */
  concepts: string[];
  /** Policy Lab lever that operationalises this intervention, if any. */
  lever?: "digitization" | "disputeCapacity" | "climateInvestment" | "infrastructure" | "zoning";
}

export interface OutcomeDef {
  id: OutcomeId;
  label: string;
  short: string;
  description: string;
  concepts: string[];
}

export const INTERVENTIONS: InterventionDef[] = [
  {
    id: "record-digitization",
    label: "Land record digitisation & map linkage",
    short: "Digitisation",
    description: "Computerising Records of Rights and linking them to digitised cadastral maps and registration.",
    concepts: ["land-records", "digitization", "cadastral-map", "dilrmp", "ulpin", "registration"],
    lever: "digitization",
  },
  {
    id: "e-mutation",
    label: "Online / automatic mutation",
    short: "e-Mutation",
    description: "Automatic update of the Record of Rights after registration, removing manual mutation steps.",
    concepts: ["mutation", "registration", "service-delivery"],
    lever: "digitization",
  },
  {
    id: "resurvey",
    label: "Modern resurvey & drone mapping",
    short: "Resurvey",
    description: "Drone / CORS-based resurvey of rural and peri-urban parcels (SVAMITVA-type approaches).",
    concepts: ["survey", "drone-survey", "svamitva", "cadastral-map", "abadi"],
  },
  {
    id: "conclusive-titling",
    label: "Conclusive titling & title guarantee",
    short: "Conclusive titling",
    description: "Moving from presumptive to state-guaranteed conclusive titles with a title-insurance backstop.",
    concepts: ["titling", "tenure-security", "land-records"],
  },
  {
    id: "dispute-resolution",
    label: "Dispute-resolution capacity (revenue courts, ADR)",
    short: "Dispute resolution",
    description: "Fast-track revenue courts, land tribunals, Lok Adalats and mediation capacity.",
    concepts: ["land-disputes", "revenue-courts", "adr", "litigation"],
    lever: "disputeCapacity",
  },
  {
    id: "zoning",
    label: "Land-use zoning & master-plan enforcement",
    short: "Zoning",
    description: "Statutory land-use plans, conversion controls and enforcement in rural–urban fringes.",
    concepts: ["zoning", "land-use-planning", "land-conversion", "peri-urban"],
    lever: "zoning",
  },
  {
    id: "land-pooling",
    label: "Land pooling & readjustment",
    short: "Land pooling",
    description: "Voluntary pooling of parcels for planned development with returned serviced plots.",
    concepts: ["land-pooling", "peri-urban", "urban-expansion"],
  },
  {
    id: "acquisition-reform",
    label: "Acquisition consent & compensation reform",
    short: "Acquisition reform",
    description: "Consent, social impact assessment and compensation rules for public land acquisition.",
    concepts: ["land-acquisition", "rfctlarr", "compensation", "displacement"],
  },
  {
    id: "climate-adaptation",
    label: "Climate-resilient land-use investment",
    short: "Climate adaptation",
    description: "Watershed treatment, flood-plain zoning, mangrove and soil restoration tied to land-use plans.",
    concepts: ["climate-vulnerability", "land-degradation", "flood", "drought", "watershed"],
    lever: "climateInvestment",
  },
  {
    id: "infrastructure",
    label: "Rural infrastructure expansion",
    short: "Infrastructure",
    description: "Road, utility and corridor expansion that changes land values and land-use pressure.",
    concepts: ["rural-infrastructure", "roads", "corridors", "land-value"],
    lever: "infrastructure",
  },
  {
    id: "tenancy-reform",
    label: "Tenancy & leasing legalisation",
    short: "Tenancy reform",
    description: "Legal recognition of agricultural leasing so tenants can access credit and insurance.",
    concepts: ["tenancy", "land-leasing", "credit"],
  },
  {
    id: "gender-rights",
    label: "Joint titling & women's land rights",
    short: "Women's land rights",
    description: "Joint or individual titles for women, inheritance enforcement and mutation drives.",
    concepts: ["gender", "inheritance", "tenure-security"],
  },
];

export const OUTCOMES: OutcomeDef[] = [
  { id: "dispute-incidence", label: "Land disputes & litigation", short: "Disputes", description: "Incidence and pendency of land-related disputes.", concepts: ["land-disputes", "litigation"] },
  { id: "processing-time", label: "Service delivery time", short: "Processing time", description: "Time taken for mutation, registration and record correction.", concepts: ["service-delivery", "mutation"] },
  { id: "tenure-security", label: "Tenure security", short: "Tenure security", description: "Perceived and legal security of land rights.", concepts: ["tenure-security", "titling"] },
  { id: "credit-access", label: "Credit & investment", short: "Credit", description: "Access to formal credit and on-farm investment.", concepts: ["credit", "land-value"] },
  { id: "land-use-change", label: "Land-use conversion pressure", short: "Land-use change", description: "Conversion of agricultural and ecological land to other uses.", concepts: ["land-conversion", "urban-expansion", "land-use-planning"] },
  { id: "climate-resilience", label: "Climate resilience", short: "Resilience", description: "Resilience of land systems to floods, drought and heat.", concepts: ["climate-vulnerability", "land-degradation"] },
  { id: "revenue", label: "Revenue & stamp duty", short: "Revenue", description: "Registration fees, stamp duty and land revenue.", concepts: ["stamp-duty", "registration"] },
  { id: "equity", label: "Equity & inclusion", short: "Equity", description: "Distribution of benefits across women, tenants, tribal and marginal holders.", concepts: ["gender", "tribal-rights", "tenancy"] },
  { id: "implementation", label: "Implementation feasibility", short: "Implementation", description: "Administrative capacity, cost and pace of roll-out.", concepts: ["administrative-capacity", "service-delivery"] },
];

export const interventionById = Object.fromEntries(INTERVENTIONS.map((i) => [i.id, i])) as Record<InterventionId, InterventionDef>;
export const outcomeById = Object.fromEntries(OUTCOMES.map((o) => [o.id, o])) as Record<OutcomeId, OutcomeDef>;
