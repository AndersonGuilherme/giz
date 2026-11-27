import type { GeneratedImage, ImageModel } from './ImageProvider.ts';

/** Path of a scene's generated image, relative to the project folder. */
export const scenarioImageFile = (lineId: string): string => `scenes/${lineId}.png`;

/** What is saved for a generated image: the image, and in `scenes/<id>.json` its hash and who made it. */
export type SavedScenarioImage = Readonly<{ lineId: string; image: GeneratedImage; hash: string; madeBy: ImageModel }>;

/** Where the generated scenario images of a project live, and the script that points to them. */
export interface ScenarioImageStore {
  /** The hash of the image already saved for the line, or `undefined` when it has none (or its file is gone). */
  savedHash(lineId: string): string | undefined;
  /** Whether `scenes/<id>.png` exists but was not made by giz images (no record, or the file changed since): never overwritten. */
  foreignFile(lineId: string): Promise<boolean>;
  /** Writes the image; refuses (ScenarioImageError) to overwrite a foreign file. */
  save(saved: SavedScenarioImage): Promise<void>;
  /** Points the `background.image` of these lines' scenes to their generated image (the script changes only if needed). */
  link(lineIds: readonly string[]): Promise<void>;
}
