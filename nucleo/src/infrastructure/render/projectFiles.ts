import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { SegmentJson, VideoProps } from '../../domain/timeline/VideoProps.ts';
import { ProjectPath } from '../../domain/values/ProjectPath.ts';
import type { StagedFile } from './stagedBundle.ts';

type BackgroundChange = Readonly<{ background?: Readonly<{ image?: string }> }>;

// The image of the segment scene and the ones its beats switch to (a beat may change the background).
function imagesOf(segment: SegmentJson): string[] {
  const scene = segment.scene.type === 'scenario' ? segment.scene.background.image : undefined;
  const beats = segment.beats.map((beat) => (beat.changes as BackgroundChange).background?.image);
  return [scene, ...beats].filter((image): image is string => image !== undefined);
}

// The load already validated the paths; checked again here, since a path leaving the project would be copied from
// outside it. A missing image is left out (the render falls back to the vector background); a folder is an error.
function usable(folder: string, image: string): boolean {
  const path = ProjectPath.of(image);
  const found = statSync(join(folder, path.text()), { throwIfNoEntry: false });
  if (found && !found.isFile()) throw new Error(`${image} não é um arquivo (background.image de um cenário)`);
  return found !== undefined;
}

/**
 * The project files the video asks for, served at the same path relative to the project (as `staticFile` asks for
 * them): the voice of each segment (`voice/<id>.wav`) and each scenario image, once. Every file must stay in `folder`.
 */
export function projectFiles(props: VideoProps, folder: string): StagedFile[] {
  const audios = props.segments.flatMap((segment) => (segment.audio ? [segment.audio] : []));
  const images = [...new Set(props.segments.flatMap(imagesOf))].filter((image) => usable(folder, image));
  return [...audios, ...images].map((path) => ({ from: join(folder, path), at: path, project: folder }));
}
