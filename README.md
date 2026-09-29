# Bhū-Pramāṇa · National Land Policy Evidence Lab

> **From a policy question to a decision you can defend.**
> Smart India Hackathon 2026 · Problem statement **SIH26019**: *National Digital Platform for
> Research, Policy Innovation, and Evidence-Based Land Governance* (Ministry of Rural
> Development, Department of Land Resources).

Most "AI + GIS" platforms show a map and a chatbot. Bhū-Pramāṇa is built around one workflow,
the **Policy Casefile**, and it does one thing they don't: it tells a policymaker **how sure it
can be, why, and what would change its mind**.

```
ASK  →  EVIDENCE  →  PLACE  →  DECIDE  →  BRIEF
```

**The moment to remember.** The same reform (more revenue-court capacity plus record
digitisation) gets a different verdict in different places:

| | Verdict | Why |
|---|---|---|
| All-India evidence | **Adopt with monitoring** | Projected −30% land-dispute pressure by 2030; evidence confidence 79/100 |
| Thane, Maharashtra | **Pilot first** | 71% of the projection rests on assumption A02 (capacity → pendency), and a study from Maharashtra (RS-007: *induced demand in land adjudication*) contradicts it |

That contrast is computed from the data, not hard-coded. A unit test checks it
(`tests/decision.test.ts`). Every number on the screen traces back to a study, a law or a dataset.

> **Demonstration Dataset — Not an Official Government Record.** Indicator values, studies,
> case studies and effect sizes are synthetic and flagged as *Demo record* throughout.
> Laws, programmes and data portals are real *Reference* records (metadata + official link only).
> Independent hackathon prototype — not an official Government of India website.

---

## Quick start (no keys, no database)

Requirements: **Node.js 20.9+** (tested on Node 24) and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and click **Open the demo casefile**.

> **Windows PowerShell:** if you see *"npm.ps1 cannot be loaded because running scripts is
> disabled on this system"*, use `npm.cmd` instead of `npm` (e.g. `npm.cmd install`,
> `npm.cmd run dev`), or run the commands from Command Prompt or Git Bash. No execution-policy
> change is required.

Production build and checks:

```bash
npm run build && npm start
npm test            # 42 unit tests: data, search, synthesis, simulation, decision rule, evidence chain, briefs
npm run lint
npm run typecheck
```

Everything runs offline: the bundled evidence corpus and district data, hybrid retrieval,
deterministic synthesis, simulation and decision rule, and MapLibre with bundled boundaries
(no map tiles or CDN). The optional *Street context* toggle in the Atlas is the only feature
that fetches from the internet.

---

## The 3-minute demo

1. **Landing:** point at *"The same land reform. Two different decisions."* Click **Open the
   demo casefile**. This sets the Policymaker role and loads the question *"What are the main
   policy approaches for reducing land disputes in rapidly urbanising districts?"*
2. **Ask → Build the casefile.**
3. **Evidence:** a synthesis where every sentence cites its sources. It shows remedies vs risk
   factors, evidence strength per approach, the studies that disagree (side by side), and the
   list of attached sources.
4. **Place:** a map of the districts the evidence points to. Each candidate already shows its
   verdict and the reason. Thane: *Pilot first: Maharashtra study RS-007 contradicts A02*.
   India: *Adopt with monitoring*. Choose **Thane** and click **Test the policy here**.
5. **Decide:** the decision card (verdict, cited reasons, confidence, the all-India comparison,
   and *what would change this decision*). Below it: levers, outcome cards, the trend with its
   evidence-derived band, and sensitivity. Then the **evidence chain**: studies → model
   assumptions → projected outcomes. Hover RS-007 to see the red dashed "contradicts" edge
   into A02, which drives the dispute outcome. Move a lever and the decision updates live.
6. **Write the brief:** a reproducible brief (fingerprint `BP-…`) with numbered references,
   the decision section, assumptions table, limitations and further research.
   **Print / Save as PDF**, Markdown or JSON.

Other ways into a casefile: **Atlas** → pick a district → *Decide for this place* (re-runs the
open casefile there). **Evidence Library** → a question-like search → *Turn this question into a
policy casefile*. **Evidence record** → *Open as a policy casefile*.

---

## What we cut, and why

After challenging the first version against "judges have seen 20 AI + GIS dashboards", we
removed everything that did not strengthen the casefile:

