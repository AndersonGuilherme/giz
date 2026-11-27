import type { Aspect, CheckReport, KeyProvider, ProjectSummary, RenderedFiles, RenderProgress, Result } from './contract.ts';

type Reply<T> = Promise<Result<T>>;

/** What the preload exposes as `window.giz`: every call goes to the main process, which validates it. */
export type GizApi = Readonly<{
  projects: Readonly<{
    pick(): Reply<string | null>;
    launched(): Reply<string | null>;
    open(folder: string): Reply<ProjectSummary>;
    check(folder: string): Reply<CheckReport>;
  }>;
  video: Readonly<{
    render(folder: string, aspect: Aspect): Reply<RenderedFiles>;
    cancel(): Reply<boolean>;
    /** Calls `listener` on each progress step of the running render; returns the function that stops listening. */
    onProgress(listener: (progress: RenderProgress) => void): () => void;
  }>;
  /** The key goes in and never comes back out: there is no call that reads it. */
  keys: Readonly<{
    set(provider: KeyProvider, key: string): Reply<true>;
    has(provider: KeyProvider): Reply<boolean>;
    remove(provider: KeyProvider): Reply<boolean>;
  }>;
}>;
