import type { TextAnswer, TextProvider, TextRequest } from '../../src/application/ports/TextProvider.ts';
import { CostEstimate } from '../../src/domain/ai/CostEstimate.ts';

/** Answers with fixed texts, one per call (the last one repeats), and keeps every request; never calls a service. */
export class FakeTextProvider implements TextProvider {
  readonly requests: TextRequest[] = [];
  readonly #answers: string[];

  constructor(answers: readonly unknown[]) {
    this.#answers = answers.map((answer) => (typeof answer === 'string' ? answer : JSON.stringify(answer)));
  }

  async generate(request: TextRequest): Promise<TextAnswer> {
    const text = this.#answers[Math.min(this.requests.length, this.#answers.length - 1)]!;
    this.requests.push(request);
    return { text, usage: { inputTokens: 1000, outputTokens: 200 } };
  }

  /** One dollar per million characters of request plus one per million output tokens: easy to check. */
  estimate(request: TextRequest): CostEstimate {
    return CostEstimate.ofDollars((request.system.length + request.prompt.length + (request.maxTokens ?? 0)) / 1_000_000);
  }
}
