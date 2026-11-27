// The contract between the main process and the window: channel names and the data each one carries.
// Plain types and constants only (no zod, no electron): the preload and the renderer import it too.
import type { KeyCheck, KeyProvider, KeysStatus, KeyStorage } from './accounts.ts';
import type { FolderSource, Settings, SettingsPatch } from './settings.ts';
import type { GpuStatus, ModelsStatus, SetupTask } from './setup.ts';
import type { GeneratedScript, IdeaFields, Portraits, Presets, ProjectListing, ScriptEstimate, StageBrief } from './projects.ts';
import type { EditorReport, SceneProblem, ScriptDocument, ScriptJson, Vocabulary } from './script.ts';

export { KEY_PROVIDERS, type KeyProvider } from './accounts.ts';

export const ASPECTS = ['9:16', '16:9'] as const;
export type Aspect = (typeof ASPECTS)[number];


/**
 * `details`: one readable line per problem (for example, each invalid field of a project); `path`: a file or folder
 * the failure left for the person (the draft of a script generation that never became valid).
 */
export type FailureCode = 'invalid-request' | 'invalid-project' | 'busy' | 'cancelled' | 'unavailable' | 'failed';
export type Failure = Readonly<{ code: FailureCode; message: string; details: readonly string[]; path?: string }>;
export type Result<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; failure: Failure }>;

export type ProjectSummary = Readonly<{
  folder: string;
  title: string;
  format: string;
  language: string;
  aspect: Aspect;
  cast: readonly string[];
  chapters: number;
  lines: number;
  warnings: readonly string[];
}>;

/** A problem of the check: `line` is the line id (empty for the whole project). */
export type CheckProblem = Readonly<{ line: string; message: string }>;
export type CheckReport = Readonly<{ errors: readonly CheckProblem[]; warnings: readonly CheckProblem[] }>;

export type RenderedFiles = Readonly<{ video: string; captions: string }>;
export type RenderProgress = Readonly<{ fraction: number }>;

type Channel<Request, Response> = Readonly<{ request: Request; response: Response }>;
type Nothing = Readonly<Record<string, never>>;
type FolderRequest = Readonly<{ folder: string }>;
type ProviderRequest = Readonly<{ provider: KeyProvider }>;
type SourceRequest = Readonly<{ source: FolderSource }>;
type TaskRequest = Readonly<{ task: SetupTask }>;
type IdeaRequest = Readonly<{ idea: IdeaFields }>;

/** Every channel the window may invoke: what it sends and what it gets back (always wrapped in a `Result`). */
export type Channels = Readonly<{
  'projects.pick': Channel<Nothing, string | null>;
  /** The folder given on the command line (`--project=<folder>`), or null. */
  'projects.launched': Channel<Nothing, string | null>;
  'projects.open': Channel<FolderRequest, ProjectSummary>;
  'projects.check': Channel<FolderRequest, CheckReport>;
  'video.render': Channel<FolderRequest & Readonly<{ aspect: Aspect }>, RenderedFiles>;
  'video.cancel': Channel<Nothing, boolean>;
  /** Where the key went: the system keychain, or the 600-mode file when there is none. */
  'keys.set': Channel<ProviderRequest & Readonly<{ key: string }>, KeyStorage>;
  'keys.has': Channel<ProviderRequest, boolean>;
  'keys.remove': Channel<ProviderRequest, boolean>;
  'keys.status': Channel<Nothing, KeysStatus>;
  /** One tiny real call with the saved key (a single attempt); services without a check answer `unavailable`. */
  'keys.test': Channel<ProviderRequest, KeyCheck>;
  'settings.get': Channel<Nothing, Settings>;
  'settings.update': Channel<SettingsPatch, Settings>;
  'settings.projectsFolder': Channel<SourceRequest, Settings>;
  'settings.modelsFolder': Channel<SourceRequest, Settings>;
  /** Ends the first-run wizard: from then on the app opens on the Studio. */
  'settings.finish': Channel<Nothing, Settings>;
  'gpu.status': Channel<Nothing, GpuStatus>;
  'models.status': Channel<Nothing, ModelsStatus>;
  /** Runs a setup task to the end (progress on `setup.progress`); a stopped task answers `cancelled`. */
  'setup.run': Channel<TaskRequest, true>;
  'setup.stop': Channel<TaskRequest, boolean>;
  /** The projects of the projects folder plus the folders opened from elsewhere, newest first. */
  'projects.list': Channel<Nothing, readonly ProjectListing[]>;
  /** A new project to write by hand, in the projects folder: answers its folder. */
  'projects.create': Channel<IdeaRequest, string>;
  /** A copy next to the project (without its rendered output): answers the copy's folder. */
  'projects.duplicate': Channel<FolderRequest, string>;
  /** Moves a project of the projects folder to the system trash (never a folder opened from elsewhere). */
  'projects.trash': Channel<FolderRequest, true>;
  /** "Remover da lista": a folder opened from elsewhere leaves the list; nothing is deleted. */
  'projects.forget': Channel<FolderRequest, true>;
  'projects.stages': Channel<FolderRequest, readonly StageBrief[]>;
  'ideas.presets': Channel<Nothing, Presets>;
  /** The ready characters' portraits (drawn once, then kept); null when they cannot be drawn. */
  'ideas.portraits': Channel<Nothing, Portraits | null>;
  'script.estimate': Channel<IdeaRequest, ScriptEstimate>;
  /** Writes a new project with the text AI chosen in Settings (progress on `script.progress`); cancellable. */
  'script.generate': Channel<IdeaRequest, GeneratedScript>;
  'script.cancel': Channel<Nothing, boolean>;
  'script.read': Channel<FolderRequest, ScriptDocument>;
  /** Writes script.json (atomically) and answers the check and the stages. */
  'script.save': Channel<FolderRequest & Readonly<{ script: ScriptJson }>, EditorReport>;
  'script.check': Channel<FolderRequest, EditorReport>;
  'script.vocabulary': Channel<Nothing, Vocabulary>;
  'script.checkScene': Channel<Readonly<{ scene: unknown }>, readonly SceneProblem[]>;
}>;

export type ChannelName = keyof Channels;
export type RequestOf<Name extends ChannelName> = Channels[Name]['request'];
export type ResponseOf<Name extends ChannelName> = Channels[Name]['response'];

/** The one event the main process pushes to the window: how far the running render is. */
export const RENDER_PROGRESS_EVENT = 'video.progress';
