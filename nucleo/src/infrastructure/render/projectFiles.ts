import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { SegmentJson, VideoProps } from '../../domain/timeline/VideoProps.ts';
import { ProjectPath } from '../../domain/values/ProjectPath.ts';
import type { StagedFile } from './stagedBundle.ts';

type BackgroundChange = Readonly<{ background?: Readonly<{ image?: string }> }>;

/** An image the video shows and where it is declared (`fala 1, beats[0].background.image`), for the errors. */
type Image = Readonly<{ path: string; field: string }>;

// The image of the segment scene and the ones its beats switch to (a beat may change the background).
function imagesOf(segment: SegmentJson): Image[] {
  const scene = { path: segment.scene.type === 'scenario' ? segment.scene.background.image : undefined, field: 'scene' };
  const beats = segment.beats.map((beat, order) => ({ path: (beat.changes as BackgroundChange).background?.image, field: `beats[${order}]` }));
  const fieldOf = (where: string) => `fala ${segment.lineId}, ${where}.background.image`;
  return [scene, ...beats].flatMap(({ path, field }) => (path ? [{ path, field: fieldOf(field) }] : []));
}

const firstOfEachPath = (image: Image, index: number, all: readonly Image[]) => all.findIndex((other) => other.path === image.path) === index;

// The load already validated the paths; checked again here, since a path leaving the project would be copied from
// outside it. A missing image is left out (the render falls back to the vector background); a folder is an error.
function usable(folder: string, image: Image): boolean {
  const path = ProjectPath.of(image.path);
  const found = statSync(join(folder, path.text()), { throwIfNoEntry: false });
  if (found && !found.isFile()) throw new Error(`${image.path} não é um arquivo (${image.field})`);
  return found !== undefined;
}

/**
 * The project files the video asks for, served at the same path relative to the project (as `staticFile` asks for
 * them): the voice of each segment (`voice/<id>.wav`) and each scenario image, once. Every file must stay in `folder`.
 */
export function projectFiles(props: VideoProps, folder: string): StagedFile[] {
  const audios = props.segments.flatMap((segment) => (segment.audio ? [segment.audio] : []));
  const images = props.segments.flatMap(imagesOf).filter(firstOfEachPath).filter((image) => usable(folder, image));
  return [...audios, ...images.map((image) => image.path)].map((path) => ({ from: join(folder, path), at: path, project: folder }));
}
