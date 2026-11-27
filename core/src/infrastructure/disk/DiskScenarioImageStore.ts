import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { scenarioImageFile, type SavedScenarioImage, type ScenarioImageStore } from '../../application/ports/ScenarioImageStore.ts';
import { hexDigest } from '../../application/use-cases/hexDigest.ts';
import { ScenarioImageError } from '../../application/use-cases/images/ScenarioImageError.ts';

/** `hash`: the cache key of the request; `fileHash`: the SHA-256 of the file written, to know it is still ours. */
type ImageRecord = Readonly<{ file: string; hash: string; fileHash: string; provider: string; model: string }>;
type SceneJson = { type?: string; background?: Record<string, unknown> };
type ScriptFile = { lines?: Array<{ id?: string; scene?: SceneJson }> };

const recordFile = (lineId: string) => `scenes/${lineId}.json`;

function recordIn(path: string): Partial<ImageRecord> | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Partial<ImageRecord>;
  } catch {
    return undefined;
  }
}

// Points the scenario's background to the image; false when it already did (or the line has no scenario).
function pointed(line: { id?: string; scene?: SceneJson }): boolean {
  const background = line.scene?.type === 'scenario' ? line.scene.background : undefined;
  const file = scenarioImageFile(line.id ?? '');
  if (!background || background.image === file) return false;
  background.image = file;
  return true;
}

/** Saves `scenes/<id>.png` and `scenes/<id>.json` in the project folder and points script.json to them. */
export class DiskScenarioImageStore implements ScenarioImageStore {
  readonly #folder: string;

  constructor(folder: string) {
    this.#folder = folder;
  }

  // Without the image, the record does not count: the scene is generated again.
  savedHash(lineId: string): string | undefined {
    if (!existsSync(join(this.#folder, scenarioImageFile(lineId)))) return undefined;
    return recordIn(join(this.#folder, recordFile(lineId)))?.hash;
  }

  // A file there with no record of ours, or with other bytes than the ones written, belongs to the person.
  async foreignFile(lineId: string): Promise<boolean> {
    const path = join(this.#folder, scenarioImageFile(lineId));
    if (!existsSync(path)) return false;
    const recorded = recordIn(join(this.#folder, recordFile(lineId)))?.fileHash;
    return recorded !== (await hexDigest('SHA-256', await readFile(path)));
  }

  async save({ lineId, image, hash, madeBy }: SavedScenarioImage): Promise<void> {
    const file = scenarioImageFile(lineId);
    if (await this.foreignFile(lineId)) throw new ScenarioImageError(`${file} já existe e não foi feito pelo giz images: o arquivo não foi sobrescrito`);
    await mkdir(join(this.#folder, 'scenes'), { recursive: true });
    await writeFile(join(this.#folder, file), image.bytes);
    const record: ImageRecord = { file, hash, fileHash: await hexDigest('SHA-256', image.bytes), provider: madeBy.provider, model: madeBy.model };
    await writeFile(join(this.#folder, recordFile(lineId)), `${JSON.stringify(record, null, 2)}\n`);
  }

  // The script is rewritten (2-space JSON) only when a scene did not point to its image yet.
  async link(lineIds: readonly string[]): Promise<void> {
    const path = join(this.#folder, 'script.json');
    const script = JSON.parse(await readFile(path, 'utf8')) as ScriptFile;
    const lines = (script.lines ?? []).filter((line) => lineIds.includes(line.id ?? ''));
    const changed = lines.map(pointed).some(Boolean);
    if (changed) await writeFile(path, `${JSON.stringify(script, null, 2)}\n`);
  }
}
