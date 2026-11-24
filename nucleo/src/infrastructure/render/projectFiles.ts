import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { SegmentJson, VideoProps } from '../../domain/timeline/VideoProps.ts';
import type { StagedFile } from './stagedBundle.ts';

type BackgroundChange = Readonly<{ background?: Readonly<{ image?: string }> }>;

// The image of the segment scene and the ones its beats switch to (a beat may change the background).
function imagesOf(segment: SegmentJson): string[] {
  const scene = segment.scene.type === 'scenario' ? segment.scene.background.image : undefined;
  const beats = segment.beats.map((beat) => (beat.changes as BackgroundChange).background?.image);
  return [scene, ...beats].filter((image): image is string => image !== undefined);
}

const staged = (folder: string) => (path: string): StagedFile => ({ from: join(folder, path), at: path });

/**
 * The project files the video asks for, served at the same path relative to the project (as `staticFile` asks for
 * them): the voice of each segment (`voice/<id>.wav`) and each scenario image, once. A missing image is left out, so
 * the render falls back to the vector background (the load already warned about it).
 */
export function projectFiles(props: VideoProps, folder: string): StagedFile[] {
  const audios = props.segments.flatMap((segment) => (segment.audio ? [segment.audio] : []));
  const images = [...new Set(props.segments.flatMap(imagesOf))].filter((image) => existsSync(join(folder, image)));
  return [...audios, ...images].map(staged(folder));
}
