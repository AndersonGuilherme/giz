/** What the Studio asks of the desktop: show a folder, put text on the clipboard, save a copy of a file. */
export interface DesktopShell {
  openFolder(path: string): Promise<void>;
  copyText(text: string): Promise<void>;
  /** Asks where to save a copy of `from` (suggesting `name`) and copies it there; null when the person closed the dialog. */
  saveCopy(from: string, name: string): Promise<string | null>;
}