| Removed | Reason |
|---|---|
| Separate Copilot, Evidence Graph and Policy Lab pages | They were five disconnected screens doing one job. Each is now a step of the casefile (`/copilot`, `/graph`, `/lab` redirect there). |
| Force-directed evidence graph | Looked impressive but explained nothing. Replaced by the **evidence chain**, where every edge carries a real quantity (the share of uncertainty an assumption causes). |
| Supabase schema, seeder, embeddings adapter | Unused by the demo and not wired to reads. Architecture that only sounds advanced. |
| Synthesis panel on the search page | It duplicated the casefile. The library now hands questions to the casefile. |

What stayed is secondary and supports the casefile: the Atlas, Evidence Library, Research
Agenda, Governance Dashboard, Workspace, Data Stewardship and Open APIs.

---

## How it decides

### Evidence-to-decision rule (`src/lib/sim/decision.ts`)

Deterministic and explainable. There is no LLM in the loop.

| Condition | Verdict |
|---|---|
| The package makes the headline outcome worse | **Reconsider the package** |
| The assumption driving the result is contradicted by evidence from this district or state | **Pilot first** |
| Evidence confidence ≥ 0.75 and the driving assumption is well evidenced | **Adopt with monitoring** |
| Confidence ≥ 0.50 | **Pilot first** |
| Otherwise | **Build the evidence first** |

Each verdict comes with cited reasons, the driving assumption and its studies, and the next
study that would most change the decision (value of information).

### Evidence grading (`src/lib/evidence/strength.ts`)

`weight = design × geographic relevance × recency`

`strength = [1 − Π(1 − 0.6·wᵢ)] × (1 − 0.35·contradiction share)`

The formula is simple enough to recompute by hand. Relevance is place-aware: a Maharashtra
study counts more for Thane than for Odisha.

### Simulation (`src/lib/sim/model.ts`)

A deterministic, closed-form model over a five-year horizon. **No machine learning.** Six
levers drive six outcomes through twelve coefficients (`src/data/assumptions.ts`). Each
coefficient cites the studies that support or contradict it.

- **Uncertainty band:** root-sum-square of one-at-a-time swings across each coefficient's
  evidence range.
- **Confidence:** Σ(variance share × evidence strength).
- **Implementation drag:** efficiency falls when the reform load exceeds administrative capacity.

Every result is labelled *Illustrative policy scenario — not an official forecast.*

### Evidence chain (`src/lib/sim/chain.ts`)

Built from the simulation's own sensitivity analysis:

- **studies → assumptions:** supports or contradicts, with local evidence flagged
- **assumptions → outcomes:** edge width is the share of uncertainty
- **baseline dataset → outcomes**

### Retrieval and synthesis (`src/lib/search/`, `src/lib/ai/copilot.ts`)

`score = 0.50·BM25 + 0.35·cosine(concept vectors) + 0.10·geographic match + 0.05·design prior`

A controlled vocabulary modelled on LandVoc expands queries: 60 concepts with synonyms,
acronyms and vernacular terms such as *khatauni*, *7/12* and *dakhil kharij*. Synthesis then
groups the structured findings by intervention, counts agreement, detects conflicts, and
proposes places and a policy package. Every sentence carries source IDs.

---

## Architecture

One Next.js app. No separate backend, database, queue, vector store or ML service.

```
Browser ──► Next.js (App Router)
             ├─ pages: casefile + secondary modules (React, client-side compute)
             ├─ /api/v1: the same pure functions as REST, GeoJSON, DCAT, CSV, OpenAPI
             └─ src/lib: pure TypeScript — search · synthesis · simulation · decision · chain · brief
             data: bundled TypeScript/JSON corpus + DataMeet boundaries (public/geo)
             state: browser localStorage (demo workspace)
```

The **only optional** external service is an LLM that rephrases the Evidence step's synthesis
(set `ANTHROPIC_API_KEY` in `.env.local`, see `.env.example`). The server rejects the rephrased
text unless every citation resolves to a retrieved source, and falls back to the deterministic
text otherwise. The sidebar shows *Fully offline* or *Offline + LLM phrasing*.

**Production path (not built):** move the corpus and workspaces to Postgres/PostGIS behind the
same `/api/v1` contracts, with curated ingestion. The pure `src/lib` functions stay unchanged.

---

## Modules

