// OpenAICompatibleProvider — LlmProvider implementation gọi OpenAI-compatible
// /chat/completions endpoint (hoạt động với OpenAI, DeepSeek, Together,
// Groq, vLLM, Ollama, LM Studio, ... đều dùng cùng schema).
//
// Nguyên tắc:
// - Chỉ nhận prompt, gọi model, trả text.
// - KHÔNG parse intent, KHÔNG gọi Skill, KHÔNG đọc Knowledge/Memory/Tool.
// - KHÔNG retry, KHÔNG cache, KHÔNG xử lý business rule.
// - Lỗi HTTP/API → throw Error. Caller (LlmBrain) tự fallback.

import type {
  LlmGenerateInput,
  LlmGenerateOutput,
  LlmProvider,
} from "./llm-provider.contract";

export type OpenAICompatibleConfig = {
  apiKey: string;
  baseURL: string;
  model: string;
  // Timeout ms, mặc định 30s
  timeoutMs?: number;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class OpenAICompatibleProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: OpenAICompatibleConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL.replace(/\/+$/, "");
    this.model = config.model;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  async generate(input: LlmGenerateInput): Promise<LlmGenerateOutput> {
    const url = `${this.baseURL}/chat/completions`;

    const body = {
      model: this.model,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(
        `LLM HTTP ${response.status} ${response.statusText}: ${errText.slice(0, 500)}`,
      );
    }

    let data: ChatCompletionResponse;
    try {
      data = (await response.json()) as ChatCompletionResponse;
    } catch (err) {
      throw new Error(
        `LLM response is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.length === 0) {
      throw new Error("LLM response missing choices[0].message.content");
    }

    return { text };
  }
}

// Factory: tạo provider từ environment variables.
// Trả null nếu thiếu config — caller quyết định fallback.
export function createProviderFromEnv(): OpenAICompatibleProvider | null {
  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;

  if (!apiKey || !baseURL || !model) return null;

  return new OpenAICompatibleProvider({ apiKey, baseURL, model });
}