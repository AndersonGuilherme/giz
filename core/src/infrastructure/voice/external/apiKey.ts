import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type ExternalService = 'elevenlabs' | 'fish';
type Sources = Readonly<{ env: Readonly<Record<string, string | undefined>>; home: string }>;

const VARIABLES: Readonly<Record<ExternalService, string>> = { elevenlabs: 'ELEVENLABS_API_KEY', fish: 'FISH_API_KEY' };

/** The service key: the environment variable, or ~/.config/giz/<service>.key (outside the repository). */
export function apiKeyOf(service: ExternalService, { env, home }: Sources): string {
  const variable = VARIABLES[service];
  const fromEnvironment = env[variable]?.trim();
  if (fromEnvironment) return fromEnvironment;
  const file = join(home, '.config', 'giz', `${service}.key`);
  // An empty file (or only spaces) is no key: the same message as a missing one.
  const fromFile = existsSync(file) ? readFileSync(file, 'utf8').trim() : '';
  if (fromFile) return fromFile;
  throw new Error(`chave da ${service} não encontrada: defina ${variable} ou crie ${file}`);
}
