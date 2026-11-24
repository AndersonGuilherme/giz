import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { renderStill, selectComposition } from '@remotion/renderer';
import { withBundle, type RemotionSources } from './stagedBundle.ts';

const COMPOSITION = 'CharacterSheet';
const SERVED_CHARACTER = 'character.json';

/** The character sheet (every pose, expression and viseme of a rig) as a PNG, rendered with `@remotion/renderer`. */
export class RemotionSheet {
  readonly #sources: RemotionSources;

  constructor(sources: RemotionSources) {
    this.#sources = sources;
  }

  /** `characterFile`: an optional cast JSON whose parameters (and rig) the sheet draws. */
  async render(rig: string, characterFile: string | undefined, output: string): Promise<void> {
    await mkdir(dirname(output), { recursive: true });
    const files = characterFile ? [{ from: characterFile, at: SERVED_CHARACTER }] : [];
    const inputProps = characterFile ? { rig, character: SERVED_CHARACTER } : { rig };
    await withBundle(this.#sources, files, async (serveUrl) => {
      const browserExecutable = this.#sources.browserExecutable ?? null;
      const composition = await selectComposition({ serveUrl, id: COMPOSITION, inputProps, browserExecutable });
      await renderStill({ composition, serveUrl, output, inputProps, browserExecutable });
    });
  }
}
