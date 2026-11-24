import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { Renderer } from '../../application/ports/Renderer.ts';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import { projectFiles } from './projectFiles.ts';
import { withBundle, type RemotionSources } from './stagedBundle.ts';

const COMPOSITION = 'Video';

/**
 * Renders the Video composition with `@remotion/renderer` called directly (no `npx`), as the Electron main process will:
 * bundle, select the composition with the props (its size and length come from them) and render H.264.
 */
export class RemotionRenderer implements Renderer {
  readonly #sources: RemotionSources;
  readonly #folder: string;

  constructor(sources: RemotionSources, folder: string) {
    this.#sources = sources;
    this.#folder = folder;
  }

  async render(props: VideoProps, output: string, onProgress: (fraction: number) => void): Promise<void> {
    await mkdir(dirname(output), { recursive: true });
    await withBundle(this.#sources, projectFiles(props, this.#folder), async (serveUrl) => {
      const browserExecutable = this.#sources.browserExecutable ?? null;
      const composition = await selectComposition({ serveUrl, id: COMPOSITION, inputProps: props, browserExecutable });
      const reportProgress = ({ progress }: { progress: number }) => onProgress(progress);
      await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: output, inputProps: props, onProgress: reportProgress, browserExecutable });
    });
  }
}
