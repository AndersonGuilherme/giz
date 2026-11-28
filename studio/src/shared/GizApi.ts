import type { KeyCheck, KeyProvider, KeysStatus, KeyStorage } from './accounts.ts';
import type { Aspect, RenderedFiles, RenderJobStatus, RenderProgress, Result } from './contract.ts';
import type { FolderSource, Settings, SettingsPatch, TourId } from './settings.ts';
import type { GpuStatus, ModelsStatus, SetupTask, TaskProgress } from './setup.ts';
import type { GeneratedScript, IdeaFields, Portraits, Presets, ProjectListing, ScriptEstimate, ScriptProgress } from './projects.ts';
import type { EditorReport, SceneProblem, ScriptDocument, ScriptJson, Vocabulary } from './script.ts';

import type { MediaApi } from './mediaApi.ts';
import type { VideoDocument } from './video.ts';

type Reply<T> = Promise<Result<T>>;

/** What the preload exposes as `window.giz`: every call goes to the main process, which validates it. */
export type GizApi = MediaApi & Readonly<{
  projects: Readonly<{
    pick(): Reply<string | null>;
    launched(): Reply<string | null>;
    /** Calls `listener` when a later launch of the app names a project (ask `launched` again); returns the stop function. */
    onLaunched(listener: () => void): () => void;
    list(): Reply<readonly ProjectListing[]>;
    create(idea: IdeaFields): Reply<string>;
    duplicate(folder: string): Reply<string>;
    trash(folder: string): Reply<true>;
    forget(folder: string): Reply<true>;
  }>;
  ideas: Readonly<{
    presets(): Reply<Presets>;
    portraits(): Reply<Portraits | null>;
  }>;
  script: Readonly<{
    estimate(idea: IdeaFields): Reply<ScriptEstimate>;
    generate(idea: IdeaFields): Reply<GeneratedScript>;
    cancel(): Reply<boolean>;
    /** Calls `listener` before each call of the running generation; returns the function that stops listening. */
    onProgress(listener: (progress: ScriptProgress) => void): () => void;
    read(folder: string): Reply<ScriptDocument>;
    save(folder: string, script: ScriptJson): Reply<EditorReport>;
    check(folder: string): Reply<EditorReport>;
    vocabulary(): Reply<Vocabulary>;
    checkScene(scene: unknown): Reply<readonly SceneProblem[]>;
  }>;
  video: Readonly<{
    render(folder: string, aspect: Aspect): Reply<RenderedFiles>;
    /** Cancels the render of that folder (false when that folder is not rendering). */
    cancel(folder: string): Reply<boolean>;
    /** The render running now (another screen or project may have started it), or null. */
    status(): Reply<RenderJobStatus | null>;
    /** Calls `listener` on each progress step of the running render; returns the function that stops listening. */
    onProgress(listener: (progress: RenderProgress) => void): () => void;
    /** "Montar" and everything the Video stage shows, in `aspect` (the project's own when absent). */
    preview(folder: string, aspect?: Aspect): Reply<VideoDocument>;
    openFolder(folder: string): Reply<true>;
    copyCaptions(folder: string, aspect: Aspect): Reply<true>;
    exportCaptions(folder: string, aspect: Aspect): Reply<string | null>;
  }>;
  /** The key goes in and never comes back out: there is no call that reads it. */
  keys: Readonly<{
    set(provider: KeyProvider, key: string): Reply<KeyStorage>;
    remove(provider: KeyProvider): Reply<boolean>;
    status(): Reply<KeysStatus>;
    test(provider: KeyProvider): Reply<KeyCheck>;
  }>;
  settings: Readonly<{
    get(): Reply<Settings>;
    update(patch: SettingsPatch): Reply<Settings>;
    projectsFolder(source: FolderSource): Reply<Settings>;
    modelsFolder(source: FolderSource): Reply<Settings>;
    finish(): Reply<Settings>;
    tourSeen(tour: TourId): Reply<Settings>;
    resetTours(): Reply<Settings>;
  }>;
  setup: Readonly<{
    gpu(): Reply<GpuStatus>;
    models(): Reply<ModelsStatus>;
    run(task: SetupTask): Reply<true>;
    stop(task: SetupTask): Reply<boolean>;
    /** Calls `listener` on each progress step of any running setup task; returns the function that stops listening. */
    onProgress(listener: (progress: TaskProgress) => void): () => void;
  }>;
}>;
