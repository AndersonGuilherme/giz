import type { CaptionWriter } from '../../application/ports/CaptionWriter.ts';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import { writeSrt } from './writeSrt.ts';

/** The captions of the video as `.srt` on disk. */
export class SrtCaptionWriter implements CaptionWriter {
  write(props: VideoProps, file: string): Promise<void> {
    return writeSrt(props, file);
  }
}
