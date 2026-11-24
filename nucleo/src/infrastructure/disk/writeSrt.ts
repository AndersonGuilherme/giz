import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { srtOf } from '../../domain/caption/Srt.ts';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';

/** Saves the `.srt` of the video (creating its folder); the cues and times come from the domain (`srtOf`). */
export async function writeSrt(props: VideoProps, file: string): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, srtOf(props), 'utf8');
}
