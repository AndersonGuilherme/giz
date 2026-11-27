import type { SavedScenarioImage, ScenarioImageStore } from '../../src/application/ports/ScenarioImageStore.ts';

export class InMemoryScenarioImageStore implements ScenarioImageStore {
  readonly saved = new Map<string, SavedScenarioImage>();
  readonly linked: string[] = [];

  savedHash(lineId: string): string | undefined {
    return this.saved.get(lineId)?.hash;
  }

  async save(saved: SavedScenarioImage): Promise<void> {
    this.saved.set(saved.lineId, saved);
  }

  async link(lineIds: readonly string[]): Promise<void> {
    this.linked.push(...lineIds);
  }
}
