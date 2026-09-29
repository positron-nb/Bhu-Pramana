import { describe, expect, it } from "vitest";
import { evidenceById } from "@/data/evidence";
import { assumptionById } from "@/data/assumptions";
import { search } from "@/lib/search/engine";
import { synthesise } from "@/lib/ai/copilot";
import { briefToMarkdown, composeBrief, fingerprint } from "@/lib/brief/compose";
import { regionByCode } from "@/lib/data/regions";
import { statusQuoLevers } from "@/lib/sim/model";

const Q = "What are the main policy approaches for reducing land disputes in rapidly urbanising districts?";
const answer = synthesise(Q, search(Q));

describe("evidence synthesis (deterministic)", () => {
  it("cites a retrieved or dataset source for every summary sentence", () => {
    expect(answer.summary.length).toBeGreaterThan(2);
    for (const s of answer.summary) {
      expect(s.cites.length).toBeGreaterThan(0);
      for (const id of s.cites) expect(evidenceById[id], id).toBeDefined();
    }
  });

  it("identifies dispute resolution as a remedy and infrastructure as a risk factor", () => {
    const roles = Object.fromEntries(answer.approaches.map((a) => [a.intervention, a.role]));
    expect(roles["dispute-resolution"]).toBe("remedy");
    expect(roles["infrastructure"]).toBe("risk-factor");
  });

  it("surfaces conflicting evidence with both sides", () => {
    expect(answer.conflicts.length).toBeGreaterThan(0);
    for (const c of answer.conflicts) expect(c.sides.length).toBeGreaterThan(1);
  });

  it("proposes places and a policy package", () => {
    expect(answer.geography.length).toBeGreaterThan(0);
    expect(regionByCode[answer.labPreset.region]).toBeDefined();
    expect(answer.labPreset.levers.disputeCapacity).toBeGreaterThan(0);
  });
});

describe("policy brief", () => {
  const region = regionByCode[answer.labPreset.region];
  const input = {
    question: Q,
    regionCode: region.code,
    evidenceIds: answer.sources.slice(0, 8).map((s) => s.id),
    levers: { ...statusQuoLevers(region), ...answer.labPreset.levers },
    role: "policymaker" as const,
    synthesis: answer,
  };

  it("is reproducible: same inputs give the same fingerprint", () => {
    const a = composeBrief({ ...input, createdAt: "2026-01-01T00:00:00Z" });
    const b = composeBrief({ ...input, createdAt: "2026-06-01T00:00:00Z" });
    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.fingerprint).toMatch(/^BP-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(fingerprint("x")).not.toBe(fingerprint("y"));
  });

  it("numbers references uniquely and resolves every citation", () => {
    const b = composeBrief(input);
    const ns = b.references.map((r) => r.n);
    expect(new Set(ns).size).toBe(ns.length);
    const ids = new Set(b.references.map((r) => r.id));
    for (const c of [...b.keyMessages, ...b.evidenceSummary, ...b.insight]) {
      for (const id of c.cites) expect(ids.has(id) || !!assumptionById[id], id).toBe(true);
    }
  });

  it("states that the scenario is illustrative and the data synthetic", () => {
    const md = briefToMarkdown(composeBrief(input));
    expect(md).toMatch(/not an official forecast/i);
    expect(md).toMatch(/Demonstration Dataset/);
  });
});
