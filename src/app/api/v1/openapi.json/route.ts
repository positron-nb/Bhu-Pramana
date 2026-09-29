import { openApiSpec } from "@/lib/openapi";
import { json } from "@/lib/api";

export const dynamic = "force-static";

export async function GET() {
  return json(openApiSpec());
}
