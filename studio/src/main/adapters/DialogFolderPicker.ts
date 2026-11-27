import { dialog, type BrowserWindow } from 'electron';
import type { FolderPicker } from '../ports/FolderPicker.ts';
import { translate } from '../text.ts';

/** The system "choose a folder" dialog, attached to the Studio window. */
export class DialogFolderPicker implements FolderPicker {
  readonly #window: BrowserWindow;

  constructor(window: BrowserWindow) {
    this.#window = window;
  }

  async pickFolder(): Promise<string | null> {
    const choice = await dialog.showOpenDialog(this.#window, { title: translate('project.pickTitle'), properties: ['openDirectory'] });
    return choice.canceled ? null : (choice.filePaths[0] ?? null);
  }
}
