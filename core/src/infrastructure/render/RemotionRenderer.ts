import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { makeCancelSignal, renderMedia, selectComposition } from '@remotion/renderer';
import type { Renderer } from '../../application/ports/Renderer.ts';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import { projectFiles } from './projectFiles.ts';
import { withBundle, type RemotionSources } from './stagedBundle.ts';

const COMPOSITION = 'Video';

/** The Remotion steps of a render; tests replace them (the default is the real bundler and renderer). */
export type RemotionCalls = Readonly<{ withBundle: typeof withBundle; selectComposition: typeof selectComposition; renderMedia: typeof renderMedia }>;
const REMOTION_CALLS: RemotionCalls = { withBundle, selectComposition, renderMedia };

/**
 * `signal`: aborting it cancels the render (the Studio's cancel button); the render then rejects. `frames`: only the
 * first frames are rendered (a short real render, as the Studio's rehearsal mode makes).
 */
export type RenderOptions = Readonly<{ signal?: AbortSignal; calls?: RemotionCalls; frames?: number }>;

// The first `frames` frames of the composition (at least one, never past its end); none: the whole video.
const frameRangeOf = (frames: number | undefined, duration: number) => (frames === undefined ? {} : { frameRange: [0, Math.max(1, Math.min(frames, duration)) - 1] as [number, number] });

/** A hidden file next to `output`, unique per render, for the video being made (Remotion asks for the .mp4 extension). */
export function partFileOf(output: string): string {
  const extension = extname(output);
  return join(dirname(output), `.${basename(output, extension)}.${randomUUID()}.part${extension}`);
}

// The video appears only whole: `write` fills a part file, renamed over `output` once done and removed if it fails
// (a cancel too), so a failed render never leaves half a video nor replaces the last good one.
async function atomically(output: string, write: (part: string) => Promise<unknown>): Promise<void> {
  const part = partFileOf(output);
  try {
    await write(part);
    await rename(part, output);
  } catch (error) {
    await rm(part, { force: true });
    throw error;
  }
}

/** Remotion's own cancel signal, cancelled when `signal` aborts, also when it was already aborted before this call. */
export function remotionCancelSignal(signal: AbortSignal | undefined) {
  const { cancelSignal, cancel } = makeCancelSignal();
  if (signal?.aborted) cancel();
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
  readonly #calls: RemotionCalls;
  readonly #frames: number | undefined;

  constructor(sources: RemotionSources, folder: string, options: RenderOptions = {}) {
    this.#sources = sources;
    this.#folder = folder;
    this.#signal = options.signal;
    this.#calls = options.calls ?? REMOTION_CALLS;
    this.#frames = options.frames;
  }

  async render(props: VideoProps, output: string, onProgress: (fraction: number) => void): Promise<void> {
    this.#signal?.throwIfAborted();
    await mkdir(dirname(output), { recursive: true });
    const { withBundle: bundled, selectComposition: select, renderMedia: renderWith } = this.#calls;
    await bundled(this.#sources, projectFiles(props, this.#folder), async (serveUrl) => {
      this.#signal?.throwIfAborted();
      const browserExecutable = this.#sources.browserExecutable ?? null;
      const composition = await select({ serveUrl, id: COMPOSITION, inputProps: props, browserExecutable });
      this.#signal?.throwIfAborted();
      const reportProgress = ({ progress }: { progress: number }) => onProgress(progress);
      const cancelSignal = remotionCancelSignal(this.#signal);
      const range = frameRangeOf(this.#frames, composition.durationInFrames);
      await atomically(output, (part) => renderWith({ composition, serveUrl, codec: 'h264', outputLocation: part, inputProps: props, onProgress: reportProgress, browserExecutable, cancelSignal, ...range }));
    });
  }
}
