import type { VideoFacts } from '../../domain/stages/ProjectStages.ts';

/** What a project folder has, beyond the project itself, for the stages (read only). */
export interface ProjectStateReader {
  /** Whether `idea.json` exists. */
  hasIdea(folder: string): Promise<boolean>;
  /** Whether `script.json` exists (it may still not load). */
  hasScript(folder: string): Promise<boolean>;
  /** Whether `output/video.mp4` exists and whether a project file changed after it was rendered. */
  video(folder: string): Promise<VideoFacts>;
}
