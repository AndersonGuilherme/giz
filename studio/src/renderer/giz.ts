import type { GizApi } from '../shared/GizApi.ts';

declare global {
  interface Window {
    readonly giz: GizApi;
  }
}

/** The bridge the preload exposes: the only way the window reaches files, keys and renders. */
export const giz = (): GizApi => window.giz;
