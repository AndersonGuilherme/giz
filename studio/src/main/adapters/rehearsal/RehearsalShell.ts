import { appendFile, copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { DesktopShell } from '../../ports/DesktopShell.ts';

/**
 * The rehearsal desktop (smoke test): nothing opens and the system clipboard is left alone; each request is one JSON
 * line in `<home>/desktop.log`, and a saved copy goes to `<home>/exported/<name>` without a dialog.
 */
export class RehearsalShell implements DesktopShell {
  readonly #home: string;

  constructor(home: string) {
    this.#home = home;
  }

  openFolder(path: string): Promise<void> {
    return this.#log({ open: path });
  }

  copyText(text: string): Promise<void> {
    return this.#log({ copied: text });
  }

  async saveCopy(from: string, name: string): Promise<string | null> {
    const folder = join(this.#home, 'exported');
    await mkdir(folder, { recursive: true });
    await copyFile(from, join(folder, name));
    await this.#log({ saved: join(folder, name) });
    return join(folder, name);
  }

  #log(entry: object): Promise<void> {
    return appendFile(join(this.#home, 'desktop.log'), `${JSON.stringify(entry)}\n`);
  }
}
