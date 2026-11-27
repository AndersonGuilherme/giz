import type { StageState } from './StageState.ts';

/**
 * One made thing (a line's voice, a scene's image) against what it would be made from now; `blocked`: it cannot be
 * made as it is (a file in the way), and `problem` says why.
 */
export type Freshness = 'missing' | 'stale' | 'current' | 'blocked';
export type StageItem = Readonly<{ id: string; freshness: Freshness; problem?: string }>;

/** Nothing saved yet is missing; a saved hash other than the current one is stale; the same hash is current. */
export function freshnessOf(saved: string | undefined, current: string): Freshness {
  if (saved === undefined) return 'missing';
  return saved === current ? 'current' : 'stale';
}

/** The items of a stage, in script order (first-class collection). */
export class StageItems {
  static readonly NONE = new StageItems([]);

  readonly #items: readonly StageItem[];

  private constructor(items: readonly StageItem[]) {
    this.#items = items;
  }

  static of(items: readonly StageItem[]): StageItems {
    return new StageItems([...items]);
  }

  stale(): string[] {
    return this.#idsWith('stale');
  }

  missing(): string[] {
    return this.#idsWith('missing');
  }

  blocked(): string[] {
    return this.#idsWith('blocked');
  }

  /** Why the blocked items cannot be made, readable. */
  problems(): string[] {
    return this.#items.flatMap((item) => (item.problem ? [item.problem] : []));
  }

  /** An outdated or blocked item makes the stage stale; otherwise a missing one leaves it ready; with none (or all current), done. */
  state(): StageState {
    if (this.stale().length > 0 || this.blocked().length > 0) return 'stale';
    return this.missing().length > 0 ? 'ready' : 'done';
  }

  #idsWith(freshness: Freshness): string[] {
    return this.#items.filter((item) => item.freshness === freshness).map((item) => item.id);
  }
}
