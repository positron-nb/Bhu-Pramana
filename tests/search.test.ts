import { describe, expect, it } from "vitest";
import { search, similarTo } from "@/lib/search/engine";
import { understandQuery } from "@/lib/search/query";
import { findRegionsInText } from "@/lib/data/regions";

const top = (q: string, n = 5) => search(q).hits.slice(0, n).map((h) => h.id);

describe("query understanding", () => {
  it("detects concepts from synonyms and vernacular terms", () => {
    expect(understandQuery("khatauni errors").concepts.some((c) => c.id === "land-records" && c.via === "direct")).toBe(true);
    expect(understandQuery("dakhil kharij delays").concepts.some((c) => c.id === "mutation")).toBe(true);
    expect(understandQuery("land digitisation").concepts.some((c) => c.id === "digitization")).toBe(true);
  });

  it("detects places, including new and old names", () => {
    expect(findRegionsInText("disputes in Bengaluru").map((r) => r.code)).toContain("D572");
    expect(findRegionsInText("Prayagraj and Orissa").map((r) => r.code)).toEqual(expect.arrayContaining(["D175", "OD"]));
    // lower-case "up" is not Uttar Pradesh
    expect(findRegionsInText("how to scale up land pooling").map((r) => r.code)).not.toContain("UP");
    expect(findRegionsInText("mutation delays in UP").map((r) => r.code)).toContain("UP");
  });

  it("recognises approach-style questions", () => {
    expect(understandQuery("What are the main policy approaches for reducing land disputes?").intent).toBe("approaches");
  });
});

describe("hybrid retrieval", () => {
  it("answers the example queries with relevant evidence", () => {
    expect(top("land acquisition delays", 3)).toContain("RS-027");
    expect(top("climate vulnerable land", 5)).toContain("DS-014");
    expect(top("land digitization", 5)).toContain("PO-001");
    expect(top("rural infrastructure", 3)).toContain("DS-018");
  });

  it("finds related evidence without word overlap via the concept vocabulary", () => {
    // "fast track" maps to the revenue-courts concept
    expect(top("fast track land tribunals", 5)).toContain("RS-005");
  });

  it("returns explanations and scoring components for every hit", () => {
    const r = search("peri-urban expansion");
    expect(r.hits.length).toBeGreaterThan(3);
    for (const h of r.hits) {
      expect(h.explanation.length).toBeGreaterThan(10);
      expect(h.score).toBeGreaterThan(0);
    }
  });

  it("applies filters", () => {
    const laws = search("land acquisition", { types: ["law"] });
    expect(laws.hits.length).toBeGreaterThan(0);
    expect(laws.hits.every((h) => h.id.startsWith("LW-"))).toBe(true);
    const recent = search("digitisation", { yearFrom: 2023 });
    expect(recent.hits.length).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    expect(top("urban land disputes", 10)).toEqual(top("urban land disputes", 10));
  });

  it("suggests similar records", () => {
    const sim = similarTo("RS-001");
    expect(sim.length).toBe(5);
    expect(sim[0].score).toBeGreaterThan(0);
  });
});
