# SIH26019 — competitor research and differentiation

Research date: 29 Sep 2026. Twenty public repositories matching SIH26019 / land-governance
platforms were cloned and read, plus the reference open-source systems below. No code, text,
branding or UI from any of them was reused.

## A. Existing SIH26019 feature patterns

| Project (repo) | Stack | What it actually does |
|---|---|---|
| LandSetu (CodewithEvilxd/LandSetu) | React + Express + Python RAG service | 15 pages: legal RAG over statutes, Leaflet cadastral map (Khasra/ULPIN parcels), OCR digitiser, trained delay-prediction model, SHA-256 audit ledger, policy sandbox with formula-based runs. Self-graded "96/100" audit documents. |
| GeoSetu (teamveda049-droid/VEDASIH-2026) | Vite + React | Single page mirroring the 6-slide SIH template. 15 mock documents with keyword ranking; policy sliders feeding a hard-coded weighted formula; navy/saffron/green palette. |
| xarjunpatil/SIH26019-… | FastAPI + static HTML | Generic "mission control" dark glassmorphism template about landslide telemetry — domain mismatch with the problem statement. |
| GeoNiti / BhuNiti (Sambhav-Gupta12/GeoNiti) | Docker, Node API, Python AI, pgvector | Backend-heavy plan including an "evidence graph"; frontend, scenario sandbox and graph were still unbuilt at review time. |
| BHUMI-INTEL (ng923286-svg) | Single static HTML | "Evidence → Insight → Policy" framing with an Evidence Graph page whose nodes are hand-positioned HTML; CSS "map" with fake markers. |
| BHU-VEDA, Surya9918, Landspare, BhuDrishti, NithinPranav-007, MeetpuriGoswami-dev, bhoominiti-ai, others | Mixed (FastAPI, Streamlit, React, Neo4j, ChromaDB) | Multi-agent orchestrators, OCR of gazettes, Neo4j legal graphs, Gemini-generated briefs, hash-chained "provenance ledgers", Khasra/ULPIN citizen search, Streamlit dashboards. |

Reference open source studied: **CKAN** (DCAT dataset metadata and harvesting), **GeoNode**
(layer + metadata + OGC services), **MapLibre GL JS** (vector maps without vendor tiles),
**pgvector** (HNSW cosine search inside Postgres), **DataMeet maps** (India boundaries
consistent with the official national boundary).

## B. Commonly repeated ideas

- The same 10–15 page menu: dashboard, repository, AI chat, GIS, sandbox, workspace, innovation, admin.
- Slider → chart simulators whose coefficients are unexplained constants, or "ML" trained on synthetic data.
- "Zero-hallucination RAG" claims without showing conflicts or evidence quality.
- SHA-256 / blockchain-style ledgers presented as trust.
- Cadastral parcel viewers and Khasra search — DoLR's operational land-records work, not research and policy.
- Leaflet with remote tiles; multi-service Python + Node + Docker setups that are hard to run.

## C. What judges will have seen repeatedly

AI chat with citations · choropleth India map · policy sliders with a line chart · KPI dashboard ·
innovation/hackathon listing · role login screen · "evidence graph" as a static picture.

## D. Missing opportunities

1. Modules are silos: search results never flow into the simulator; simulator coefficients never link to evidence.
2. Evidence graphs are hand-drawn, not computed from the repository.
3. No simulator shows *why* it is uncertain or which assumption the result depends on.
4. Conflicting evidence is not surfaced — answers read as consensus.
5. Briefs are text exports; individual claims cannot be traced or reproduced.
6. Nothing turns weak evidence into a research agenda, although the problem statement is about
   strengthening *applied research and policy experimentation*.
7. The map is decoration: selecting a district does not change evidence, baselines or scenarios.

## E. Differentiation strategy

- **A decision, not a dashboard.** A transparent evidence-to-decision rule turns each simulation
  into *Adopt with monitoring*, *Pilot first*, *Build the evidence first* or *Reconsider*, with cited
  reasons, the assumption the result rests on, and the study that would change the verdict.
- **Evidence that knows where it applies.** Evidence weight is place-aware. The same package is
  *Adopt* on all-India evidence but *Pilot first* in Thane, because a Maharashtra study (RS-007)
  contradicts the assumption driving the result. No competitor reasons about where evidence holds.
- **Evidence-weighted simulation.** Every model coefficient (A01–A12) is backed by cited studies.
  The evidence range becomes the uncertainty band, and evidence quality (design × geographic
  relevance × recency, penalised for contradiction) becomes the confidence.
- **An evidence chain for every number.** Studies → model assumptions → projected outcomes,
  built from the simulation's own sensitivity analysis, so each edge carries a real quantity.
  It replaces the hand-drawn "evidence graphs" seen in competitors.
- **Uncertainty → research agenda.** Sensitivity plus value-of-information names the study that
  would most sharpen the decision. A 3ie-style **evidence gap map** shows where India has no
  causal evidence.
- **One workflow.** The Policy Casefile (Ask → Evidence → Place → Decide → Brief) ends in a brief
  with numbered citations and a reproducibility fingerprint.
- **Epistemic labels (pramāṇa).** Every output is marked Observed (Pratyakṣa), Documented (Śabda)
  or Inferred (Anumāna). Demonstration records are flagged everywhere.
- **Runs in two commands, offline.** One Next.js app, bundled data, no database, no ML service.
  An LLM that rephrases syntheses (with citation validation) is the only optional provider.

## E2. Architecture challenge (revision)

The first build had eleven modules, including a separate Copilot, Evidence Graph and Policy Lab,
plus Supabase and embeddings adapters. Tested against "judges have already seen 20 AI + GIS
dashboards", most of that read as breadth rather than insight. The revision:

- makes the **Policy Casefile** the product, with the other modules as secondary entry points;
- folds Copilot, Graph and Lab into casefile steps, and replaces the graph with the evidence chain;
- removes the Supabase schema, seeder and embeddings adapter, because they were not used by the
  demo and only made the architecture sound more advanced;
- adds the decision rule. This is the one new idea, and the one judges are likely to remember.

## F. Final product concept

**Bhū-Pramāṇa — National Land Policy Evidence Lab.** Research-and-policy infrastructure built
around one workflow, the Policy Casefile. A policymaker asks a question, sees the evidence
(including where it disagrees), finds where it matters on the map, and tests a reform with an
honest, evidence-weighted model. They get a decision that says how sure it is and why, then leave
with a traceable brief. Researchers see exactly which study would change the answer.
