import { describe, expect, it } from "vitest";
import { assumptionById } from "@/data/assumptions";
import { evidenceById } from "@/data/evidence";
import type { Levers } from "@/lib/domain/schemas";
import { NATIONAL, regionByCode } from "@/lib/data/regions";
import { search } from "@/lib/search/engine";
import { synthesise } from "@/lib/ai/copilot";
import { simulate, statusQuoLevers } from "@/lib/sim/model";
import { decide, transferLevers } from "@/lib/sim/decision";
import { evidenceChain } from "@/lib/sim/chain";
import { packageFor, SIGNATURE_PLACE, SIGNATURE_QUESTION, signatureContrast } from "@/lib/case/signature";

const preset = synthesise(SIGNATURE_QUESTION, search(SIGNATURE_QUESTION)).labPreset.levers;
const thane = regionByCode[SIGNATURE_PLACE];
const pune = regionByCode["D521"];

function run(region: typeof thane, levers: Levers) {
  const res = simulate(region, levers, 5);
  return { res, decision: decide(res, region, levers) };
}

describe("evidence-to-decision rule", () => {
  it("adopts the evidence package nationally", () => {
    const { decision } = run(NATIONAL, packageFor(NATIONAL, preset));
    expect(decision.verdict).toBe("adopt");
    expect(decision.headlineOutput?.improves).toBe(true);
  });

  it("asks for a pilot in Thane because local evidence contradicts the driving assumption", () => {
    const { decision } = run(thane, packageFor(thane, preset));
    expect(decision.verdict).toBe("pilot");
    expect(decision.driver?.localContradicting).toContain("RS-007");
    expect(decision.nextStudy).toMatch(/\?$/);
  });

  it("recommends reconsidering a package that worsens the headline outcome", () => {
    const { decision } = run(pune, { ...statusQuoLevers(pune), infrastructure: 40 });
    expect(decision.verdict).toBe("reconsider");
  });

  it("makes no recommendation at status quo", () => {
    expect(run(pune, statusQuoLevers(pune)).decision.verdict).toBe("none");
  });

  it("is deterministic and every reason cites real evidence or assumptions", () => {
    const l = packageFor(thane, preset);
    const a = run(thane, l).decision;
    expect(run(thane, l).decision).toEqual(a);
    expect(a.reasons.length).toBeGreaterThan(1);
    for (const r of a.reasons) for (const id of r.cites) expect(evidenceById[id] ?? assumptionById[id], id).toBeDefined();
  });

  it("transfers the same policy change between places", () => {
    const l = packageFor(thane, preset);
    const t = transferLevers(l, thane, NATIONAL);
    const sqFrom = statusQuoLevers(thane);
    const sqTo = statusQuoLevers(NATIONAL);
    expect(t.disputeCapacity - sqTo.disputeCapacity).toBe(l.disputeCapacity - sqFrom.disputeCapacity);
    expect(t.rolloutYears).toBe(l.rolloutYears);
  });

  it("backs the landing-page claim: same package, Adopt nationally, Pilot in Thane", () => {
    const [india, local] = signatureContrast();
    expect(india.verdict).toBe("adopt");
    expect(local.verdict).toBe("pilot");
    expect(local.driver?.localContradicting.length).toBeGreaterThan(0);
  });
});

describe("evidence chain", () => {
  const { res } = run(thane, packageFor(thane, preset));
  const chain = evidenceChain(res, thane);

  it("only draws edges between nodes it contains, in column order", () => {
    const col = new Map(chain.nodes.map((n) => [n.id, n.col]));
    for (const e of chain.edges) {
      expect(col.has(e.from), e.from).toBe(true);
      expect(col.has(e.to), e.to).toBe(true);
      expect(col.get(e.from)!).toBeLessThan(col.get(e.to)!);
    }
  });

  it("shows the local contradicting study that drives the Thane decision", () => {
    const rs7 = chain.nodes.find((n) => n.id === "RS-007");
    expect(rs7?.contradicts).toBe(true);
    expect(rs7?.local).toBe(true);
    expect(chain.edges.some((e) => e.from === "RS-007" && e.kind === "contradicts")).toBe(true);
  });

  it("has evidence, assumption and outcome columns", () => {
    for (const c of [0, 1, 2]) expect(chain.nodes.some((n) => n.col === c)).toBe(true);
  });
});