| Module | Route | Role in the story |
|---|---|---|
| **Policy Casefile** | `/case` | The signature workflow: Ask → Evidence → Place → Decide → Brief |
| Geo-Intelligence Atlas | `/atlas` | 16 indicator layers, states + 226 districts, profiles; *Decide for this place* |
| Evidence Library | `/search` | Faceted search with query understanding and per-result explanations |
| Research Agenda | `/agenda` | Evidence gap map, all 12 model assumptions with their studies (`?focus=A02`), research calls |
| Governance Dashboard | `/dashboard` | National KPIs, hotspots, trends, pilots |
| Workspace | `/workspace` | Casefiles, briefs, notes, saved evidence and scenarios, compare |
| Briefs | `/brief` | Saved, fingerprinted briefs |
| Data Stewardship | `/admin` | Provenance registry, curation queue, role–permission matrix |
| Open APIs | `/developers` | Live "Try it" for every endpoint, OpenAPI 3.1 |

### Roles (demo accounts)

| Role | Can |
|---|---|
| Public user | Search, maps, dashboards, run casefiles (no saving, no brief) |
| Researcher | + workspace, notes, compare, save scenarios, write briefs, propose research |
| Policymaker | + decision annex in briefs (lands on the casefile) |
| Administrator | + data stewardship, admin API |

The role is also sent to the API (cookie or `x-demo-role` header), which enforces it. For
example, `POST /api/v1/brief` returns 403 for public users.

### APIs

`/api/v1/status` · `search` · `copilot` (evidence synthesis) · `simulate` (simulation **and
decision**) · `evidence` · `evidence/{id}` · `regions` · `regions/{code}` ·
`geo/{states|districts}` (GeoJSON) · `datasets` (DCAT-AP JSON-LD) · `indicators.csv` · `brief` ·
`admin/registry` · `openapi.json`

```bash
curl -X POST http://localhost:3000/api/v1/simulate -H "content-type: application/json" \
  -d '{"region":"D517","levers":{"digitization":9,"disputeCapacity":40,"rolloutYears":3,"climateInvestment":0,"infrastructure":0,"zoning":55}}'
# → "decision": { "verdict": "pilot", "driver": { "assumption": "A02", "localContradicting": ["RS-007"] }, … }
```

---

## Project structure

```
src/
  app/(site)/            landing (with the live Adopt-vs-Pilot contrast) + role picker
  app/(app)/case/        the Policy Casefile (5 steps)
  app/(app)/             atlas, search, agenda, dashboard, workspace, brief, admin, developers, evidence/[id]
  app/api/v1/            REST, GeoJSON, DCAT, CSV, OpenAPI
  components/case/       DecisionCard, EvidenceChain
  components/lab/        LeverPanel, OutcomeCards, AssumptionTable
  components/            design system, SVG charts, MapLibre map, shell
  data/                  evidence corpus, vocabulary, indicators, assumptions, taxonomy, generated/regions.json
  lib/
    case/signature.ts    demo question, evidence package, Adopt-vs-Pilot contrast
    sim/model.ts         simulation
    sim/decision.ts      evidence-to-decision rule
    sim/chain.ts         evidence chain
    evidence/strength.ts evidence grading
    search/              tokeniser, query understanding, hybrid engine
    ai/                  deterministic synthesis, optional LLM phrasing with citation validation
    brief/compose.ts     brief composition, fingerprint, Markdown export
scripts/                 region generator, MapLibre worker copy
tests/                   Vitest suites
docs/COMPETITIVE_ANALYSIS.md
```

Regenerate the demonstration district panel with `npm run data:regions` (seeded, deterministic).

---

## Data sources and licences

- **Boundaries:** DataMeet India community maps (states CC BY 4.0; Census 2011 districts
  CC BY 2.5 IN), simplified with mapshaper. The national outline follows India's official boundary.
- **Reference records** link to official sources (India Code, DoLR, SVAMITVA, NITI Aayog, DST,
  NRSC Bhuvan, SAC, NJDG, data.gov.in, Land Conflict Watch). No values are copied from them.
- **Synthetic data:** all studies, case studies, demo datasets, district indicator values and
  effect sizes were generated for demonstration and are labelled as such.
- **Fonts:** Source Serif 4, Source Sans 3, Source Code Pro and Noto Sans Devanagari (SIL OFL),
  bundled via Fontsource.
