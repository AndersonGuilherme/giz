import { shell } from 'electron';
import type { Trash } from '../ports/ProjectDisk.ts';

/** The system trash, through Electron (the person can restore the project from there). */
export class ShellTrash implements Trash {
  trash(folder: string): Promise<void> {
    return shell.trashItem(folder);
  }
}
