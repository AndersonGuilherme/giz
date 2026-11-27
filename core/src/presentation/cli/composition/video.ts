// Part of the composition point (see ../composition.ts): what the Studio's Video stage needs to preview and render a
// project in either aspect.
import { join } from 'node:path';
import type { Project } from '../../../domain/project/Project.ts';
import type { VideoProps } from '../../../domain/timeline/VideoProps.ts';
import { AspectRatio, type AspectRatioText } from '../../../domain/values/AspectRatio.ts';
import { soundFile } from '../../../domain/video/SoundTrack.ts';
import { projectFiles } from '../../../infrastructure/render/projectFiles.ts';
import { buildTimeline, projectRepository, publicFolder } from '../composition.ts';

/** A file the video asks for (`at`, its path as the video names it) and where it is on disk (`from`). */
export type PreviewFile = Readonly<{ at: string; from: string }>;
export type VideoPreviewParts = Readonly<{ props: VideoProps; files: readonly PreviewFile[] }>;

/** The project of the folder, seen in `aspect` when given (its own aspect otherwise): the check and the render use it. */
export async function projectInAspect(folder: string, aspect?: AspectRatioText): Promise<Project> {
  const project = await projectRepository().load(folder);
  return aspect === undefined ? project : project.inAspect(AspectRatio.of(aspect));
}

// The sound effects come from the package public folder, as the render copies them.
function soundsOf(props: VideoProps): PreviewFile[] {
  const files = [...new Set(props.soundEffects.map(({ sound }) => soundFile(sound)))];
  return files.map((at) => ({ at, from: join(publicFolder(), at) }));
}

/** "Montar": the video props (core's BuildTimeline, every voice already made) and every file they ask for. */
export async function videoPreview(folder: string, project: Project): Promise<VideoPreviewParts> {
  const props = await buildTimeline(folder).run(project);
  const files = projectFiles(props, folder).map(({ at, from }) => ({ at, from }));
  return { props, files: [...files, ...soundsOf(props)] };
}
