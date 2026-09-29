import type { IndicatorDef, IndicatorId } from "@/lib/domain/schemas";

/**
 * Indicator registry. Values in the demonstration dataset are synthetic; the
 * `modelledOn` field names the real public system whose structure the
 * indicator imitates, so a production deployment knows where to connect.
 */
export const INDICATORS: IndicatorDef[] = [
  { id: "digitization", label: "Land record digitisation index", short: "Digitisation", unit: "%", description: "Composite of RoR computerisation, cadastral map digitisation and registration integration.", domain: "administration", higherIsBetter: true, min: 0, max: 100, decimals: 1, modelledOn: "DILRMP MIS progress components", outcome: "implementation" },
  { id: "mapLinkage", label: "RoR–map linkage", short: "Map linkage", unit: "%", description: "Share of textual records linked to a digitised parcel boundary.", domain: "administration", higherIsBetter: true, min: 0, max: 100, decimals: 1, modelledOn: "DILRMP textual-spatial linkage metric" },
  { id: "disputePressure", label: "Land dispute pressure index", short: "Dispute pressure", unit: "index", description: "Composite of land-case filings, pendency and grievance volume per 100,000 people (0–100).", domain: "disputes", higherIsBetter: false, min: 0, max: 100, decimals: 1, modelledOn: "NJDG / RCCMS case statistics", outcome: "dispute-incidence" },
  { id: "pendingCases", label: "Pending land cases", short: "Pending cases", unit: "per 100k", description: "Pending land and revenue cases per 100,000 population.", domain: "disputes", higherIsBetter: false, min: 0, max: 900, decimals: 0, modelledOn: "RCCMS / NJDG pendency", outcome: "dispute-incidence" },
  { id: "mutationDays", label: "Median mutation time", short: "Mutation time", unit: "days", description: "Median days from registration to updated Record of Rights.", domain: "administration", higherIsBetter: false, min: 1, max: 120, decimals: 0, modelledOn: "State e-mutation service dashboards", outcome: "processing-time" },
  { id: "urbanGrowth", label: "Built-up growth rate", short: "Urban growth", unit: "%/yr", description: "Annual growth in built-up area detected from satellite land-cover.", domain: "land-use", higherIsBetter: false, min: 0, max: 12, decimals: 1, modelledOn: "NRSC / Bhuvan LULC time series", outcome: "land-use-change" },
  { id: "builtUp", label: "Built-up share", short: "Built-up", unit: "%", description: "Share of geographic area classified as built-up.", domain: "land-use", higherIsBetter: false, min: 0, max: 100, decimals: 1, modelledOn: "Bhuvan LULC 1:50k" },
  { id: "landUsePressure", label: "Land-use conversion pressure", short: "Land-use pressure", unit: "index", description: "Composite of farmland-to-non-farm conversion, fragmentation and speculative transactions (0–100).", domain: "land-use", higherIsBetter: false, min: 0, max: 100, decimals: 1, modelledOn: "LULC change + registration transaction data", outcome: "land-use-change" },
  { id: "climateVulnerability", label: "Climate vulnerability index", short: "Climate vulnerability", unit: "0–1", description: "Exposure × sensitivity ÷ adaptive capacity for flood, drought, cyclone and heat hazards.", domain: "climate", higherIsBetter: false, min: 0, max: 1, decimals: 2, modelledOn: "DST common-framework climate vulnerability assessment" },
  { id: "climateResilience", label: "Land-system resilience index", short: "Resilience", unit: "index", description: "Capacity of land and land-use systems to absorb climate shocks (0–100).", domain: "climate", higherIsBetter: true, min: 0, max: 100, decimals: 1, modelledOn: "Composite of watershed coverage, green cover and hazard zoning", outcome: "climate-resilience" },
  { id: "degradation", label: "Degraded land share", short: "Degradation", unit: "%", description: "Share of area under land degradation / desertification processes.", domain: "climate", higherIsBetter: false, min: 0, max: 80, decimals: 1, modelledOn: "ISRO SAC Desertification & Land Degradation Atlas" },
  { id: "roadDensity", label: "Rural road density", short: "Road density", unit: "km/100km²", description: "Length of all-weather rural roads per 100 km².", domain: "infrastructure", higherIsBetter: true, min: 0, max: 400, decimals: 0, modelledOn: "PMGSY / OMMAS road inventory" },
  { id: "adminCapacity", label: "Revenue administration capacity", short: "Admin capacity", unit: "index", description: "Staffing, training and IT readiness of revenue offices (0–100).", domain: "administration", higherIsBetter: true, min: 0, max: 100, decimals: 1, modelledOn: "State revenue department establishment data", outcome: "implementation" },
  { id: "zoningStrictness", label: "Zoning enforcement index", short: "Zoning", unit: "index", description: "Coverage of statutory land-use plans and enforcement of conversion controls (0–100).", domain: "land-use", higherIsBetter: true, min: 0, max: 100, decimals: 0, modelledOn: "Town & Country Planning notified plans" },
  { id: "womenOwnership", label: "Women's land ownership", short: "Women owners", unit: "%", description: "Share of operational holdings with a woman as owner or joint owner.", domain: "equity", higherIsBetter: true, min: 0, max: 60, decimals: 1, modelledOn: "Agricultural Census / NFHS ownership questions", outcome: "equity" },
  { id: "researchActivity", label: "Research activity index", short: "Research activity", unit: "index", description: "Studies, datasets and pilots on land governance linked to the region (0–100).", domain: "research", higherIsBetter: true, min: 0, max: 100, decimals: 0, modelledOn: "Platform repository metadata" },
];

export const indicatorById = Object.fromEntries(INDICATORS.map((i) => [i.id, i])) as Record<IndicatorId, IndicatorDef>;

/** Headline indicators that carry an annual series 2019–2025. */
export const SERIES_INDICATORS: IndicatorId[] = ["digitization", "disputePressure", "mutationDays", "builtUp", "climateResilience", "landUsePressure"];
export const SERIES_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
