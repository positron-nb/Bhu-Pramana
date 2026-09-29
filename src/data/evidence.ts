import type { Evidence, Finding, InterventionId, OutcomeId } from "@/lib/domain/schemas";

/**
 * Evidence corpus.
 *
 *  provenance: "reference" → a real Act, programme or public data portal. We keep
 *              high-level descriptive metadata and an official link only.
 *  provenance: "synthetic" → a DEMONSTRATION RECORD written for this prototype.
 *              Authors and institutions are fictional; effect sizes are
 *              illustrative. The UI labels every such record.
 */

let fi = 0;
function F(
  intervention: InterventionId,
  outcome: OutcomeId,
  direction: Finding["direction"],
  statement: string,
  effect?: Finding["effect"],
  context?: string,
): Finding {
  fi += 1;
  return { id: `F${String(fi).padStart(3, "0")}`, intervention, outcome, direction, statement, effect, context };
}

const INDIA_CODE = "https://www.indiacode.nic.in/";
const DOLR = "https://dolr.gov.in/";

export const EVIDENCE: Evidence[] = [
  /* ============================================================ LAWS */
  {
    id: "LW-001", type: "law", title: "Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013",
    source: "Government of India (administered by DoLR)", year: 2013, geography: { scope: "national", regions: ["IN"] },
    concepts: ["land-acquisition", "rfctlarr", "compensation", "displacement"], tags: ["acquisition", "social impact assessment", "consent", "R&R"],
    summary: "Central law governing acquisition of land for public purposes. It requires a Social Impact Assessment, prior consent of affected landowners for certain project categories, multiplier-based market-value compensation with solatium, and rehabilitation and resettlement entitlements.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: ["LW-006"], datasets: [], indicators: [],
  },
  {
    id: "LW-002", type: "law", title: "Registration Act, 1908",
    source: "Government of India", year: 1908, geography: { scope: "national", regions: ["IN"] },
    concepts: ["registration", "titling", "land-records"], tags: ["deed registration", "presumptive title"],
    summary: "Provides for compulsory registration of documents that create or transfer interests in immovable property. Registration records the transaction document rather than guaranteeing title, which is why India's land titles are described as presumptive.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: ["LW-003", "LW-004"], datasets: [], indicators: [],
  },
  {
    id: "LW-003", type: "law", title: "Transfer of Property Act, 1882",
    source: "Government of India", year: 1882, geography: { scope: "national", regions: ["IN"] },
    concepts: ["registration", "tenure-security", "credit"], tags: ["sale", "mortgage", "lease", "gift"],
    summary: "Defines how immovable property is transferred between living persons, including sale, mortgage, lease, exchange and gift, and the rights and liabilities of the parties to each transfer.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: ["LW-002"], datasets: [], indicators: [],
  },
  {
    id: "LW-004", type: "law", title: "Indian Stamp Act, 1899",
    source: "Government of India", year: 1899, geography: { scope: "national", regions: ["IN"] },
    concepts: ["stamp-duty", "registration", "land-value"], tags: ["stamp duty", "state revenue"],
    summary: "Framework for levying stamp duty on instruments, including conveyances of land. States set their own rates, so stamp duty and guidance values are a major lever over registration behaviour and state revenue.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: ["LW-002"], datasets: [], indicators: [],
  },
  {
    id: "LW-005", type: "law", title: "Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006",
    source: "Government of India (Ministry of Tribal Affairs)", year: 2006, geography: { scope: "national", regions: ["IN"] },
    concepts: ["tribal-rights", "tenure-security", "common-land"], tags: ["FRA", "community forest rights", "gram sabha"],
    summary: "Recognises individual and community forest rights of forest-dwelling communities, with the Gram Sabha playing a central role in initiating and verifying claims. Relevant wherever land records, forest boundaries and customary use overlap.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: ["LW-006"], datasets: [], indicators: [],
  },
  {
    id: "LW-006", type: "law", title: "Panchayats (Extension to Scheduled Areas) Act, 1996",
    source: "Government of India", year: 1996, geography: { scope: "national", regions: ["IN"] },
    concepts: ["tribal-rights", "land-acquisition", "displacement"], tags: ["PESA", "scheduled areas", "gram sabha consultation"],
    summary: "Extends Panchayati Raj to Scheduled Areas and empowers Gram Sabhas, including a requirement of consultation before land acquisition for development projects and before resettlement of affected persons.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: ["LW-001", "LW-005"], datasets: [], indicators: [],
  },
  {
    id: "LW-007", type: "law", title: "Maharashtra Land Revenue Code, 1966",
    source: "Government of Maharashtra", year: 1966, geography: { scope: "state", regions: ["MH"] },
    concepts: ["land-records", "mutation", "land-conversion", "revenue-courts"], tags: ["7/12 extract", "non-agricultural permission", "mutation"],
    summary: "State code governing land revenue administration in Maharashtra, including maintenance of the record of rights (7/12 extract), mutation procedure, conversion of agricultural land to non-agricultural use and revenue appeals.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: [], datasets: [], indicators: [],
  },
  {
    id: "LW-008", type: "law", title: "Uttar Pradesh Revenue Code, 2006",
    source: "Government of Uttar Pradesh", year: 2006, geography: { scope: "state", regions: ["UP"] },
    concepts: ["land-records", "revenue-courts", "mutation", "land-disputes"], tags: ["revenue courts", "khatauni", "consolidation"],
    summary: "Consolidates land revenue laws in Uttar Pradesh, covering land records (khatauni), mutation, boundary disputes, and the hierarchy and procedure of revenue courts.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: [], datasets: [], indicators: [],
  },
  {
    id: "LW-009", type: "law", title: "Karnataka Land Revenue Act, 1964",
    source: "Government of Karnataka", year: 1964, geography: { scope: "state", regions: ["KA"] },
    concepts: ["land-records", "mutation", "land-conversion"], tags: ["RTC", "pahani", "conversion"],
    summary: "Governs land revenue administration in Karnataka, including the Record of Rights, Tenancy and Crops (RTC), mutation and conversion of agricultural land.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: ["PO-008"], datasets: [], indicators: [],
  },
  {
    id: "LW-010", type: "law", title: "Hindu Succession (Amendment) Act, 2005",
    source: "Government of India", year: 2005, geography: { scope: "national", regions: ["IN"] },
    concepts: ["gender", "inheritance", "tenure-security"], tags: ["daughters' coparcenary rights", "agricultural land"],
    summary: "Gave daughters coparcenary rights equal to sons and removed the exemption that had excluded agricultural land from the scope of the Hindu Succession Act, making inheritance a key channel for women's land ownership.",
    findings: [], design: "statutory", url: INDIA_CODE, provenance: "reference", license: "Public statute", related: [], datasets: [], indicators: [],
  },

  /* ======================================================= POLICIES */
  {
    id: "PO-001", type: "policy", title: "Digital India Land Records Modernization Programme (DILRMP)",
    source: "Department of Land Resources, Ministry of Rural Development", year: 2016, geography: { scope: "national", regions: ["IN"] },
    concepts: ["dilrmp", "digitization", "land-records", "cadastral-map", "registration"], tags: ["computerisation of RoR", "digitisation of maps", "survey/resurvey", "registration integration"],
    summary: "Central programme (revamped in 2016 from the National Land Records Modernisation Programme of 2008) that supports states to computerise records of rights, digitise cadastral maps, undertake survey and resurvey, computerise registration and integrate textual and spatial records.",
    findings: [], design: "administrative", url: DOLR, provenance: "reference", license: "Government programme", related: ["PO-002", "PO-004"], datasets: ["DS-001"], indicators: ["digitization", "mapLinkage"],
  },
  {
    id: "PO-002", type: "policy", title: "Unique Land Parcel Identification Number (ULPIN)",
    source: "Department of Land Resources", year: 2021, geography: { scope: "national", regions: ["IN"] },
    concepts: ["ulpin", "cadastral-map", "digitization"], tags: ["Bhu-Aadhaar", "parcel identifier", "geo-referencing"],
    summary: "A 14-character alphanumeric identifier for each land parcel, generated from the geo-coordinates of parcel vertices, intended to act as a common key across land records, registration and other departmental systems.",
    findings: [], design: "administrative", url: DOLR, provenance: "reference", license: "Government programme", related: ["PO-001"], datasets: [], indicators: ["mapLinkage"],
  },
  {
    id: "PO-003", type: "policy", title: "SVAMITVA Scheme — survey of villages and mapping with improvised technology",
    source: "Ministry of Panchayati Raj", year: 2020, geography: { scope: "national", regions: ["IN"] },
    concepts: ["svamitva", "drone-survey", "abadi", "credit"], tags: ["property cards", "drone mapping", "rural inhabited areas"],
    summary: "Central scheme that uses drone surveys to map rural inhabited (abadi) areas and issue property cards to households, with the aim of enabling use of residential property as a financial asset and reducing property disputes.",
    findings: [], design: "administrative", url: "https://svamitva.nic.in/", provenance: "reference", license: "Government programme", related: ["PO-001"], datasets: [], indicators: [],
  },
  {
    id: "PO-004", type: "policy", title: "National Generic Document Registration System (NGDRS)",
    source: "Department of Land Resources with NIC", year: 2016, geography: { scope: "national", regions: ["IN"] },
    concepts: ["registration", "digitization", "mutation"], tags: ["e-registration", "common software", "registration-mutation integration"],
    summary: "Common, configurable software for property document registration offered to states, designed to integrate registration with land records so that mutation can follow registration without separate applications.",
    findings: [], design: "administrative", url: DOLR, provenance: "reference", license: "Government programme", related: ["PO-001"], datasets: [], indicators: ["mutationDays"],
  },
  {
    id: "PO-005", type: "policy", title: "Model Agricultural Land Leasing Act, 2016",
    source: "NITI Aayog", year: 2016, geography: { scope: "national", regions: ["IN"] },
    concepts: ["land-leasing", "tenancy", "credit"], tags: ["tenant farmers", "model law", "licensed cultivators"],
    summary: "Model law proposed to states to legalise and facilitate agricultural land leasing while protecting owners' rights, so that tenant cultivators can access institutional credit, insurance and disaster relief.",
    findings: [], design: "administrative", url: "https://www.niti.gov.in/", provenance: "reference", license: "Model law", related: [], datasets: [], indicators: [],
  },
  {
    id: "PO-006", type: "policy", title: "Draft Model Bill on Conclusive Land Titling",
    source: "NITI Aayog", year: 2020, geography: { scope: "national", regions: ["IN"] },
    concepts: ["titling", "tenure-security", "land-records"], tags: ["conclusive titles", "title guarantee", "land authority"],
    summary: "Draft model legislation circulated for consultation proposing a transition from presumptive to conclusive land titles, with land authorities to prepare and notify title registers and mechanisms to resolve objections and disputes.",
    findings: [], design: "administrative", url: "https://www.niti.gov.in/", provenance: "reference", license: "Draft model law", related: ["LW-002"], datasets: [], indicators: [],
  },
  {
    id: "PO-007", type: "policy", title: "National Geospatial Policy, 2022",
    source: "Department of Science and Technology", year: 2022, geography: { scope: "national", regions: ["IN"] },
    concepts: ["geospatial", "lulc", "cadastral-map"], tags: ["geospatial data", "open access", "high-resolution mapping"],
    summary: "National policy framework that liberalises access to geospatial data and sets goals for high-accuracy national mapping and geospatial infrastructure, relevant to cadastral mapping and land-use monitoring.",
    findings: [], design: "administrative", url: "https://dst.gov.in/", provenance: "reference", license: "Government policy", related: [], datasets: ["DS-002"], indicators: [],
  },
  {
    id: "PO-008", type: "policy", title: "Bhoomi — computerisation of land records in Karnataka",
    source: "Government of Karnataka", year: 2002, geography: { scope: "state", regions: ["KA"] },
    concepts: ["digitization", "land-records", "service-delivery"], tags: ["RTC kiosks", "early e-governance", "state programme"],
    summary: "One of India's earliest state-wide land record computerisation initiatives, which moved issue of the Record of Rights, Tenancy and Crops (RTC) to computerised kiosks and is widely cited in land administration literature.",
    findings: [], design: "administrative", url: "https://landrecords.karnataka.gov.in/", provenance: "reference", license: "Government programme", related: ["LW-009", "PO-001"], datasets: [], indicators: ["digitization"],
  },
  {
    id: "PO-009", type: "policy", title: "Watershed Development Component of PMKSY (WDC-PMKSY 2.0)",
    source: "Department of Land Resources", year: 2021, geography: { scope: "national", regions: ["IN"] },
    concepts: ["watershed", "land-degradation", "drought", "climate-vulnerability"], tags: ["soil and water conservation", "rainfed areas", "land restoration"],
    summary: "DoLR's watershed programme for rainfed and degraded lands, financing soil and moisture conservation, water harvesting and livelihood components — the main public channel for climate-resilient land-use investment.",
    findings: [], design: "administrative", url: DOLR, provenance: "reference", license: "Government programme", related: [], datasets: ["DS-005"], indicators: ["degradation", "climateResilience"],
  },

  /* ============================================ REFERENCE DATASETS */
  {
    id: "DS-001", type: "dataset", title: "DILRMP progress MIS (reference portal)",
    source: "Department of Land Resources", year: 2025, geography: { scope: "national", regions: ["IN"] },
    concepts: ["dilrmp", "digitization", "cadastral-map"], tags: ["MIS", "progress indicators", "state-wise"],
    summary: "Official management information system reporting state- and district-wise progress on DILRMP components. Linked here as the system the platform's digitisation indicators are structured after; no values are copied from it.",
    findings: [], design: "administrative", url: "https://dilrmp.gov.in/", provenance: "reference", license: "Government data (see portal terms)", related: ["PO-001"], datasets: [], indicators: ["digitization", "mapLinkage"],
    distribution: { format: ["Web MIS"], coverage: "All states", cadence: "Continuous" },
  },
  {
    id: "DS-002", type: "dataset", title: "Bhuvan land use / land cover (NRSC) — reference service",
    source: "National Remote Sensing Centre, ISRO", year: 2024, geography: { scope: "national", regions: ["IN"] },
    concepts: ["lulc", "geospatial", "land-conversion"], tags: ["remote sensing", "LULC 1:50k", "WMS"],
    summary: "ISRO's geoportal providing thematic land use / land cover layers and other satellite-derived products through web services. The platform's built-up and land-use indicators are modelled on this structure.",
    findings: [], design: "administrative", url: "https://bhuvan.nrsc.gov.in/", provenance: "reference", license: "See Bhuvan terms of use", related: ["PO-007"], datasets: [], indicators: ["builtUp", "urbanGrowth"],
    distribution: { format: ["WMS", "Web viewer"], coverage: "India", cadence: "Periodic cycles" },
  },
  {
    id: "DS-003", type: "dataset", title: "National Judicial Data Grid (NJDG) — reference portal",
    source: "eCourts Project, Supreme Court of India", year: 2025, geography: { scope: "national", regions: ["IN"] },
    concepts: ["litigation", "land-disputes"], tags: ["court pendency", "case statistics"],
    summary: "Public dashboard of case filing, disposal and pendency statistics for Indian courts. Referenced as the model for the platform's pendency indicators; demo values are synthetic.",
    findings: [], design: "administrative", url: "https://njdg.ecourts.gov.in/", provenance: "reference", license: "See portal terms", related: [], datasets: [], indicators: ["pendingCases", "disputePressure"],
    distribution: { format: ["Web dashboard"], coverage: "District & high courts", cadence: "Daily" },
  },
  {
    id: "DS-004", type: "dataset", title: "Open Government Data Platform India (data.gov.in) — reference catalogue",
    source: "National Informatics Centre", year: 2025, geography: { scope: "national", regions: ["IN"] },
    concepts: ["geospatial", "land-records"], tags: ["open data", "catalogue", "API"],
    summary: "National open data catalogue publishing government datasets with APIs. Referenced as the interoperability target for the platform's DCAT-style dataset metadata.",
    findings: [], design: "administrative", url: "https://data.gov.in/", provenance: "reference", license: "Government Open Data License – India", related: [], datasets: [], indicators: [],
    distribution: { format: ["CSV", "JSON", "API"], coverage: "All sectors", cadence: "Continuous" },
  },
  {
    id: "DS-005", type: "dataset", title: "Desertification and Land Degradation Atlas of India — reference",
    source: "Space Applications Centre, ISRO", year: 2021, geography: { scope: "national", regions: ["IN"] },
    concepts: ["land-degradation", "drought", "lulc"], tags: ["desertification", "atlas", "state-wise"],
    summary: "Satellite-based national assessment of land degradation and desertification processes, published as an atlas. Referenced as the structure behind the platform's degraded-land indicator.",
    findings: [], design: "administrative", url: "https://www.sac.gov.in/", provenance: "reference", license: "See SAC terms", related: ["PO-009"], datasets: [], indicators: ["degradation"],
    distribution: { format: ["Atlas (PDF)", "Maps"], coverage: "India", cadence: "Periodic editions" },
  },
  {
    id: "DS-006", type: "dataset", title: "Land Conflict Watch — reference database",
    source: "Land Conflict Watch (independent research network)", year: 2025, geography: { scope: "national", regions: ["IN"] },
    concepts: ["land-disputes", "land-acquisition", "tribal-rights"], tags: ["land conflicts", "civil society data"],
    summary: "Independent research network documenting ongoing land conflicts in India with location, land type, sector and people affected. Referenced as an example of non-government evidence the platform can federate.",
    findings: [], design: "administrative", url: "https://www.landconflictwatch.org/", provenance: "reference", license: "See site terms", related: [], datasets: [], indicators: [],
    distribution: { format: ["Web database"], coverage: "India", cadence: "Continuous" },
  },

  /* ============================================ DEMO DATASETS */
  {
    id: "DS-011", type: "dataset", title: "District Land Governance Indicators 2019–2025 (demonstration panel)",
    source: "Bhū-Pramāṇa demonstration data", year: 2025, geography: { scope: "multi-state", regions: ["UP", "MH", "KA", "OD", "AS", "RJ"] },
    concepts: ["land-records", "land-disputes", "lulc", "climate-vulnerability", "service-delivery"], tags: ["district panel", "16 indicators", "synthetic"],
    summary: "Synthetic district panel for 226 districts in six focus states and state-level values for all states and UTs: digitisation, dispute pressure, mutation time, built-up growth, climate vulnerability and more. Generated deterministically for demonstration.",
    findings: [], design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo data)", related: [], datasets: [], indicators: ["digitization", "disputePressure", "mutationDays", "urbanGrowth", "builtUp", "landUsePressure", "climateVulnerability", "climateResilience", "degradation", "roadDensity", "adminCapacity", "zoningStrictness", "womenOwnership"],
    distribution: { format: ["JSON", "CSV", "GeoJSON"], coverage: "36 states/UTs · 226 districts", cadence: "Annual", records: "263 regions × 16 indicators" },
  },
  {
    id: "DS-012", type: "dataset", title: "Mutation Service Timeliness Panel (demonstration)",
    source: "Bhū-Pramāṇa demonstration data", year: 2025, geography: { scope: "multi-state", regions: ["UP", "MH", "KA"] },
    concepts: ["mutation", "service-delivery", "digitization"], tags: ["e-mutation", "processing time", "synthetic"],
    summary: "Synthetic application-level panel of mutation requests with submission, registration-link and disposal dates, used to compute median mutation time by district and year.",
    findings: [], design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo data)", related: ["PO-004"], datasets: [], indicators: ["mutationDays"],
    distribution: { format: ["CSV", "Parquet"], coverage: "136 districts", cadence: "Monthly", records: "≈1.9 million applications (simulated)" },
  },
  {
    id: "DS-013", type: "dataset", title: "Peri-urban Built-up Change Layer 2015–2025 (demonstration)",
    source: "Bhū-Pramāṇa demonstration data", year: 2025, geography: { scope: "multi-state", regions: ["MH", "KA", "UP", "RJ"] },
    concepts: ["lulc", "urban-expansion", "peri-urban", "land-conversion"], tags: ["built-up change", "raster-derived", "synthetic"],
    summary: "Synthetic built-up change layer summarising annual conversion of agricultural land within 30 km of large cities, structured like LULC change products derived from medium-resolution imagery.",
    findings: [], design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo data)", related: ["DS-002"], datasets: [], indicators: ["builtUp", "urbanGrowth", "landUsePressure"],
    distribution: { format: ["GeoTIFF", "GeoJSON summary"], coverage: "12 metro regions", cadence: "Annual" },
  },
  {
    id: "DS-014", type: "dataset", title: "Climate Vulnerability & Land Resilience Layer (demonstration)",
    source: "Bhū-Pramāṇa demonstration data", year: 2024, geography: { scope: "multi-state", regions: ["OD", "AS", "RJ", "MH", "UP", "KA"] },
    concepts: ["climate-vulnerability", "flood", "drought", "cyclone", "land-degradation"], tags: ["hazard exposure", "adaptive capacity", "synthetic"],
    summary: "Synthetic district layer combining flood, drought, cyclone and heat exposure with sensitivity and adaptive-capacity proxies, following the structure of common-framework vulnerability assessments.",
    findings: [], design: "modelling", provenance: "synthetic", license: "CC BY 4.0 (demo data)", related: ["PO-009"], datasets: [], indicators: ["climateVulnerability", "climateResilience", "degradation"],
    distribution: { format: ["GeoJSON", "CSV"], coverage: "226 districts", cadence: "Every 3 years" },
  },
  {
    id: "DS-015", type: "dataset", title: "Land Dispute Pendency Panel (demonstration)",
    source: "Bhū-Pramāṇa demonstration data", year: 2025, geography: { scope: "multi-state", regions: ["UP", "MH", "KA", "OD", "AS", "RJ"] },
    concepts: ["land-disputes", "litigation", "revenue-courts"], tags: ["revenue court pendency", "civil suits", "synthetic"],
    summary: "Synthetic district-year panel of land-related case filings, disposals and pendency in revenue and civil courts, structured after court case-management statistics.",
    findings: [], design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo data)", related: ["DS-003"], datasets: [], indicators: ["pendingCases", "disputePressure"],
    distribution: { format: ["CSV"], coverage: "226 districts", cadence: "Quarterly" },
  },
  {
    id: "DS-016", type: "dataset", title: "Land Policy Pilot Registry (demonstration)",
    source: "Bhū-Pramāṇa demonstration data", year: 2025, geography: { scope: "multi-state", regions: ["UP", "MH", "KA", "OD", "AS", "RJ"] },
    concepts: ["policy-experimentation", "impact-evaluation"], tags: ["pilots", "experiments", "registry", "synthetic"],
    summary: "Registry of land-governance pilots and policy experiments with design, start date, comparison group and monitoring indicators — the backbone for evaluating reforms before scale-up.",
    findings: [], design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo data)", related: [], datasets: [], indicators: ["researchActivity"],
    distribution: { format: ["JSON", "CSV"], coverage: "18 pilots", cadence: "Continuous" },
  },
  {
    id: "DS-017", type: "dataset", title: "Women's Land Ownership Extract (demonstration)",
    source: "Bhū-Pramāṇa demonstration data", year: 2023, geography: { scope: "multi-state", regions: ["UP", "MH", "KA", "OD", "AS", "RJ"] },
    concepts: ["gender", "inheritance", "tenure-security"], tags: ["joint titles", "ownership", "synthetic"],
    summary: "Synthetic extract estimating the share of holdings with a woman owner or joint owner, by district, structured after agricultural census and household survey ownership modules.",
    findings: [], design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo data)", related: ["LW-010"], datasets: [], indicators: ["womenOwnership"],
    distribution: { format: ["CSV"], coverage: "226 districts", cadence: "5-yearly" },
  },
  {
    id: "DS-018", type: "dataset", title: "Rural Road & Corridor Network Extract (demonstration)",
    source: "Bhū-Pramāṇa demonstration data", year: 2024, geography: { scope: "multi-state", regions: ["UP", "MH", "KA", "OD", "AS", "RJ"] },
    concepts: ["roads", "rural-infrastructure", "corridors"], tags: ["road density", "corridors", "synthetic"],
    summary: "Synthetic extract of all-weather rural roads and major economic corridors, used to compute road density and corridor proximity per district.",
    findings: [], design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo data)", related: [], datasets: [], indicators: ["roadDensity"],
    distribution: { format: ["GeoJSON", "CSV"], coverage: "226 districts", cadence: "Annual" },
  },

  /* ================================================ RESEARCH (demo) */
  {
    id: "RS-001", type: "research", title: "Do digitised land records reduce disputes? Evidence from a staggered district roll-out in Maharashtra",
    source: "Deccan Land Research Collaborative", authors: ["P. Deshmukh", "R. Iyer"], year: 2023, geography: { scope: "state", regions: ["MH", "D521", "D517", "D516"] },
    concepts: ["digitization", "land-disputes", "litigation", "impact-evaluation", "cadastral-map"], tags: ["difference-in-differences", "staggered roll-out", "7/12 extract"],
    summary: "Uses the staggered district-wise completion of record digitisation and map linkage to compare dispute filings before and after completion. Districts that completed linkage saw fewer new boundary and title disputes, with larger effects where resurvey preceded digitisation.",
    findings: [
      F("record-digitization", "dispute-incidence", "decrease", "Each 10-point rise in RoR–map linkage was associated with about 7% fewer new land-dispute filings.", { value: -7, unit: "%", low: -10, high: -4, per: "+10 pp linkage" }, "Effects larger where resurvey preceded digitisation."),
      F("record-digitization", "processing-time", "decrease", "Median mutation time fell by roughly a tenth for each 10-point rise in linkage.", { value: -10, unit: "%", per: "+10 pp linkage" }),
    ],
    design: "quasi-experimental", sample: "35 districts, 2014–2023", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-001", "LW-007"], datasets: ["DS-011", "DS-015"], indicators: ["digitization", "mapLinkage", "disputePressure"],
  },
  {
    id: "RS-002", type: "research", title: "Two decades of computerised records: service delivery and litigation in Karnataka taluks",
    source: "Institute for Agrarian & Spatial Policy", authors: ["N. Hegde", "S. Qureshi"], year: 2021, geography: { scope: "state", regions: ["KA"] },
    concepts: ["digitization", "service-delivery", "land-disputes", "mutation"], tags: ["panel data", "taluk level", "RTC"],
    summary: "Taluk-level panel linking the maturity of computerised record systems to mutation turnaround and dispute filings. Mature systems show consistently faster mutation and moderately fewer title disputes, though gains flatten above 90% digitisation.",
    findings: [
      F("record-digitization", "processing-time", "decrease", "A 10-point increase in digitisation maturity cut mutation turnaround by about 12%.", { value: -12, unit: "%", low: -15, high: -8, per: "+10 pp digitisation" }),
      F("record-digitization", "dispute-incidence", "decrease", "Title disputes declined about 9% per 10-point increase, with diminishing returns above 90%.", { value: -9, unit: "%", low: -12, high: -5, per: "+10 pp digitisation" }),
    ],
    design: "panel", sample: "176 taluks, 2004–2020", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-008", "LW-009"], datasets: ["DS-011", "DS-012"], indicators: ["digitization", "mutationDays"],
  },
  {
    id: "RS-003", type: "research", title: "Record quality versus record availability: a cross-sectional study of disputes in Uttar Pradesh",
    source: "Indo-Gangetic Governance Lab", authors: ["T. Singh", "A. Rizvi"], year: 2022, geography: { scope: "state", regions: ["UP", "D157", "D141", "D188"] },
    concepts: ["digitization", "land-disputes", "land-records", "inheritance"], tags: ["record accuracy", "khatauni", "cross-section"],
    summary: "Compares districts by both the share of digitised records and audited record accuracy. Availability alone has a small association with disputes; accuracy (unrecorded inheritance and partition) explains more of the variation.",
    findings: [
      F("record-digitization", "dispute-incidence", "decrease", "Digitisation was associated with a modest 4% reduction in disputes per 10 points once record accuracy is controlled for.", { value: -4, unit: "%", low: -7, high: -1, per: "+10 pp digitisation" }),
      F("gender-rights", "dispute-incidence", "decrease", "Districts with inheritance mutation drives had fewer family partition disputes.", { value: -6, unit: "%" }),
    ],
    design: "cross-sectional", sample: "71 districts, 2021", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-008"], datasets: ["DS-011", "DS-015"], indicators: ["digitization", "disputePressure"],
  },
  {
    id: "RS-004", type: "research", title: "When digitisation freezes errors: land records and conflict in Assam's floodplain districts",
    source: "Northeast Land & Rivers Observatory", authors: ["M. Baruah", "L. Das"], year: 2024, geography: { scope: "state", regions: ["AS", "D308", "D307", "D303"] },
    concepts: ["digitization", "land-disputes", "flood", "survey", "cadastral-map"], tags: ["riverbank erosion", "outdated surveys", "qualitative"],
    summary: "Interviews and record audits in erosion-affected districts show that digitising decades-old surveys without resurvey locked in boundary errors, producing a short-term rise in disputes as owners discovered mismatches.",
    findings: [
      F("record-digitization", "dispute-incidence", "increase", "Without prior resurvey, digitisation was followed by a short-term rise in boundary disputes in erosion-affected villages.", { value: 5, unit: "%", per: "first two years" }, "Riverine districts with outdated surveys."),
      F("resurvey", "dispute-incidence", "decrease", "Villages resurveyed before digitisation did not show the increase.", undefined),
    ],
    design: "qualitative", sample: "42 villages, 6 districts", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-001"], datasets: ["DS-014"], indicators: ["disputePressure"],
  },
  {
    id: "RS-005", type: "research", title: "Fast-track revenue courts and the land case backlog: a matched-district evaluation",
    source: "Revenue Administration Reform Cell", authors: ["K. Rathore", "V. Kulkarni"], year: 2023, geography: { scope: "state", regions: ["UP"] },
    concepts: ["revenue-courts", "litigation", "land-disputes", "administrative-capacity"], tags: ["matched comparison", "pendency", "RCCMS"],
    summary: "Compares districts that added fast-track revenue court benches with matched districts that did not. Added capacity reduced pendency and disposal time, but gains depended on filling reader and clerk posts, not only presiding officers.",
    findings: [
      F("dispute-resolution", "dispute-incidence", "decrease", "Pending land cases fell about 6% for each 10% increase in bench capacity.", { value: -6, unit: "%", low: -8, high: -3, per: "+10% capacity" }),
      F("dispute-resolution", "processing-time", "decrease", "Median disposal time fell about 4% per 10% capacity increase.", { value: -4, unit: "%", per: "+10% capacity" }),
    ],
    design: "quasi-experimental", sample: "24 treated, 24 matched districts", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-008"], datasets: ["DS-015"], indicators: ["pendingCases", "disputePressure"],
  },
  {
    id: "RS-006", type: "research", title: "Mediation before adjudication: Lok Adalat and panchayat-level ADR for land disputes in Odisha",
    source: "Coastal Resilience Research Network", authors: ["A. Mohanty", "S. Panda"], year: 2022, geography: { scope: "state", regions: ["OD"] },
    concepts: ["adr", "land-disputes", "revenue-courts"], tags: ["mediation", "Lok Adalat", "panel"],
    summary: "District panel on expanded pre-litigation mediation for boundary and partition disputes. Mediation capacity lowered pendency moderately; settlements held better where records were already digitised.",
    findings: [
      F("dispute-resolution", "dispute-incidence", "decrease", "A 10% increase in mediation capacity was associated with 4% lower pendency.", { value: -4, unit: "%", low: -6, high: -2, per: "+10% capacity" }),
    ],
    design: "panel", sample: "30 districts, 2016–2022", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-015"], indicators: ["pendingCases"],
  },
  {
    id: "RS-007", type: "research", title: "Induced demand in land adjudication: why more benches can mean more filings",
    source: "Urban Fringe Studies Programme", authors: ["R. Menon"], year: 2024, geography: { scope: "state", regions: ["MH", "D521", "D517"] },
    concepts: ["revenue-courts", "litigation", "peri-urban"], tags: ["induced litigation", "peri-urban", "mixed effects"],
    summary: "In fast-appreciating peri-urban districts, added adjudication capacity was partly absorbed by new filings, as faster courts made litigation a more attractive strategy. Net pendency effects were small.",
    findings: [
      F("dispute-resolution", "dispute-incidence", "mixed", "Capacity increases in peri-urban districts reduced pendency only about 2% per 10%, as filings rose.", { value: -2, unit: "%", per: "+10% capacity" }, "High land-value appreciation."),
    ],
    design: "panel", sample: "8 peri-urban districts", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-015"], indicators: ["pendingCases"],
  },
  {
    id: "RS-008", type: "research", title: "Expressways, land values and conflict: corridor effects in western Uttar Pradesh",
    source: "Indo-Gangetic Governance Lab", authors: ["A. Rizvi", "D. Chauhan"], year: 2023, geography: { scope: "state", regions: ["UP", "D141", "D142", "D143"] },
    concepts: ["corridors", "roads", "land-value", "land-disputes", "land-conversion"], tags: ["expressway", "land prices", "conversion"],
    summary: "Examines villages within 10 km of new expressway alignments. Land values and conversion rose sharply, and title and boundary disputes rose with them, especially where records were incomplete.",
    findings: [
      F("infrastructure", "dispute-incidence", "increase", "A 10% expansion in corridor road length was associated with about 5% more land disputes.", { value: 5, unit: "%", low: 3, high: 8, per: "+10% network" }),
      F("infrastructure", "land-use-change", "increase", "Agricultural-to-non-farm conversion rose about 6% per 10% corridor expansion.", { value: 6, unit: "%", per: "+10% network" }),
    ],
    design: "quasi-experimental", sample: "318 villages", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-001"], datasets: ["DS-013", "DS-018", "DS-015"], indicators: ["landUsePressure", "disputePressure", "roadDensity"],
  },
  {
    id: "RS-009", type: "research", title: "Freight corridors and rural land markets in Rajasthan",
    source: "Thar Drylands Research Group", authors: ["K. Rathore", "M. Joshi"], year: 2022, geography: { scope: "state", regions: ["RJ", "D104", "D119", "D118"] },
    concepts: ["corridors", "land-value", "land-disputes", "land-acquisition"], tags: ["DFC", "land markets", "disputes"],
    summary: "Registration and court data around a dedicated freight corridor show higher transaction volumes and a moderate rise in disputes over boundaries and compensation apportionment among co-owners.",
    findings: [
      F("infrastructure", "dispute-incidence", "increase", "Disputes rose about 3% per 10% expansion in corridor-linked roads.", { value: 3, unit: "%", low: 1, high: 5, per: "+10% network" }),
    ],
    design: "panel", sample: "12 tehsils, 2012–2022", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-001"], datasets: ["DS-018", "DS-015"], indicators: ["disputePressure"],
  },
  {
    id: "RS-010", type: "research", title: "Roads with clear titles: rural connectivity and land conflict in Karnataka",
    source: "Institute for Agrarian & Spatial Policy", authors: ["N. Hegde"], year: 2021, geography: { scope: "state", regions: ["KA"] },
    concepts: ["roads", "rural-infrastructure", "land-disputes", "digitization"], tags: ["rural roads", "no-effect", "moderating role of records"],
    summary: "Finds no measurable increase in land disputes following rural road expansion in taluks with mature digitised records, suggesting record quality moderates the conflict effects of infrastructure.",
    findings: [
      F("infrastructure", "dispute-incidence", "no-effect", "No significant change in disputes after road expansion where records were >85% digitised.", { value: 0, unit: "%", low: -1, high: 2, per: "+10% network" }, "Mature digitised records."),
      F("infrastructure", "credit-access", "increase", "Road connectivity increased formal credit uptake on connected holdings.", { value: 7, unit: "%" }),
    ],
    design: "quasi-experimental", sample: "96 taluks", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-008"], datasets: ["DS-018", "DS-011"], indicators: ["roadDensity", "disputePressure"],
  },
  {
    id: "RS-011", type: "research", title: "Zoning enforcement at the urban fringe: satellite evidence from the Pune region",
    source: "Urban Fringe Studies Programme", authors: ["R. Menon", "P. Deshmukh"], year: 2024, geography: { scope: "district", regions: ["MH", "D521"] },
    concepts: ["zoning", "land-conversion", "peri-urban", "lulc", "geospatial"], tags: ["remote sensing", "conversion control", "regional plan"],
    summary: "Uses annual built-up maps to compare villages under stricter regional-plan enforcement with neighbouring villages. Stricter enforcement slowed conversion of farmland, without detectable displacement to adjacent villages.",
    findings: [
      F("zoning", "land-use-change", "decrease", "Each 10-point increase in enforcement was associated with about 5% lower farmland conversion.", { value: -5, unit: "%", low: -7, high: -3, per: "+10 pts zoning" }),
    ],
    design: "quasi-experimental", sample: "412 villages, 2015–2024", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-007"], datasets: ["DS-013"], indicators: ["landUsePressure", "builtUp", "zoningStrictness"],
  },
  {
    id: "RS-012", type: "research", title: "Green belts and growth: land-use outcomes of Bengaluru's peri-urban zoning",
    source: "Institute for Agrarian & Spatial Policy", authors: ["S. Qureshi", "N. Hegde"], year: 2020, geography: { scope: "district", regions: ["KA", "D583", "D584"] },
    concepts: ["zoning", "land-conversion", "peri-urban", "urban-expansion"], tags: ["green belt", "master plan", "LULC"],
    summary: "Compares green-belt and non-green-belt villages around Bengaluru. Green-belt designation modestly slowed conversion, but enforcement varied and regularisation schemes weakened the effect over time.",
    findings: [
      F("zoning", "land-use-change", "decrease", "Green-belt designation reduced conversion by about 3% per 10 points of enforcement.", { value: -3, unit: "%", low: -5, high: -1, per: "+10 pts zoning" }),
    ],
    design: "cross-sectional", sample: "260 villages", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-013"], indicators: ["landUsePressure", "zoningStrictness"],
  },
  {
    id: "RS-013", type: "research", title: "Strict zoning, informal subdivision: unintended effects in the NCR fringe",
    source: "Indo-Gangetic Governance Lab", authors: ["D. Chauhan", "T. Singh"], year: 2024, geography: { scope: "district", regions: ["UP", "D140", "D141", "D139"] },
    concepts: ["zoning", "land-conversion", "encroachment", "land-disputes", "peri-urban"], tags: ["informal colonies", "unintended consequences", "mixed"],
    summary: "Where zoning was very strict but regularisation pathways were absent, conversion moved into informal subdivision on agricultural land, raising disputes over unregistered plots even as recorded conversion fell.",
    findings: [
      F("zoning", "land-use-change", "mixed", "Recorded conversion fell but informal subdivision rose, leaving net conversion roughly unchanged at very high strictness.", undefined, "Strictness above ~70 with no regularisation pathway."),
      F("zoning", "dispute-incidence", "increase", "Above an enforcement index of about 70, disputes over informal plots rose about 2% per additional 10 points.", { value: 2, unit: "%", low: 0, high: 4, per: "+10 pts above 70" }),
    ],
    design: "case-study", sample: "3 districts, 58 settlements", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-013", "DS-015"], indicators: ["landUsePressure", "disputePressure"],
  },
  {
    id: "RS-014", type: "research", title: "Greenfield expressways and farmland: measuring conversion along a Maharashtra corridor",
    source: "Deccan Land Research Collaborative", authors: ["V. Kulkarni", "R. Iyer"], year: 2025, geography: { scope: "state", regions: ["MH", "D505", "D504", "D514", "D515"] },
    concepts: ["corridors", "land-conversion", "lulc", "roads"], tags: ["expressway", "interchange nodes", "remote sensing"],
    summary: "Satellite time series along a new expressway show conversion concentrated around interchange nodes, rising well before construction as land markets anticipated the alignment.",
    findings: [
      F("infrastructure", "land-use-change", "increase", "Conversion rose about 6% per 10% increase in corridor road length, concentrated near interchanges.", { value: 6, unit: "%", low: 4, high: 9, per: "+10% network" }),
    ],
    design: "quasi-experimental", sample: "701 km corridor, 2016–2024", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-013", "DS-018"], indicators: ["landUsePressure", "builtUp"],
  },
  {
    id: "RS-015", type: "research", title: "Mangroves, shelterbelts and cyclone losses on the Odisha coast",
    source: "Coastal Resilience Research Network", authors: ["A. Mohanty", "B. Sahoo"], year: 2023, geography: { scope: "state", regions: ["OD", "D387", "D379", "D380", "D377"] },
    concepts: ["cyclone", "climate-vulnerability", "watershed", "land-use-planning"], tags: ["mangrove restoration", "coastal setbacks", "quasi-experimental"],
    summary: "Compares coastal villages with restored mangroves and shelterbelts to similar villages without. Restoration investment tied to land-use plans improved resilience scores and reduced post-cyclone land damage.",
    findings: [
      F("climate-adaptation", "climate-resilience", "increase", "Each additional 1% of the land budget invested in coastal restoration raised the resilience index by about 1.2 points in high-exposure districts.", { value: 1.2, unit: "index", low: 0.8, high: 1.6, per: "+1% of budget" }),
    ],
    design: "quasi-experimental", sample: "186 villages", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-009"], datasets: ["DS-014"], indicators: ["climateResilience", "climateVulnerability"],
  },
  {
    id: "RS-016", type: "research", title: "Watershed treatment and land degradation in western Rajasthan",
    source: "Thar Drylands Research Group", authors: ["M. Joshi", "H. Bishnoi"], year: 2022, geography: { scope: "state", regions: ["RJ", "D115", "D114", "D113"] },
    concepts: ["watershed", "drought", "land-degradation", "climate-vulnerability"], tags: ["WDC-PMKSY", "soil moisture", "panel"],
    summary: "Watershed-treated micro-catchments show slower degradation and better recovery after drought years than comparable untreated catchments.",
    findings: [
      F("climate-adaptation", "climate-resilience", "increase", "A 1% increase in land-budget share for watershed works raised resilience by about 1.0 index points.", { value: 1.0, unit: "index", low: 0.6, high: 1.3, per: "+1% of budget" }),
    ],
    design: "panel", sample: "140 micro-catchments", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-009"], datasets: ["DS-014", "DS-005"], indicators: ["degradation", "climateResilience"],
  },
  {
    id: "RS-017", type: "research", title: "Floodplain zoning and resettlement in the Brahmaputra valley",
    source: "Northeast Land & Rivers Observatory", authors: ["L. Das", "M. Baruah"], year: 2023, geography: { scope: "state", regions: ["AS", "D308", "D307", "D304"] },
    concepts: ["flood", "zoning", "climate-vulnerability", "displacement"], tags: ["floodplain zoning", "char lands", "qualitative"],
    summary: "Qualitative study of flood-zone land-use restrictions. Zoning improved resilience where paired with alternative land allotments; without them, households resettled informally inside the flood zone.",
    findings: [
      F("zoning", "climate-resilience", "increase", "Floodplain zoning with alternative allotments raised resilience; estimated at about 1.5 points per 10 points of enforcement in high-vulnerability areas.", { value: 1.5, unit: "index", low: 0.5, high: 2.2, per: "+10 pts zoning" }),
      F("climate-adaptation", "climate-resilience", "increase", "Adaptation spending without land allotment showed smaller gains (≈0.5 points per 1% of budget).", { value: 0.5, unit: "index", per: "+1% of budget" }),
    ],
    design: "qualitative", sample: "22 villages", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-014"], indicators: ["climateResilience"],
  },
  {
    id: "RS-018", type: "research", title: "Automatic mutation after registration: an interrupted time-series across Maharashtra sub-registrar offices",
    source: "Deccan Land Research Collaborative", authors: ["V. Kulkarni"], year: 2024, geography: { scope: "state", regions: ["MH"] },
    concepts: ["mutation", "registration", "service-delivery", "digitization"], tags: ["e-mutation", "interrupted time series", "NGDRS"],
    summary: "Registration–mutation integration sharply reduced mutation time in offices with linked records, while offices with poor map linkage saw little change.",
    findings: [
      F("e-mutation", "processing-time", "decrease", "Integration reduced median mutation time by about 14% per 10 points of record linkage.", { value: -14, unit: "%", low: -18, high: -9, per: "+10 pp linkage" }),
      F("record-digitization", "processing-time", "decrease", "Gains were concentrated where map linkage exceeded 70%.", { value: -14, unit: "%", per: "+10 pp linkage" }),
    ],
    design: "quasi-experimental", sample: "512 sub-registrar offices", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-004", "LW-007"], datasets: ["DS-012"], indicators: ["mutationDays"],
  },
  {
    id: "RS-019", type: "research", title: "Digitised but delayed: mutation timeliness in Uttar Pradesh tehsils",
    source: "Revenue Administration Reform Cell", authors: ["K. Rathore", "T. Singh"], year: 2022, geography: { scope: "state", regions: ["UP"] },
    concepts: ["mutation", "service-delivery", "administrative-capacity", "digitization"], tags: ["lekhpal workload", "delays", "panel"],
    summary: "Digitisation reduced mutation times only modestly in tehsils with high field-staff vacancies; verification visits remained the bottleneck.",
    findings: [
      F("record-digitization", "processing-time", "decrease", "Digitisation reduced mutation time about 6% per 10 points where staff vacancies were high.", { value: -6, unit: "%", low: -9, high: -3, per: "+10 pp digitisation" }),
    ],
    design: "panel", sample: "350 tehsils", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-008"], datasets: ["DS-012"], indicators: ["mutationDays", "adminCapacity"],
  },
  {
    id: "RS-020", type: "research", title: "Staffing the revenue frontline: vacancies, workload and service delays",
    source: "Revenue Administration Reform Cell", authors: ["V. Kulkarni", "A. Mohanty"], year: 2023, geography: { scope: "multi-state", regions: ["UP", "OD", "MH"] },
    concepts: ["administrative-capacity", "service-delivery", "revenue-courts"], tags: ["patwari / talathi", "vacancies", "delays"],
    summary: "Across three states, filling revenue field posts and court support staff shortened both mutation and case disposal times; capacity additions without support staff had little effect.",
    findings: [
      F("dispute-resolution", "processing-time", "decrease", "A 10% increase in revenue court and support capacity cut processing times about 3%.", { value: -3, unit: "%", low: -5, high: -1, per: "+10% capacity" }),
    ],
    design: "panel", sample: "96 districts", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-012", "DS-015"], indicators: ["adminCapacity", "mutationDays"],
  },
  {
    id: "RS-021", type: "research", title: "Pace versus capacity: why ambitious land-record roll-outs stall",
    source: "Institute for Agrarian & Spatial Policy", authors: ["S. Qureshi", "R. Iyer"], year: 2024, geography: { scope: "multi-state", regions: ["UP", "MH", "KA", "OD", "AS", "RJ"] },
    concepts: ["administrative-capacity", "policy-experimentation", "digitization", "dilrmp"], tags: ["implementation science", "absorptive capacity", "roll-out"],
    summary: "Implementation analysis of state roll-outs finds that when annual targets exceed administrative absorptive capacity, achieved progress falls short in proportion to the overload, and error rates rise.",
    findings: [
      F("record-digitization", "implementation", "decrease", "Each unit of ambition above absorptive capacity reduced achieved progress by roughly 35%.", { value: -35, unit: "%", low: -50, high: -20, per: "unit overload" }),
    ],
    design: "panel", sample: "6 states, 2016–2024", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-001"], datasets: ["DS-011", "DS-016"], indicators: ["adminCapacity", "digitization"],
  },
  {
    id: "RS-022", type: "research", title: "Urbanisation and the rising tide of land disputes: a multi-state district analysis",
    source: "Urban Fringe Studies Programme", authors: ["R. Menon", "D. Chauhan"], year: 2025, geography: { scope: "multi-state", regions: ["UP", "MH", "KA", "RJ"] },
    concepts: ["urban-expansion", "peri-urban", "land-disputes", "land-value"], tags: ["dispute drift", "built-up growth", "cross-section"],
    summary: "District analysis linking built-up growth to the trend in land-dispute pressure. Faster-urbanising districts show a steady upward drift in disputes absent policy change.",
    findings: [
      F("infrastructure", "dispute-incidence", "increase", "Each percentage point of annual built-up growth added about 0.6% per year to dispute pressure.", { value: 0.6, unit: "%", low: 0.3, high: 0.9, per: "per 1%/yr built-up growth" }),
    ],
    design: "cross-sectional", sample: "170 districts", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-013", "DS-015"], indicators: ["urbanGrowth", "disputePressure"],
  },
  {
    id: "RS-023", type: "research", title: "Coastal setbacks as land policy: resilience outcomes in Odisha and Karnataka",
    source: "Coastal Resilience Research Network", authors: ["B. Sahoo", "N. Hegde"], year: 2024, geography: { scope: "multi-state", regions: ["OD", "KA", "D387", "D569"] },
    concepts: ["cyclone", "zoning", "climate-vulnerability", "land-use-planning"], tags: ["coastal regulation", "setbacks", "resilience"],
    summary: "Enforced coastal setbacks and hazard zoning were associated with higher resilience scores in exposed coastal districts, with benefits scaling with hazard exposure.",
    findings: [
      F("zoning", "climate-resilience", "increase", "About 1.0 resilience point per 10 points of zoning enforcement in highly exposed districts.", { value: 1.0, unit: "index", low: 0.3, high: 1.6, per: "+10 pts zoning" }),
    ],
    design: "cross-sectional", sample: "14 coastal districts", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-014"], indicators: ["climateResilience", "zoningStrictness"],
  },
  {
    id: "RS-024", type: "research", title: "Simulating conclusive titling: tenure security and credit under alternative title-guarantee designs",
    source: "Institute for Agrarian & Spatial Policy", authors: ["R. Iyer"], year: 2022, geography: { scope: "national", regions: ["IN"] },
    concepts: ["titling", "tenure-security", "credit", "land-records"], tags: ["microsimulation", "title insurance", "modelling"],
    summary: "Microsimulation of household credit and land market behaviour under three conclusive-titling designs. Benefits depend heavily on record accuracy at the time of notification; guaranteeing inaccurate records shifts risk to the state.",
    findings: [
      F("conclusive-titling", "tenure-security", "increase", "Modelled tenure security rose substantially under designs with a prior resurvey.", { value: 18, unit: "%" }),
      F("conclusive-titling", "credit-access", "increase", "Modelled formal credit access rose about 9% for smallholders.", { value: 9, unit: "%" }),
    ],
    design: "modelling", sample: "Synthetic population of 50,000 households", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-006", "LW-002"], datasets: [], indicators: [],
  },
  {
    id: "RS-025", type: "research", title: "Property cards and credit: early evidence from drone-surveyed villages",
    source: "Indo-Gangetic Governance Lab", authors: ["A. Rizvi", "P. Deshmukh"], year: 2025, geography: { scope: "multi-state", regions: ["UP", "MH"] },
    concepts: ["svamitva", "drone-survey", "abadi", "credit", "land-disputes"], tags: ["property cards", "rural credit", "difference-in-differences"],
    summary: "Compares villages that received drone-survey property cards early with those scheduled later. Early villages saw more loans secured against residential property and fewer abadi boundary disputes.",
    findings: [
      F("resurvey", "credit-access", "increase", "Loans against residential property rose about 11% in early villages.", { value: 11, unit: "%" }),
      F("resurvey", "dispute-incidence", "decrease", "Abadi boundary disputes fell about 8%.", { value: -8, unit: "%" }),
    ],
    design: "quasi-experimental", sample: "640 villages", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-003"], datasets: ["DS-016"], indicators: [],
  },
  {
    id: "RS-026", type: "research", title: "Land pooling at the fringe: who gains from returned plots?",
    source: "Urban Fringe Studies Programme", authors: ["R. Menon"], year: 2023, geography: { scope: "district", regions: ["MH", "D521"] },
    concepts: ["land-pooling", "peri-urban", "land-conversion", "smallholders"], tags: ["town planning schemes", "distributional effects"],
    summary: "Case comparison of pooled and conventionally acquired fringe areas: pooling delivered serviced plots faster and with fewer disputes, but tenants and agricultural labourers were largely excluded from benefits.",
    findings: [
      F("land-pooling", "dispute-incidence", "decrease", "Pooled areas recorded fewer compensation disputes than acquired areas.", { value: -20, unit: "%" }),
      F("land-pooling", "equity", "mixed", "Owners gained; tenants and labourers without recorded rights did not.", undefined),
    ],
    design: "case-study", sample: "4 schemes", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-001"], datasets: [], indicators: [],
  },
  {
    id: "RS-027", type: "research", title: "Consent, compensation and delay: project-level analysis of acquisitions after 2014",
    source: "Revenue Administration Reform Cell", authors: ["D. Chauhan", "M. Joshi"], year: 2024, geography: { scope: "multi-state", regions: ["UP", "RJ", "MH", "OD"] },
    concepts: ["land-acquisition", "rfctlarr", "compensation", "land-disputes"], tags: ["acquisition delays", "project data", "consent"],
    summary: "Across 210 infrastructure projects, acquisitions under the 2013 framework took longer to initiate but faced fewer post-award disputes, shifting conflict earlier into consultation.",
    findings: [
      F("acquisition-reform", "implementation", "decrease", "Pre-award acquisition time increased by about 18%.", { value: 18, unit: "%" }),
      F("acquisition-reform", "dispute-incidence", "decrease", "Post-award compensation disputes fell by about 15%.", { value: -15, unit: "%" }),
    ],
    design: "cross-sectional", sample: "210 projects", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-001", "LW-006"], datasets: ["DS-015"], indicators: [],
  },
  {
    id: "RS-028", type: "research", title: "Recording tenants: leasing reform and access to farm credit",
    source: "Deccan Land Research Collaborative", authors: ["P. Deshmukh"], year: 2021, geography: { scope: "multi-state", regions: ["MH", "KA"] },
    concepts: ["tenancy", "land-leasing", "credit", "smallholders"], tags: ["licensed cultivators", "crop loans", "panel"],
    summary: "Households registered under leasing or licensed-cultivator arrangements obtained more crop loans and insurance than unregistered tenants, though registration uptake was low.",
    findings: [
      F("tenancy-reform", "credit-access", "increase", "Registered tenants were about 14% more likely to receive institutional crop loans.", { value: 14, unit: "%" }),
      F("tenancy-reform", "equity", "increase", "Benefits reached marginal cultivators where registration was simplified.", undefined),
    ],
    design: "panel", sample: "4,200 households", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-005"], datasets: [], indicators: [],
  },
  {
    id: "RS-029", type: "research", title: "Joint titling campaigns and women's ownership: a district comparison",
    source: "Institute for Agrarian & Spatial Policy", authors: ["S. Qureshi"], year: 2023, geography: { scope: "multi-state", regions: ["KA", "OD", "RJ"] },
    concepts: ["gender", "inheritance", "tenure-security", "mutation"], tags: ["joint titles", "mutation drives", "women's ownership"],
    summary: "Districts running joint-titling and inheritance mutation campaigns increased recorded women's ownership; gains persisted where mutation was online.",
    findings: [
      F("gender-rights", "equity", "increase", "Recorded women's ownership rose about 4 percentage points in campaign districts.", { value: 4, unit: "pp" }),
      F("gender-rights", "tenure-security", "increase", "Women owners reported higher tenure security.", undefined),
    ],
    design: "quasi-experimental", sample: "38 districts", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-010"], datasets: ["DS-017"], indicators: ["womenOwnership"],
  },
  {
    id: "RS-030", type: "research", title: "Land record modernisation and its outcomes: a systematic review (demonstration)",
    source: "Bhū-Pramāṇa Evidence Synthesis Unit", authors: ["Evidence Synthesis Unit"], year: 2025, geography: { scope: "national", regions: ["IN"] },
    concepts: ["digitization", "evidence-synthesis", "land-disputes", "service-delivery", "credit"], tags: ["systematic review", "evidence synthesis"],
    summary: "Synthesises 27 demonstration studies on record digitisation, resurvey and mutation reform. Evidence is strongest for service-delivery time, moderate for disputes and weak for credit and equity outcomes.",
    findings: [
      F("record-digitization", "processing-time", "decrease", "Consistent reductions in processing time across settings; pooled estimate about 9% per 10 points.", { value: -9, unit: "%", low: -13, high: -5, per: "+10 pp" }),
      F("record-digitization", "dispute-incidence", "decrease", "Moderate evidence of fewer disputes; pooled estimate about 6% per 10 points with high heterogeneity.", { value: -6, unit: "%", low: -10, high: -2, per: "+10 pp" }),
      F("record-digitization", "credit-access", "increase", "Few studies measured credit; direction positive but uncertain.", undefined),
    ],
    design: "systematic-review", sample: "27 studies", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-001", "RS-001", "RS-002", "RS-003", "RS-004"], datasets: ["DS-011"], indicators: ["digitization", "mutationDays", "disputePressure"],
  },
  {
    id: "RS-031", type: "research", title: "Detecting unauthorised land-use change with open satellite data: a method for zoning enforcement",
    source: "Urban Fringe Studies Programme", authors: ["R. Menon", "S. Qureshi"], year: 2025, geography: { scope: "multi-state", regions: ["MH", "KA", "UP"] },
    concepts: ["lulc", "geospatial", "zoning", "land-conversion", "encroachment"], tags: ["change detection", "method", "enforcement"],
    summary: "Presents a change-detection workflow that flags probable unauthorised conversion for field verification, reducing inspection effort and improving the enforceability of zoning.",
    findings: [
      F("zoning", "implementation", "increase", "Satellite-flagged inspection raised enforcement coverage at similar staff cost.", undefined),
    ],
    design: "modelling", sample: "3 pilot districts", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-007"], datasets: ["DS-013", "DS-002"], indicators: ["landUsePressure"],
  },

  /* ================================================ CASE STUDIES (demo) */
  {
    id: "CS-001", type: "case-study", title: "Clearing the mutation backlog in a western UP district",
    source: "Revenue Administration Reform Cell", year: 2023, geography: { scope: "district", regions: ["UP", "D138"] },
    concepts: ["mutation", "service-delivery", "administrative-capacity"], tags: ["backlog drive", "camp courts", "demo case"],
    summary: "A time-bound drive combining camp courts, online status tracking and weekly review cleared most pending undisputed mutations within six months; disputed mutations required a separate track.",
    findings: [F("e-mutation", "processing-time", "decrease", "Median undisputed mutation time fell from about seven weeks to under three weeks.", { value: -55, unit: "%" })],
    design: "case-study", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-008"], datasets: ["DS-012"], indicators: ["mutationDays"],
  },
  {
    id: "CS-002", type: "case-study", title: "When a new land portal slows things down: lessons from a state system migration",
    source: "Deccan Land Research Collaborative", year: 2022, geography: { scope: "state", regions: ["KA"] },
    concepts: ["digitization", "service-delivery", "mutation"], tags: ["system migration", "transition costs", "demo case"],
    summary: "A migration to a new integrated land portal temporarily increased processing times as legacy records were reconciled and staff retrained, before times fell below the pre-migration level.",
    findings: [F("record-digitization", "processing-time", "increase", "Processing times rose for about nine months during migration before improving.", { value: 22, unit: "%", per: "transition period" })],
    design: "case-study", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-008"], datasets: ["DS-012"], indicators: ["mutationDays"],
  },
  {
    id: "CS-003", type: "case-study", title: "Mobile revenue courts for flood-affected villages in Assam",
    source: "Northeast Land & Rivers Observatory", year: 2024, geography: { scope: "district", regions: ["AS", "D303", "D301"] },
    concepts: ["revenue-courts", "flood", "land-disputes", "adr"], tags: ["mobile courts", "erosion disputes", "demo case"],
    summary: "Seasonal mobile court sittings in erosion-hit areas resolved boundary disputes on-site using updated drone maps, reducing pendency and travel burden for litigants.",
    findings: [F("dispute-resolution", "dispute-incidence", "decrease", "Pending erosion-related boundary cases fell by about a quarter in two seasons.", { value: -25, unit: "%" })],
    design: "case-study", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-015"], indicators: ["pendingCases"],
  },
  {
    id: "CS-004", type: "case-study", title: "Green-belt enforcement and informal colonies at the NCR fringe",
    source: "Indo-Gangetic Governance Lab", year: 2024, geography: { scope: "district", regions: ["UP", "D140"] },
    concepts: ["zoning", "encroachment", "land-disputes", "peri-urban"], tags: ["informal subdivision", "regularisation", "demo case"],
    summary: "Strict enforcement without a regularisation route pushed development into informal colonies on agricultural land, generating disputes among buyers of unregistered plots.",
    findings: [F("zoning", "dispute-incidence", "increase", "Disputes over unregistered plots rose after enforcement tightened.", { value: 9, unit: "%" })],
    design: "case-study", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: [], datasets: ["DS-013"], indicators: ["disputePressure"],
  },
  {
    id: "CS-005", type: "case-study", title: "Coastal setbacks and mangrove belts in Kendrapara",
    source: "Coastal Resilience Research Network", year: 2023, geography: { scope: "district", regions: ["OD", "D379"] },
    concepts: ["cyclone", "watershed", "zoning", "climate-vulnerability"], tags: ["mangroves", "coastal zoning", "demo case"],
    summary: "Linking mangrove restoration to the land-use plan and restricting new construction in the setback zone reduced storm-surge damage to agricultural land in successive cyclones.",
    findings: [F("climate-adaptation", "climate-resilience", "increase", "Cyclone-related farmland damage fell substantially in protected stretches.", { value: 1.4, unit: "index", per: "+1% of budget" })],
    design: "case-study", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-009"], datasets: ["DS-014"], indicators: ["climateResilience"],
  },
  {
    id: "CS-006", type: "case-study", title: "A town planning scheme on Pune's eastern fringe",
    source: "Urban Fringe Studies Programme", year: 2022, geography: { scope: "district", regions: ["MH", "D521"] },
    concepts: ["land-pooling", "peri-urban", "land-use-planning"], tags: ["TPS", "land readjustment", "demo case"],
    summary: "Landowners pooled parcels and received reconstituted serviced plots; infrastructure was delivered ahead of development, though the scheme took over four years to finalise.",
    findings: [F("land-pooling", "land-use-change", "mixed", "Conversion was planned rather than reduced; serviced land replaced piecemeal sprawl.", undefined)],
    design: "case-study", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-007"], datasets: ["DS-013"], indicators: ["landUsePressure"],
  },
  {
    id: "CS-007", type: "case-study", title: "Consent-based acquisition for a logistics park in Rajasthan",
    source: "Thar Drylands Research Group", year: 2023, geography: { scope: "district", regions: ["RJ", "D104"] },
    concepts: ["land-acquisition", "rfctlarr", "compensation"], tags: ["consent", "social impact assessment", "demo case"],
    summary: "An extended consultation phase delayed the project start by over a year, but no post-award litigation was recorded, in contrast to earlier projects in the district.",
    findings: [F("acquisition-reform", "dispute-incidence", "decrease", "No post-award compensation litigation recorded.", { value: -100, unit: "%" })],
    design: "case-study", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-001"], datasets: [], indicators: [],
  },
  {
    id: "CS-008", type: "case-study", title: "Inheritance mutation camps for women in Mysuru district",
    source: "Institute for Agrarian & Spatial Policy", year: 2024, geography: { scope: "district", regions: ["KA", "D577"] },
    concepts: ["gender", "inheritance", "mutation"], tags: ["mutation camps", "succession", "demo case"],
    summary: "Village-level camps processed pending succession mutations and flagged cases where daughters had been omitted, raising the number of women recorded as co-owners.",
    findings: [F("gender-rights", "equity", "increase", "Women co-owners recorded rose noticeably in participating villages.", { value: 6, unit: "pp" })],
    design: "case-study", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["LW-010"], datasets: ["DS-017"], indicators: ["womenOwnership"],
  },

  /* ================================================ REPORTS (demo) */
  {
    id: "RP-001", type: "report", title: "State of Land Records 2025: digitisation, accuracy and use (demonstration report)",
    source: "Bhū-Pramāṇa Evidence Synthesis Unit", year: 2025, geography: { scope: "national", regions: ["IN"] },
    concepts: ["digitization", "land-records", "cadastral-map", "ulpin"], tags: ["annual report", "digitisation", "accuracy"],
    summary: "Annual demonstration report tracking record digitisation, map linkage and parcel-ID coverage, and highlighting that accuracy and resurvey — not only coverage — drive dispute outcomes.",
    findings: [F("record-digitization", "dispute-incidence", "decrease", "Across focus states, higher linkage coincides with lower dispute pressure, with notable exceptions in riverine districts.", undefined)],
    design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-001", "PO-002", "RS-030"], datasets: ["DS-011"], indicators: ["digitization", "mapLinkage"],
  },
  {
    id: "RP-002", type: "report", title: "Implementation review: roll-out pace and administrative capacity (demonstration report)",
    source: "Revenue Administration Reform Cell", year: 2025, geography: { scope: "multi-state", regions: ["UP", "MH", "KA", "OD", "AS", "RJ"] },
    concepts: ["administrative-capacity", "policy-experimentation", "service-delivery"], tags: ["implementation", "capacity", "roll-out"],
    summary: "Reviews reform roll-outs across focus states and recommends phasing targets to absorptive capacity, piloting in representative districts and funding support staff alongside technology.",
    findings: [F("record-digitization", "implementation", "decrease", "Front-loaded targets underperform phased targets when capacity is low.", { value: -30, unit: "%", per: "unit overload" })],
    design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["RS-021"], datasets: ["DS-016"], indicators: ["adminCapacity"],
  },
  {
    id: "RP-003", type: "report", title: "Peri-urban land governance outlook (demonstration report)",
    source: "Urban Fringe Studies Programme", year: 2025, geography: { scope: "multi-state", regions: ["MH", "KA", "UP", "RJ"] },
    concepts: ["peri-urban", "urban-expansion", "land-disputes", "zoning", "land-pooling"], tags: ["outlook", "urban fringe", "hotspots"],
    summary: "Identifies fast-urbanising fringe districts where dispute pressure and conversion are rising together, and compares zoning, pooling and record reforms as responses.",
    findings: [F("zoning", "land-use-change", "decrease", "Moderate enforcement slows conversion; very strict enforcement without regularisation displaces it.", undefined)],
    design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["RS-011", "RS-013", "RS-022"], datasets: ["DS-013"], indicators: ["landUsePressure", "disputePressure"],
  },
  {
    id: "RP-004", type: "report", title: "Climate risk and land use: a district screening (demonstration report)",
    source: "Coastal Resilience Research Network", year: 2024, geography: { scope: "multi-state", regions: ["OD", "AS", "RJ"] },
    concepts: ["climate-vulnerability", "flood", "drought", "cyclone", "land-use-planning"], tags: ["screening", "climate risk", "land-use plans"],
    summary: "Screens districts by climate vulnerability and land-system resilience, and recommends integrating hazard zoning and restoration investment into land-use plans for the most exposed districts.",
    findings: [F("climate-adaptation", "climate-resilience", "increase", "Resilience gains per rupee are highest in the most exposed districts.", undefined)],
    design: "administrative", provenance: "synthetic", license: "CC BY 4.0 (demo)", related: ["PO-009", "RS-015", "RS-016"], datasets: ["DS-014"], indicators: ["climateVulnerability", "climateResilience"],
  },
];

export const evidenceById: Record<string, Evidence> = Object.fromEntries(EVIDENCE.map((e) => [e.id, e]));
