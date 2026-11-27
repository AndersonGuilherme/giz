import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import { IMAGE_PROVIDERS, INTERFACE_LANGUAGES, TEXT_PROVIDERS, VOICE_PROVIDERS } from '../../shared/settings.ts';
import type { AppConfig, AppConfigStore } from '../ports/SettingsStores.ts';

const SCHEMA = z.object({
  language: z.enum(INTERFACE_LANGUAGES),
  projectsFolder: z.string().min(1).nullable(),
  providers: z.object({ text: z.enum(TEXT_PROVIDERS), image: z.enum(IMAGE_PROVIDERS), voice: z.enum(VOICE_PROVIDERS) }),
  firstRunDone: z.boolean(),
});

/** studio.json in the Studio's userData. A missing or broken file reads as none: the wizard runs again and rewrites it. */
export class JsonAppConfig implements AppConfigStore {
  readonly #file: string;

  constructor(file: string) {
    this.#file = file;
  }

  async read(): Promise<AppConfig | null> {
    const text = await readFile(this.#file, 'utf8').catch(() => '');
    const parsed = SCHEMA.safeParse(this.#json(text));
    return parsed.success ? parsed.data : null;
  }

  async write(config: AppConfig): Promise<void> {
    const draft = `${this.#file}.${randomUUID()}.tmp`;
    await mkdir(dirname(this.#file), { recursive: true });
    await writeFile(draft, `${JSON.stringify(config, null, 2)}\n`);
    await rename(draft, this.#file);
  }

  #json(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
