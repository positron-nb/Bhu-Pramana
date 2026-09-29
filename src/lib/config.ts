/**
 * Runtime configuration. Everything is optional: with no environment
 * variables the platform runs fully offline (bundled data, local retrieval,
 * deterministic synthesis and simulation). An Anthropic key only lets an LLM
 * rephrase the cited synthesis. Server-only — never import from client code.
 */
export type LlmProviderId = "none" | "anthropic";

export interface PlatformConfig {
  llm: { provider: LlmProviderId; model: string };
  mode: "offline" | "llm-assisted";
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function getConfig(): PlatformConfig {
  const requested = env("LLM_PROVIDER");
  const hasKey = !!(env("ANTHROPIC_API_KEY") || env("ANTHROPIC_AUTH_TOKEN"));
  const provider: LlmProviderId = requested === "none" ? "none" : requested === "anthropic" || hasKey ? "anthropic" : "none";
  return {
    llm: { provider, model: env("LLM_MODEL") ?? "claude-opus-5-5" },
    mode: provider === "anthropic" ? "llm-assisted" : "offline",
  };
}
