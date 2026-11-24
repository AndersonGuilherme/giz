import type { Format } from '../../domain/project/Project.ts';
import type { WordInFrames } from '../../domain/timeline/VideoProps.ts';
import type { AspectRatio } from '../../domain/values/AspectRatio.ts';
import type { Frame } from '../../domain/values/Time.ts';

/** What a caption needs: the segment words (relative frames), the line length, the frame inside the line and where it goes. */
export type CaptionProps = Readonly<{ words: readonly WordInFrames[] | undefined; lineDuration: number; aspect: AspectRatio; format: Format; frame: Frame }>;
