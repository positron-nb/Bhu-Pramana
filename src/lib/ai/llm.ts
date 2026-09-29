import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "@/lib/config";

/**
 * LLM provider abstraction. The platform never *depends* on an LLM: every
 * caller has a deterministic fallback, and the simulation never calls one.
 * Add a provider by implementing `LlmProvider` and registering it below.
 */
export interface LlmJsonRequest {
  system: string;
  prompt: string;
  /** JSON schema for structured output (object, additionalProperties: false). */
  schema: Record<string, unknown>;
  maxTokens?: number;
}

export interface LlmProvider {
  id: string;
  model: string;
  generateJson(req: LlmJsonRequest): Promise<unknown>;
}

class AnthropicProvider implements LlmProvider {
  id = "anthropic";
  private client = new Anthropic({ timeout: 45_000, maxRetries: 1 });
  constructor(public model: string) {}

  async generateJson(req: LlmJsonRequest): Promise<unknown> {
    const response = await this.client.beta.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 4000,
      // route safety declines to Anthropic's recommended fallback model instead of failing
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: req.schema } },
      system: req.system,
      messages: [{ role: "user", content: req.prompt }],
    });
    if (response.stop_reason === "refusal") throw new Error("LLM declined the request");
    if (response.stop_reason === "max_tokens") throw new Error("LLM output truncated");
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return JSON.parse(text);
  }
}

let cached: { key: string; provider: LlmProvider | null } | null = null;

export function getLlm(): LlmProvider | null {
  const cfg = getConfig();
  const key = `${cfg.llm.provider}:${cfg.llm.model}`;
  if (cached?.key === key) return cached.provider;
  const provider = cfg.llm.provider === "anthropic" ? new AnthropicProvider(cfg.llm.model) : null;
  cached = { key, provider };
  return provider;
}

export function describeLlmError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "LLM authentication failed";
  if (err instanceof Anthropic.RateLimitError) return "LLM rate-limited";
  if (err instanceof Anthropic.APIConnectionError) return "LLM unreachable";
  if (err instanceof Anthropic.APIError) return `LLM error ${err.status}`;
  if (err instanceof SyntaxError) return "LLM returned invalid JSON";
  return err instanceof Error ? err.message : "LLM error";
}
