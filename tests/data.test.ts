import { describe, expect, it } from "vitest";
import { EVIDENCE, evidenceById } from "@/data/evidence";
import { ASSUMPTIONS } from "@/data/assumptions";
import { CONCEPTS, conceptById } from "@/data/concepts";
import { INDICATORS } from "@/data/indicators";
import { OPPORTUNITIES } from "@/data/opportunities";
import { INTERVENTIONS, OUTCOMES } from "@/data/taxonomy";
import { AssumptionSchema, ConceptSchema, EvidenceSchema, IndicatorDefSchema, OpportunitySchema, RegionSchema } from "@/lib/domain/schemas";
import { REGIONS, regionByCode } from "@/lib/data/regions";

describe("seed data integrity", () => {
  it("every evidence record validates against the schema", () => {
    for (const e of EVIDENCE) expect(() => EvidenceSchema.parse(e), e.id).not.toThrow();
  });

  it("evidence ids are unique", () => {
    expect(new Set(EVIDENCE.map((e) => e.id)).size).toBe(EVIDENCE.length);
  });

  it("all cross-references resolve", () => {
    for (const e of EVIDENCE) {
      for (const id of [...e.related, ...e.datasets]) expect(evidenceById[id], `${e.id} → ${id}`).toBeDefined();
      for (const c of e.concepts) expect(conceptById[c], `${e.id} concept ${c}`).toBeDefined();
      for (const r of e.geography.regions) expect(regionByCode[r], `${e.id} region ${r}`).toBeDefined();
    }
  });

  it("every model assumption is backed by existing evidence", () => {
    for (const a of ASSUMPTIONS) {
      expect(() => AssumptionSchema.parse(a)).not.toThrow();
      expect(a.supporting.length).toBeGreaterThan(0);
      for (const id of [...a.supporting, ...a.contradicting]) expect(evidenceById[id], `${a.id} → ${id}`).toBeDefined();
      // central value lies within its evidence range
      expect(a.central).toBeGreaterThanOrEqual(Math.min(a.low, a.high));
      expect(a.central).toBeLessThanOrEqual(Math.max(a.low, a.high));
    }
  });

  it("reference records link to a source; research and case studies are flagged as demonstration", () => {
    for (const e of EVIDENCE) {
      if (e.provenance === "reference") expect(e.url, e.id).toBeTruthy();
      if (e.type === "research" || e.type === "case-study") expect(e.provenance, e.id).toBe("synthetic");
    }
  });

  it("vocabulary, indicators, taxonomy and opportunities validate", () => {
    for (const c of CONCEPTS) {
      expect(() => ConceptSchema.parse(c)).not.toThrow();
      for (const r of [...c.broader, ...c.related]) expect(conceptById[r], `${c.id} → ${r}`).toBeDefined();
    }
    for (const i of INDICATORS) expect(() => IndicatorDefSchema.parse(i)).not.toThrow();
    for (const o of OPPORTUNITIES) expect(() => OpportunitySchema.parse(o)).not.toThrow();
    for (const iv of INTERVENTIONS) for (const c of iv.concepts) expect(conceptById[c], `${iv.id} → ${c}`).toBeDefined();
    for (const o of OUTCOMES) for (const c of o.concepts) expect(conceptById[c], `${o.id} → ${c}`).toBeDefined();
  });

  it("the regional panel covers all states and the six focus states' districts", () => {
    for (const r of REGIONS) expect(() => RegionSchema.parse(r), r.code).not.toThrow();
    expect(REGIONS.filter((r) => r.level === "state")).toHaveLength(36);
    expect(REGIONS.filter((r) => r.level === "district").length).toBe(226);
    for (const r of REGIONS) for (const i of INDICATORS) expect(Number.isFinite(r.indicators[i.id]), `${r.code}.${i.id}`).toBe(true);
  });
});
