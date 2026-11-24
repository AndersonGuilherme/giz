import type { Project } from '../../domain/project/Project.ts';
import type { ProjectRepository } from '../ports/ProjectRepository.ts';
import type { CheckReport, Problem } from './CheckProject.ts';
import type { Progress, VoiceReport } from './GenerateVoices.ts';
import type { RenderVideo, VideoFiles } from './RenderVideo.ts';

type Checker = Readonly<{ run(project: Project): CheckReport }>;
type Voices = Readonly<{ run(project: Project, onProgress?: (progress: Progress) => void): Promise<VoiceReport> }>;

/** `voices` makes the voice generation of the project (its provider is chosen by the project). */
export type ProduceDependencies = Readonly<{
  repository: ProjectRepository;
  check: Checker;
  voices: (project: Project) => Voices;
  render: Pick<RenderVideo, 'run'>;
}>;

/** What the caller follows: the check warnings, each voice and the render progress. */
export type ProduceObserver = Readonly<{ onWarning?: (problem: Problem) => void; onVoice?: (progress: Progress) => void; onRender?: (fraction: number) => void }>;

const problemText = ({ line, message }: Problem): string => (line ? `fala ${line}: ${message}` : message);

/** The check found errors: nothing is generated nor rendered. */
export class CheckFailed extends Error {
  readonly problems: readonly Problem[];

  constructor(problems: readonly Problem[]) {
    super(`o check encontrou ${problems.length} erro(s); corrija antes de produzir o vídeo:\n${problems.map(problemText).join('\n')}`);
    this.name = 'CheckFailed';
    this.problems = problems;
  }
}

/** From a project folder to the video: load, check (stops on an error), generate the voices, build and render. */
export class ProduceVideo {
  readonly #dependencies: ProduceDependencies;

  constructor(dependencies: ProduceDependencies) {
    this.#dependencies = dependencies;
  }

  // The voices always run before the build: a line whose text changed gets its new voice (the build does not detect it).
  async run(folder: string, observer: ProduceObserver = {}): Promise<VideoFiles> {
    const { repository, voices, render } = this.#dependencies;
    const project = await repository.load(folder);
    this.#check(project, observer);
    await voices(project).run(project, observer.onVoice);
    return render.run(folder, project, observer.onRender);
  }

  #check(project: Project, observer: ProduceObserver): void {
    const { errors, warnings } = this.#dependencies.check.run(project);
    warnings.forEach((warning) => observer.onWarning?.(warning));
    if (errors.length > 0) throw new CheckFailed(errors);
  }
}
