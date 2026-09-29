import { describe, expect, it } from "vitest";
import type { Levers } from "@/lib/domain/schemas";
import { NATIONAL, regionByCode } from "@/lib/data/regions";
import { runModel, simulate, statusQuoLevers } from "@/lib/sim/model";

const pune = regionByCode["D521"];
const with_ = (r: typeof pune, patch: Partial<Levers>): Levers => ({ ...statusQuoLevers(r), ...patch });
const out = (res: ReturnType<typeof simulate>, id: string) => res.outputs.find((o) => o.id === id)!;

describe("policy simulation model", () => {
  it("is deterministic", () => {
    const l = with_(pune, { digitization: 5, disputeCapacity: 40 });
    expect(simulate(pune, l)).toEqual(simulate(pune, l));
  });

  it("status quo levers reproduce the baseline exactly", () => {
    const res = simulate(pune, statusQuoLevers(pune));
    for (const o of res.outputs) {
      expect(o.delta).toBeCloseTo(0, 9);
      expect(o.improves).toBeNull();
      expect(o.confidence).toBeNull();
    }
    expect(res.priorities).toHaveLength(0);
  });

  it("more dispute-resolution capacity lowers projected dispute pressure", () => {
    const a = out(simulate(NATIONAL, with_(NATIONAL, { disputeCapacity: 20 })), "disputePressure").scenario;
    const b = out(simulate(NATIONAL, with_(NATIONAL, { disputeCapacity: 60 })), "disputePressure").scenario;
    expect(b).toBeLessThan(a);
  });

  it("more digitisation shortens processing time and raises coverage", () => {
    const res = simulate(NATIONAL, with_(NATIONAL, { digitization: 20 }));
    expect(out(res, "processingDays").improves).toBe(true);
    expect(out(res, "digitizationCoverage").scenario).toBeGreaterThan(out(res, "digitizationCoverage").baseline);
  });

  it("infrastructure expansion raises land-use pressure (trade-off is visible)", () => {
    const res = simulate(pune, with_(pune, { infrastructure: 40 }));
    expect(out(res, "landUsePressure").improves).toBe(false);
  });

  it("an over-ambitious, fast roll-out loses implementation efficiency", () => {
    const heavy = { digitization: 20, disputeCapacity: 100, climateInvestment: 30, infrastructure: 50 };
    const fast = simulate(NATIONAL, with_(NATIONAL, { ...heavy, rolloutYears: 1 }));
    const slow = simulate(NATIONAL, with_(NATIONAL, { ...heavy, rolloutYears: 5 }));
    expect(fast.diagnostics.efficiency).toBeLessThan(slow.diagnostics.efficiency);
    expect(fast.diagnostics.overload).toBeGreaterThan(0);
  });

  it("uncertainty bands contain the scenario and confidence stays in [0, 1]", () => {
    const res = simulate(pune, with_(pune, { disputeCapacity: 40, climateInvestment: 10 }));
    for (const o of res.outputs) {
      expect(o.low).toBeLessThanOrEqual(o.scenario + 1e-9);
      expect(o.high).toBeGreaterThanOrEqual(o.scenario - 1e-9);
      if (o.confidence !== null) {
        expect(o.confidence).toBeGreaterThanOrEqual(0);
        expect(o.confidence).toBeLessThanOrEqual(1);
      }
    }
    for (const b of Object.values(res.bands)) expect(b.low.length).toBe(res.years.length);
  });

  it("digitisation cannot push coverage above 100%", () => {
    const { trajectory } = runModel(pune, with_(pune, { digitization: 40 }));
    for (const v of trajectory.values.digitizationCoverage) expect(v).toBeLessThanOrEqual(100);
  });

  it("names research priorities as questions", () => {
    const res = simulate(NATIONAL, with_(NATIONAL, { digitization: 20, disputeCapacity: 40 }));
    expect(res.priorities.length).toBeGreaterThan(0);
    expect(res.priorities[0].question).toMatch(/\?$/);
  });
});
