import { copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { app, clipboard, dialog, shell, type BrowserWindow } from 'electron';
import type { DesktopShell } from '../ports/DesktopShell.ts';
import { translate } from '../text.ts';

/** The desktop through Electron: the file manager, the clipboard and the save dialog (over the Studio window). */
export class ElectronShell implements DesktopShell {
  readonly #window: () => BrowserWindow | undefined;

  constructor(window: () => BrowserWindow | undefined) {
    this.#window = window;
  }

  async openFolder(path: string): Promise<void> {
    const problem = await shell.openPath(path);
    if (problem) throw new Error(problem);
  }

  async copyText(text: string): Promise<void> {
    clipboard.writeText(text);
  }

  async saveCopy(from: string, name: string): Promise<string | null> {
    const options = { title: translate('video.exportTitle'), defaultPath: join(app.getPath('documents'), name), filters: [{ name: 'SRT', extensions: ['srt'] }] };
    const window = this.#window();
    const answer = window ? await dialog.showSaveDialog(window, options) : await dialog.showSaveDialog(options);
    if (answer.canceled || !answer.filePath) return null;
    await copyFile(from, answer.filePath);
    return answer.filePath;
  }
}
