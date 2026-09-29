import { EVIDENCE } from "@/data/evidence";
import { json } from "@/lib/api";

export const dynamic = "force-static";

/** Full evidence catalogue (metadata, findings, links). */
export async function GET() {
  return json({ count: EVIDENCE.length, notice: "Records with provenance 'synthetic' are demonstration records.", items: EVIDENCE });
}
