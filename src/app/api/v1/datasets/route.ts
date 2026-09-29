import { EVIDENCE } from "@/data/evidence";
import { indicatorById } from "@/data/indicators";
import { conceptById } from "@/data/concepts";
import { json } from "@/lib/api";

export const dynamic = "force-static";

/**
 * DCAT-AP style catalogue (JSON-LD) so the repository can be harvested by
 * CKAN / data.gov.in-style portals and other research infrastructures.
 */
export async function GET() {
  const base = "https://bhu-pramana.example/api/v1";
  const datasets = EVIDENCE.filter((e) => e.type === "dataset").map((d) => ({
    "@id": `${base}/evidence/${d.id}`,
    "@type": "dcat:Dataset",
    "dct:identifier": d.id,
    "dct:title": d.title,
    "dct:description": d.summary,
    "dct:publisher": { "@type": "foaf:Organization", "foaf:name": d.source },
    "dct:issued": String(d.year),
    "dct:spatial": d.geography.regions,
    "dcat:keyword": [...d.tags, ...d.concepts.map((c) => conceptById[c]?.label ?? c)],
    "dct:license": d.license,
    "dcat:landingPage": d.url,
    "dct:accrualPeriodicity": d.distribution?.cadence,
    "prov:wasGeneratedBy": d.provenance === "synthetic" ? "Bhū-Pramāṇa demonstration generator (synthetic)" : "External reference system",
    "dqv:hasQualityAnnotation": d.provenance === "synthetic" ? "Demonstration Dataset — Not an Official Government Record" : "Reference link only; values not reproduced",
    "dcat:distribution": (d.distribution?.format ?? []).map((f) => ({ "@type": "dcat:Distribution", "dct:format": f, "dcat:accessURL": d.provenance === "synthetic" ? `${base}/indicators.csv` : d.url })),
    "bp:indicators": d.indicators.map((i) => ({ id: i, label: indicatorById[i as keyof typeof indicatorById]?.label })),
  }));
  return json({
    "@context": { dcat: "http://www.w3.org/ns/dcat#", dct: "http://purl.org/dc/terms/", foaf: "http://xmlns.com/foaf/0.1/", prov: "http://www.w3.org/ns/prov#", dqv: "http://www.w3.org/ns/dqv#", bp: `${base}/vocab#` },
    "@type": "dcat:Catalog",
    "dct:title": "Bhū-Pramāṇa land governance dataset catalogue",
    "dcat:dataset": datasets,
  });
}
