// The contract between the main process and the window: channel names and the data each one carries.
// Plain types and constants only (no zod, no electron): the preload and the renderer import it too.

export const ASPECTS = ['9:16', '16:9'] as const;
export type Aspect = (typeof ASPECTS)[number];

/** The AI and voice services whose keys the Studio keeps (encrypted with Electron safeStorage). */
export const KEY_PROVIDERS = ['anthropic', 'openai', 'google', 'fal', 'elevenlabs', 'fish'] as const;
export type KeyProvider = (typeof KEY_PROVIDERS)[number];

/** `details`: one readable line per problem (for example, each invalid field of a project). */
export type FailureCode = 'invalid-request' | 'invalid-project' | 'busy' | 'cancelled' | 'unavailable' | 'failed';
export type Failure = Readonly<{ code: FailureCode; message: string; details: readonly string[] }>;
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

/** Every channel the window may invoke: what it sends and what it gets back (always wrapped in a `Result`). */
export type Channels = Readonly<{
  'projects.pick': Channel<Nothing, string | null>;
  /** The folder given on the command line (`--project=<folder>`), or null. */
  'projects.launched': Channel<Nothing, string | null>;
  'projects.open': Channel<FolderRequest, ProjectSummary>;
  'projects.check': Channel<FolderRequest, CheckReport>;
  'video.render': Channel<FolderRequest & Readonly<{ aspect: Aspect }>, RenderedFiles>;
  'video.cancel': Channel<Nothing, boolean>;
  'keys.set': Channel<ProviderRequest & Readonly<{ key: string }>, true>;
  'keys.has': Channel<ProviderRequest, boolean>;
  'keys.remove': Channel<ProviderRequest, boolean>;
}>;

export type ChannelName = keyof Channels;
export type RequestOf<Name extends ChannelName> = Channels[Name]['request'];
export type ResponseOf<Name extends ChannelName> = Channels[Name]['response'];

/** The one event the main process pushes to the window: how far the running render is. */
export const RENDER_PROGRESS_EVENT = 'video.progress';
