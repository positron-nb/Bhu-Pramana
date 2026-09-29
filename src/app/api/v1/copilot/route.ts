import { z } from "zod";
import { synthesise } from "@/lib/ai/copilot";
import { enhanceWithLlm } from "@/lib/ai/enhance";
import { search } from "@/lib/search/engine";
import { json, problem } from "@/lib/api";

const Body = z.object({
  question: z.string().trim().min(3).max(500),
  region: z.string().max(8).optional(),
  useLlm: z.boolean().default(true),
});

/** Cited evidence synthesis. Deterministic; an optional LLM may rephrase it (citations validated). */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Body must be JSON");
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return problem(400, "Invalid request", parsed.error.flatten());
  const { question, region, useLlm } = parsed.data;
  const answer = synthesise(question, search(question, {}, 30), { regionCode: region });
  return json(useLlm ? await enhanceWithLlm(answer) : answer);
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return problem(400, "Missing ?q=");
  return json(synthesise(q, search(q, {}, 30)));
}
