import type { StageState } from './StageState.ts';

/** One made thing (a line's voice, a scene's image) against what it would be made from now. */
export type Freshness = 'missing' | 'stale' | 'current';
export type StageItem = Readonly<{ id: string; freshness: Freshness }>;

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

  /** One outdated item makes the stage stale; otherwise a missing one leaves it ready; with none (or all current), done. */
  state(): StageState {
    if (this.stale().length > 0) return 'stale';
    return this.missing().length > 0 ? 'ready' : 'done';
  }

  #idsWith(freshness: Freshness): string[] {
    return this.#items.filter((item) => item.freshness === freshness).map((item) => item.id);
  }
}
