import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { renderStill, selectComposition } from '@remotion/renderer';
import { withBundle, type RemotionSources } from './stagedBundle.ts';

const COMPOSITION = 'CastPortraits';

/** A character to draw: its rig and parameters as in its cast file, and the expression it wears. */
export type PortraitRequest = Readonly<{ id: string; rig: string; parameters: Readonly<Record<string, unknown>>; expression: string }>;
/** Where each portrait is in the picture: the side of a square and how many squares per row. */
export type PortraitGrid = Readonly<{ cell: number; columns: number }>;

/** The square portraits of many characters in one PNG (one bundle, one still), rendered with `@remotion/renderer`. */
export class RemotionPortraits {
  readonly #sources: RemotionSources;

  constructor(sources: RemotionSources) {
    this.#sources = sources;
  }

  async render(cards: readonly PortraitRequest[], grid: PortraitGrid, output: string): Promise<void> {
    await mkdir(dirname(output), { recursive: true });
    const inputProps = { cards, ...grid };
    await withBundle(this.#sources, [], async (serveUrl) => {
      const browserExecutable = this.#sources.browserExecutable ?? null;
      const composition = await selectComposition({ serveUrl, id: COMPOSITION, inputProps, browserExecutable });
      await renderStill({ composition, serveUrl, output, inputProps, browserExecutable });
    });
  }
}
