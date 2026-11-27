import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { KeyedService, KeyStore } from '../../application/ports/KeyStore.ts';

export type KeySources = Readonly<{ env: Readonly<Record<string, string | undefined>>; home: string }>;

const VARIABLES: Readonly<Record<KeyedService, string>> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  elevenlabs: 'ELEVENLABS_API_KEY',
  fish: 'FISH_API_KEY',
};

// A missing or unreadable file is no key; an empty file (or only spaces) too.
function fileContent(file: string): string {
  try {
    return readFileSync(file, 'utf8').trim();
  } catch {
    return '';
  }
}

/** The CLI keys: the environment variable, or ~/.config/giz/<service>.key (outside any repository). */
export class EnvironmentKeyStore implements KeyStore {
  readonly #sources: KeySources;

  constructor(sources: KeySources) {
    this.#sources = sources;
  }

  get(service: KeyedService): string | undefined {
    const fromEnvironment = this.#sources.env[VARIABLES[service]]?.trim();
    return fromEnvironment || fileContent(this.#file(service)) || undefined;
  }

  hint(service: KeyedService): string {
    return `defina ${VARIABLES[service]} ou crie ${this.#file(service)}`;
  }

  #file(service: KeyedService): string {
    return join(this.#sources.home, '.config', 'giz', `${service}.key`);
  }
}
