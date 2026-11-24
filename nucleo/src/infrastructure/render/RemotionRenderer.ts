import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { Renderer } from '../../application/ports/Renderer.ts';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import { withBundle, type RemotionSources, type StagedFile } from './stagedBundle.ts';

const COMPOSITION = 'Video';

// The audio of each segment (`voice/<id>.wav`, relative to the project) is served at the same path.
function voiceFiles(props: VideoProps, folder: string): StagedFile[] {
  const audios = props.segments.flatMap((segment) => (segment.audio ? [segment.audio] : []));
  return audios.map((audio) => ({ from: join(folder, audio), at: audio }));
}

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
    await withBundle(this.#sources, voiceFiles(props, this.#folder), async (serveUrl) => {
      const composition = await selectComposition({ serveUrl, id: COMPOSITION, inputProps: props });
      const reportProgress = ({ progress }: { progress: number }) => onProgress(progress);
      await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: output, inputProps: props, onProgress: reportProgress });
    });
  }
}
