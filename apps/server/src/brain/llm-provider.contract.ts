// LLM Provider contract — định nghĩa boundary giữa Brain và LLM provider.
//
// Nguyên tắc:
// - Provider chỉ nhận prompt, gọi model, trả text.
// - Provider KHÔNG parse intent, KHÔNG gọi Skill, KHÔNG đọc Knowledge/Memory/Tool.
// - Provider KHÔNG chứa business rule.
// - Contract tối thiểu — không tool calling, streaming, retry, cache, RAG.
//
// Provider cụ thể (OpenAI/Gemini/Claude/DeepSeek) sẽ implements interface này
// ở task sau. TASK 10.6 chỉ tạo contract.

export type LlmGenerateInput = {
  // System instruction (persona, rules, output format)
  systemPrompt: string;

  // User content (message + context đã build bởi caller)
  userPrompt: string;
};

export type LlmGenerateOutput = {
  // Text model trả về
  text: string;
};

export interface LlmProvider {
  generate(input: LlmGenerateInput): Promise<LlmGenerateOutput>;
}