import { SimulateRequestSchema } from "@/lib/domain/schemas";
import { getRegion } from "@/lib/data/regions";
import { simulate } from "@/lib/sim/model";
import { decide } from "@/lib/sim/decision";
import { json, problem } from "@/lib/api";

/** Deterministic scenario simulation. Same request → same response. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Body must be JSON");
  }
  const parsed = SimulateRequestSchema.safeParse(body);
  if (!parsed.success) return problem(400, "Invalid simulation request", parsed.error.flatten());
  const region = getRegion(parsed.data.region);
  if (!region) return problem(404, `Unknown region ${parsed.data.region}`);
  const res = simulate(region, parsed.data.levers, parsed.data.horizon);
  const d = decide(res, region, parsed.data.levers);
  return json({
    decision: {
      verdict: d.verdict,
      label: d.label,
      headline: d.headline,
      headlineOutput: d.headlineOutput?.id ?? null,
      reasons: d.reasons,
      driver: d.driver && { assumption: d.driver.assumption.id, label: d.driver.assumption.label, share: d.driver.share, strength: d.driver.strength, grade: d.driver.grade, supporting: d.driver.supporting, contradicting: d.driver.contradicting, localContradicting: d.driver.localContradicting },
      nextStudy: d.nextStudy,
    },
    ...res,
    priorities: res.priorities.map((p) => ({ ...p, assumption: { id: p.assumption.id, label: p.assumption.label } })),
    disclaimer: "Illustrative policy scenario — not an official forecast.",
  });
}
