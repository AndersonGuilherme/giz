import type { SavedScenarioImage, ScenarioImageStore } from '../../src/application/ports/ScenarioImageStore.ts';

export class InMemoryScenarioImageStore implements ScenarioImageStore {
  readonly saved = new Map<string, SavedScenarioImage>();
  readonly linked: string[] = [];
  /** Lines whose scenes/<id>.png the person put there (not made by giz images). */
  readonly foreign = new Set<string>();

  savedHash(lineId: string): string | undefined {
    return this.saved.get(lineId)?.hash;
  }

  async foreignFile(lineId: string): Promise<boolean> {
    return this.foreign.has(lineId);
  }

  async save(saved: SavedScenarioImage): Promise<void> {
    this.saved.set(saved.lineId, saved);
  }

  async link(lineIds: readonly string[]): Promise<void> {
    this.linked.push(...lineIds);
  }
}
