import { launchFolderOf } from './launchFolder.ts';

type Window = Readonly<{ isMinimized(): boolean; restore(): void; focus(): void; isDestroyed(): boolean }>;
/** `relaunch`: grant the folder and open it in the Studio; `open`: a new window (none is left). */
type Steps = Readonly<{ window: () => Window | undefined; open: () => void; relaunch: (folder: string) => void }>;

/**
 * What a second launch of the app does in the first one (the single-instance lock sends its command line here): the
 * folder it names, if any, is opened, and the window comes back to the front, or a new one opens.
 */
export function secondLaunch({ window, open, relaunch }: Steps): (argv: readonly string[], workingDirectory: string) => void {
  return (argv, workingDirectory) => {
    const folder = launchFolderOf(argv, workingDirectory);
    if (folder !== null) relaunch(folder);
    const current = window();
    if (!current || current.isDestroyed()) return open();
    if (current.isMinimized()) current.restore();
    current.focus();
  };
}
