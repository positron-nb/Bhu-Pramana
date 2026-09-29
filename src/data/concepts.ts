import type { Concept } from "@/lib/domain/schemas";

/**
 * Controlled vocabulary for land governance, inspired by the structure of
 * LandVoc (Land Portal Foundation) and extended with Indian administrative
 * and vernacular terms. Used for query understanding, concept-vector
 * retrieval and evidence-graph topics.
 */
export const CONCEPTS: Concept[] = [
  // --- administration -------------------------------------------------
  { id: "land-records", label: "Land records", alt: ["record of rights", "ror", "bhulekh", "khatauni", "jamabandi", "7/12 extract", "satbara", "pahani", "rtc", "patta", "adangal", "khata", "land register"], broader: [], related: ["digitization", "mutation", "cadastral-map"], group: "administration" },
  { id: "digitization", label: "Digitisation", alt: ["digitization", "digitisation", "computerisation", "computerization", "e-governance", "online records", "digital records", "modernisation", "modernization", "digitalisation"], broader: ["land-records"], related: ["dilrmp", "ulpin"], group: "administration" },
  { id: "dilrmp", label: "DILRMP", alt: ["digital india land records modernization programme", "nlrmp", "national land records modernisation programme", "land records modernisation"], broader: ["digitization"], related: ["land-records", "cadastral-map"], group: "administration" },
  { id: "ulpin", label: "ULPIN", alt: ["unique land parcel identification number", "bhu-aadhaar", "bhu aadhaar", "parcel id"], broader: ["digitization"], related: ["cadastral-map"], group: "administration" },
  { id: "cadastral-map", label: "Cadastral maps", alt: ["cadastral", "cadastre", "village maps", "field measurement book", "fmb", "tippan", "parcel map", "bhu-naksha", "bhunaksha", "map linkage"], broader: ["land-records"], related: ["survey"], group: "administration" },
  { id: "mutation", label: "Mutation", alt: ["dakhil kharij", "namantaran", "phodi", "transfer of title entry", "e-mutation", "auto-mutation", "automatic mutation"], broader: ["land-records"], related: ["registration", "service-delivery"], group: "administration" },
  { id: "registration", label: "Property registration", alt: ["registration", "sub-registrar", "sro", "ngdrs", "deed registration", "conveyance", "sale deed"], broader: [], related: ["stamp-duty", "mutation"], group: "administration" },
  { id: "survey", label: "Survey & resurvey", alt: ["resurvey", "re-survey", "settlement survey", "land survey", "cors", "ets survey", "geodetic survey"], broader: [], related: ["cadastral-map", "drone-survey"], group: "administration" },
  { id: "drone-survey", label: "Drone survey", alt: ["drone", "uav", "drone mapping", "aerial survey", "orthophoto"], broader: ["survey"], related: ["svamitva"], group: "method" },
  { id: "svamitva", label: "SVAMITVA", alt: ["svamitva scheme", "swamitva", "property cards", "abadi survey", "gram panchayat property"], broader: ["survey"], related: ["abadi", "drone-survey"], group: "administration" },
  { id: "abadi", label: "Rural inhabited land (abadi)", alt: ["abadi", "gaothan", "lal dora", "village settlement", "inhabited area"], broader: [], related: ["svamitva"], group: "tenure" },
  { id: "service-delivery", label: "Service delivery", alt: ["processing time", "turnaround", "delay", "delays", "citizen services", "time taken", "pendency of applications", "turn-around time"], broader: [], related: ["mutation", "administrative-capacity"], group: "administration" },
  { id: "administrative-capacity", label: "Administrative capacity", alt: ["capacity", "staffing", "patwari", "lekhpal", "talathi", "village accountant", "revenue staff", "implementation capacity", "implementation"], broader: [], related: ["service-delivery"], group: "administration" },

  // --- tenure ------------------------------------------------------------
  { id: "tenure-security", label: "Tenure security", alt: ["secure tenure", "property rights", "land rights", "title security", "ownership security"], broader: [], related: ["titling"], group: "tenure" },
  { id: "titling", label: "Titling", alt: ["conclusive title", "conclusive titling", "title guarantee", "title insurance", "presumptive title", "land titling", "torrens"], broader: ["tenure-security"], related: ["land-records"], group: "tenure" },
  { id: "tenancy", label: "Tenancy", alt: ["tenant", "tenants", "sharecropping", "bataidar", "informal tenancy", "concealed tenancy"], broader: [], related: ["land-leasing"], group: "tenure" },
  { id: "land-leasing", label: "Land leasing", alt: ["leasing", "lease", "model land leasing act", "agricultural leasing", "licensed cultivator"], broader: ["tenancy"], related: ["credit"], group: "tenure" },
  { id: "tribal-rights", label: "Tribal & forest rights", alt: ["forest rights", "fra", "pesa", "scheduled areas", "adivasi", "community forest resource", "cfr", "individual forest rights"], broader: ["tenure-security"], related: ["land-acquisition"], group: "tenure" },
  { id: "inheritance", label: "Inheritance & succession", alt: ["succession", "inheritance", "partition", "heirship", "varasat", "family partition"], broader: [], related: ["gender", "land-disputes"], group: "tenure" },

  // --- disputes ------------------------------------------------------------
  { id: "land-disputes", label: "Land disputes", alt: ["dispute", "disputes", "land conflict", "land conflicts", "boundary dispute", "title dispute", "encroachment", "land dispute", "property dispute"], broader: [], related: ["litigation", "revenue-courts"], group: "disputes" },
  { id: "litigation", label: "Litigation & pendency", alt: ["court cases", "pendency", "pending cases", "civil suits", "backlog", "njdg", "case disposal", "litigation"], broader: ["land-disputes"], related: ["revenue-courts"], group: "disputes" },
  { id: "revenue-courts", label: "Revenue courts", alt: ["revenue court", "rccms", "tehsildar court", "sdm court", "land tribunal", "fast-track court", "fast track"], broader: ["land-disputes"], related: ["adr"], group: "disputes" },
  { id: "adr", label: "Alternative dispute resolution", alt: ["adr", "mediation", "lok adalat", "conciliation", "arbitration", "gram nyayalaya"], broader: ["land-disputes"], related: ["revenue-courts"], group: "disputes" },

  // --- land use -------------------------------------------------------
  { id: "land-use-planning", label: "Land-use planning", alt: ["land use plan", "land-use plan", "master plan", "development plan", "spatial planning", "regional plan", "land use planning"], broader: [], related: ["zoning"], group: "land-use" },
  { id: "zoning", label: "Zoning", alt: ["zoning regulations", "land-use zoning", "zone", "green belt", "agricultural zone", "zoning strictness", "development control"], broader: ["land-use-planning"], related: ["land-conversion"], group: "land-use" },
  { id: "land-conversion", label: "Land conversion", alt: ["conversion", "na permission", "non-agricultural conversion", "change of land use", "clu", "diversion", "farmland loss", "agricultural land loss", "land-use change", "land use change", "lulc change"], broader: ["land-use-planning"], related: ["urban-expansion"], group: "land-use" },
  { id: "lulc", label: "Land use / land cover", alt: ["lulc", "land cover", "land use", "land-use", "remote sensing", "satellite imagery", "bhuvan", "sentinel", "landsat"], broader: [], related: ["land-conversion"], group: "land-use" },
  { id: "land-degradation", label: "Land degradation", alt: ["degradation", "desertification", "soil erosion", "wasteland", "salinity", "degraded land"], broader: [], related: ["climate-vulnerability", "watershed"], group: "climate" },
  { id: "common-land", label: "Common lands", alt: ["commons", "grazing land", "gauchar", "village commons", "shamlat", "panchayat land", "government land"], broader: [], related: ["encroachment"], group: "land-use" },
  { id: "encroachment", label: "Encroachment", alt: ["encroachment", "illegal occupation", "squatting", "land grabbing"], broader: ["land-disputes"], related: ["common-land"], group: "disputes" },

  // --- urban ---------------------------------------------------------
  { id: "urban-expansion", label: "Urban expansion", alt: ["urban", "urbanising", "urbanizing", "urbanisation", "urbanization", "urban growth", "urban sprawl", "rapidly urbanizing", "rapidly urbanising", "built-up growth", "city expansion"], broader: [], related: ["peri-urban", "land-conversion"], group: "urban" },
  { id: "peri-urban", label: "Peri-urban transition", alt: ["peri-urban", "periurban", "urban fringe", "rural-urban fringe", "urban-rural transition", "census towns", "urban edge"], broader: ["urban-expansion"], related: ["land-pooling", "zoning"], group: "urban" },
  { id: "land-pooling", label: "Land pooling", alt: ["land pooling", "land readjustment", "town planning scheme", "tps", "land reconstitution"], broader: ["land-use-planning"], related: ["peri-urban"], group: "urban" },
  { id: "land-value", label: "Land value", alt: ["land prices", "land value", "circle rate", "guidance value", "ready reckoner", "property prices", "speculation"], broader: [], related: ["stamp-duty"], group: "finance" },

  // --- acquisition ---------------------------------------------------
  { id: "land-acquisition", label: "Land acquisition", alt: ["acquisition", "compulsory acquisition", "eminent domain", "land acquisition delays", "acquisition delays", "project land", "right of way"], broader: [], related: ["rfctlarr", "compensation", "displacement"], group: "law" },
  { id: "rfctlarr", label: "RFCTLARR Act 2013", alt: ["rfctlarr", "larr", "larr act", "right to fair compensation", "land acquisition act 2013", "social impact assessment", "sia"], broader: ["land-acquisition"], related: ["compensation"], group: "law" },
  { id: "compensation", label: "Compensation & rehabilitation", alt: ["compensation", "solatium", "rehabilitation", "resettlement", "r&r"], broader: ["land-acquisition"], related: ["displacement"], group: "law" },
  { id: "displacement", label: "Displacement", alt: ["displacement", "project affected", "pap", "eviction", "dispossession"], broader: ["land-acquisition"], related: ["tribal-rights"], group: "equity" },

  // --- climate -------------------------------------------------------
  { id: "climate-vulnerability", label: "Climate vulnerability", alt: ["climate vulnerable", "climate risk", "vulnerability", "climate change", "climate-vulnerable land", "climate exposure", "resilience", "climate resilience", "adaptation"], broader: [], related: ["flood", "drought", "cyclone", "land-degradation"], group: "climate" },
  { id: "flood", label: "Floods & erosion", alt: ["flood", "floods", "flooding", "riverbank erosion", "floodplain", "char land", "inundation"], broader: ["climate-vulnerability"], related: [], group: "climate" },
  { id: "drought", label: "Drought & aridity", alt: ["drought", "arid", "water stress", "rainfed", "dryland"], broader: ["climate-vulnerability"], related: ["watershed"], group: "climate" },
  { id: "cyclone", label: "Cyclones & coastal hazard", alt: ["cyclone", "coastal", "storm surge", "coastal erosion", "crz", "coastal regulation zone", "mangrove"], broader: ["climate-vulnerability"], related: [], group: "climate" },
  { id: "watershed", label: "Watershed development", alt: ["watershed", "wdc-pmksy", "soil and water conservation", "check dams", "restoration", "land restoration"], broader: ["climate-vulnerability"], related: ["land-degradation"], group: "climate" },

  // --- infrastructure --------------------------------------------------
  { id: "rural-infrastructure", label: "Rural infrastructure", alt: ["rural infrastructure", "infrastructure", "rural roads", "pmgsy", "utilities", "electrification", "connectivity"], broader: [], related: ["roads", "corridors"], group: "infrastructure" },
  { id: "roads", label: "Roads", alt: ["road", "roads", "highways", "expressway", "road density"], broader: ["rural-infrastructure"], related: ["corridors"], group: "infrastructure" },
  { id: "corridors", label: "Economic corridors", alt: ["corridor", "industrial corridor", "dfc", "freight corridor", "bharatmala", "sez", "industrial park"], broader: ["rural-infrastructure"], related: ["land-acquisition", "land-value"], group: "infrastructure" },

  // --- finance -------------------------------------------------------
  { id: "credit", label: "Credit access", alt: ["credit", "loans", "kisan credit card", "kcc", "collateral", "mortgage", "bank finance", "investment"], broader: [], related: ["land-leasing", "titling"], group: "finance" },
  { id: "stamp-duty", label: "Stamp duty & land revenue", alt: ["stamp duty", "registration fee", "land revenue", "property tax", "revenue"], broader: [], related: ["registration", "land-value"], group: "finance" },

  // --- equity --------------------------------------------------------
  { id: "gender", label: "Women's land rights", alt: ["women", "gender", "joint titling", "joint title", "female ownership", "women's land rights", "daughters"], broader: ["tenure-security"], related: ["inheritance"], group: "equity" },
  { id: "smallholders", label: "Smallholders & marginal farmers", alt: ["smallholder", "marginal farmers", "small farmers", "landless", "poor households"], broader: [], related: ["tenancy"], group: "equity" },

  // --- method --------------------------------------------------------
  { id: "impact-evaluation", label: "Impact evaluation", alt: ["impact evaluation", "evaluation", "rct", "randomised", "randomized", "quasi-experimental", "difference-in-differences", "counterfactual", "causal"], broader: [], related: ["evidence-synthesis"], group: "method" },
  { id: "evidence-synthesis", label: "Evidence synthesis", alt: ["systematic review", "meta-analysis", "literature review", "evidence gap map", "synthesis"], broader: [], related: ["impact-evaluation"], group: "method" },
  { id: "geospatial", label: "Geospatial analysis", alt: ["gis", "geospatial", "spatial analysis", "mapping", "remote sensing", "satellite"], broader: [], related: ["lulc"], group: "method" },
  { id: "policy-experimentation", label: "Policy experimentation", alt: ["pilot", "pilots", "policy pilot", "sandbox", "experimentation", "scale-up", "scaling"], broader: [], related: ["impact-evaluation"], group: "method" },
];

export const conceptById: Record<string, Concept> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
