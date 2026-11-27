import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { makeCancelSignal, renderMedia, selectComposition } from '@remotion/renderer';
import type { Renderer } from '../../application/ports/Renderer.ts';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import { projectFiles } from './projectFiles.ts';
import { withBundle, type RemotionSources } from './stagedBundle.ts';

const COMPOSITION = 'Video';

/** `signal`: aborting it cancels the render (the Studio's cancel button); the render then rejects. */
export type RenderOptions = Readonly<{ signal?: AbortSignal }>;

// Remotion's own cancel signal, cancelled when `signal` aborts (an already aborted signal never gets this far).
function cancelSignalOf(signal: AbortSignal | undefined) {
  const { cancelSignal, cancel } = makeCancelSignal();
  signal?.addEventListener('abort', cancel, { once: true });
  return cancelSignal;
}

/**
 * Renders the Video composition with `@remotion/renderer` called directly (no `npx`), as the Electron main process will:
 * bundle, select the composition with the props (its size and length come from them) and render H.264.
 */
export class RemotionRenderer implements Renderer {
  readonly #sources: RemotionSources;
  readonly #folder: string;
  readonly #signal: AbortSignal | undefined;

  constructor(sources: RemotionSources, folder: string, options: RenderOptions = {}) {
    this.#sources = sources;
    this.#folder = folder;
    this.#signal = options.signal;
  }

  async render(props: VideoProps, output: string, onProgress: (fraction: number) => void): Promise<void> {
    this.#signal?.throwIfAborted();
    await mkdir(dirname(output), { recursive: true });
    await withBundle(this.#sources, projectFiles(props, this.#folder), async (serveUrl) => {
      this.#signal?.throwIfAborted();
      const browserExecutable = this.#sources.browserExecutable ?? null;
      const composition = await selectComposition({ serveUrl, id: COMPOSITION, inputProps: props, browserExecutable });
      const reportProgress = ({ progress }: { progress: number }) => onProgress(progress);
      const cancelSignal = cancelSignalOf(this.#signal);
      await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: output, inputProps: props, onProgress: reportProgress, browserExecutable, cancelSignal });
    });
  }
}
