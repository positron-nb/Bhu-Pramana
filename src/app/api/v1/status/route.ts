import { ASSUMPTIONS } from "@/data/assumptions";
import { EVIDENCE } from "@/data/evidence";
import { INDICATORS } from "@/data/indicators";
import { REGIONS } from "@/lib/data/regions";
import { getConfig } from "@/lib/config";
import { MODEL_VERSION } from "@/lib/sim/model";
import { json } from "@/lib/api";

export async function GET() {
  const cfg = getConfig();
  return json({
    platform: "Bhū-Pramāṇa",
    version: "1.1.0",
    mode: cfg.mode,
    data: "Bundled demonstration dataset",
    retrieval: "Hybrid BM25 + concept vectors (offline)",
    llm: cfg.llm.provider,
    model: cfg.llm.provider === "none" ? undefined : cfg.llm.model,
    simulation: MODEL_VERSION,
    counts: { evidence: EVIDENCE.length, regions: REGIONS.length, assumptions: ASSUMPTIONS.length, indicators: INDICATORS.length },
    notice: "Demonstration Dataset — Not an Official Government Record",
  });
}
