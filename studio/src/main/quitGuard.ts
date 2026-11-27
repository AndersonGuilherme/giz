type QuitEvent = Readonly<{ preventDefault: () => void }>;
/** The part of Electron's `app` the guard uses (tests pass a fake). */
export type Quitting = Readonly<{ on(event: 'before-quit', listener: (event: QuitEvent) => void): unknown; quit(): void }>;

/**
 * The app does not quit while a script save is on its way: the first quit waits for `settled` (every save in flight),
 * then quits again; a save that fails does not keep the app open.
 */
export function quitAfterSaves(app: Quitting, settled: () => Promise<void>): void {
  let waited = false;
  app.on('before-quit', (event) => {
    if (waited) return;
    event.preventDefault();
    void settled().catch(() => undefined).then(() => {
      waited = true;
      app.quit();
    });
  });
}
