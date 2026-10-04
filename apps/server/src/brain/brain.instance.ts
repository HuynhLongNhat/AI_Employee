import type { Brain } from "./brain.contract";
import { RegexBrain } from "./regex-brain";
import { LlmBrain } from "./llm-brain";
import { FallbackBrain } from "./fallback-brain";
import { createProviderFromEnv } from "./openai-compatible.provider";

function selectBrain(): Brain {
 console.log("[Brain] LLM_API_KEY present:", !!process.env.LLM_API_KEY);
  console.log("[Brain] LLM_BASE_URL present:", !!process.env.LLM_BASE_URL);
  console.log("[Brain] LLM_MODEL present:", !!process.env.LLM_MODEL);
  const provider = createProviderFromEnv();

  if (!provider) {
    console.log("[Brain] LLM env not configured — using RegexBrain");
    return new RegexBrain();
  }

  console.log("[Brain] LLM env configured — using LlmBrain with RegexBrain fallback");
  return new FallbackBrain(new LlmBrain(provider), new RegexBrain());
}

export const brain: Brain = selectBrain();