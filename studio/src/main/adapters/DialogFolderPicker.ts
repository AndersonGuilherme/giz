import { dialog, type BrowserWindow, type OpenDialogOptions } from 'electron';
import type { FolderPicker } from '../ports/FolderPicker.ts';
import { translate } from '../text.ts';

/** The system "choose a folder" dialog, attached to the current Studio window when there is one. */
export class DialogFolderPicker implements FolderPicker {
  readonly #window: () => BrowserWindow | undefined;

  constructor(window: () => BrowserWindow | undefined) {
    this.#window = window;
  }

  async pickFolder(): Promise<string | null> {
    const options: OpenDialogOptions = { title: translate('project.pickTitle'), properties: ['openDirectory'] };
    const window = this.#window();
    const choice = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);
    return choice.canceled ? null : (choice.filePaths[0] ?? null);
  }
}
