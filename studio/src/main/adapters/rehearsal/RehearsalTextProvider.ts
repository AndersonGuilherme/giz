import type { TextAnswer, TextProvider, TextRequest } from 'giz-core/src/application/ports/TextProvider.ts';
import type { CoreCost } from '../coreModules.ts';
import type { IdeaFields } from '../../../shared/projects.ts';
import { rehearsalAnswer } from './rehearsalAnswer.ts';

/** A theme with this mark never gets a valid answer: the rehearsal of a generation that fails. */
export const REHEARSAL_FAILURE = 'ensaio-falha';
const PAUSE = 900;
const later = (milliseconds: number) => new Promise((done) => setTimeout(done, milliseconds));

/**
 * The pretend text AI of rehearsal mode: no network, no key. Its first answer has an invalid pose (core repairs it on
 * the second call), so the progress shows "call 2 of 4"; each call takes a moment, so it can be watched and cancelled.
 */
export class RehearsalTextProvider implements TextProvider {
  readonly #idea: IdeaFields;
  readonly #cost: CoreCost['CostEstimate'];
  #calls = 0;

  constructor(idea: IdeaFields, cost: CoreCost['CostEstimate']) {
    this.#idea = idea;
    this.#cost = cost;
  }

  async generate(): Promise<TextAnswer> {
    await later(PAUSE);
    this.#calls += 1;
    const broken = this.#calls === 1 || this.#idea.theme.includes(REHEARSAL_FAILURE);
    return { text: JSON.stringify(rehearsalAnswer(this.#idea, broken)), usage: { inputTokens: 9000, outputTokens: 1200 } };
  }

  /** Three dollars per million characters in, fifteen per million tokens out: a believable figure. */
  estimate(request: TextRequest) {
    const input = (request.system.length + request.prompt.length) * 3;
    return this.#cost.ofDollars((input + (request.maxTokens ?? 0) * 15) / 1_000_000);
  }
}
