// FallbackBrain — wrapper Brain: thử primary, nếu confidence = 0 thì gọi fallback.
//
// Nguyên tắc:
// - Không chứa logic interpret riêng.
// - Không biết primary/fallback là Regex hay LLM.
// - Chỉ quyết định: primary confident → dùng primary; ngược lại → fallback.

import type { Brain, BrainInput, BrainOutput } from "./brain.contract";

export class FallbackBrain implements Brain {
  constructor(
    private readonly primary: Brain,
    private readonly fallback: Brain,
  ) {}

  async interpret(input: BrainInput): Promise<BrainOutput> {
    const primaryResult = await this.primary.interpret(input);

    if (primaryResult.confidence > 0) {
      return primaryResult;
    }

    return this.fallback.interpret(input);
  }
}