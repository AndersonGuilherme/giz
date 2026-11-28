import type { GizzyApi } from '../shared/GizzyApi.ts';

declare global {
  interface Window {
    readonly gizzy: GizzyApi;
  }
}

/** The bridge the preload exposes: the only way the window reaches files, keys and renders. */
export const gizzy = (): GizzyApi => window.gizzy;
