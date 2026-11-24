import type { WordInFrames } from '../../domain/timeline/VideoProps.ts';
import type { AspectRatio } from '../../domain/values/AspectRatio.ts';
import type { Frame } from '../../domain/values/Time.ts';

/** What a caption needs from a segment: its words (relative frames), the line length and the frame inside the line. */
export type CaptionProps = Readonly<{ words: readonly WordInFrames[] | undefined; lineDuration: number; aspect: AspectRatio; frame: Frame }>;
