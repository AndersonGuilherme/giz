import type { KeyCheck, KeyProvider, KeysStatus, KeyStorage } from './accounts.ts';
import type { Aspect, CheckReport, ProjectSummary, RenderedFiles, RenderProgress, Result } from './contract.ts';
import type { FolderSource, Settings, SettingsPatch } from './settings.ts';
import type { GpuStatus, ModelsStatus, SetupTask, TaskProgress } from './setup.ts';
import type { GeneratedScript, IdeaFields, Portraits, Presets, ProjectListing, ScriptEstimate, ScriptProgress, StageBrief } from './projects.ts';
import type { EditorReport, SceneProblem, ScriptDocument, ScriptJson, Vocabulary } from './script.ts';

import type { MediaApi } from './mediaApi.ts';

type Reply<T> = Promise<Result<T>>;

/** What the preload exposes as `window.giz`: every call goes to the main process, which validates it. */
export type GizApi = MediaApi & Readonly<{
  projects: Readonly<{
    pick(): Reply<string | null>;
    launched(): Reply<string | null>;
    open(folder: string): Reply<ProjectSummary>;
    check(folder: string): Reply<CheckReport>;
    list(): Reply<readonly ProjectListing[]>;
    create(idea: IdeaFields): Reply<string>;
    duplicate(folder: string): Reply<string>;
    trash(folder: string): Reply<true>;
    forget(folder: string): Reply<true>;
    stages(folder: string): Reply<readonly StageBrief[]>;
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
    cancel(): Reply<boolean>;
    /** Calls `listener` on each progress step of the running render; returns the function that stops listening. */
    onProgress(listener: (progress: RenderProgress) => void): () => void;
  }>;
  /** The key goes in and never comes back out: there is no call that reads it. */
  keys: Readonly<{
    set(provider: KeyProvider, key: string): Reply<KeyStorage>;
    has(provider: KeyProvider): Reply<boolean>;
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
