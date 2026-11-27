// Part of the composition point (see composition.ts): the text AI providers and the CLI key store.
import { homedir } from 'node:os';
import { KEYED_SERVICES, type KeyedService, type KeyStore } from '../../../application/ports/KeyStore.ts';
import type { TextProviderName } from '../../../domain/ai/TextProviderName.ts';
import { ANTHROPIC_API } from '../../../infrastructure/ai/text/anthropicApi.ts';
import { GEMINI_API } from '../../../infrastructure/ai/text/geminiApi.ts';
import { HttpTextProvider } from '../../../infrastructure/ai/text/HttpTextProvider.ts';
import { OPENAI_API } from '../../../infrastructure/ai/text/openAiApi.ts';
import type { TextApi } from '../../../infrastructure/ai/text/textApi.ts';
import { EnvironmentKeyStore } from '../../../infrastructure/keys/EnvironmentKeyStore.ts';

const APIS: Readonly<Record<TextProviderName, TextApi>> = { anthropic: ANTHROPIC_API, openai: OPENAI_API, gemini: GEMINI_API };
// The model of each provider can be changed without touching the code; empty means the default.
const MODEL_VARIABLES: Readonly<Record<TextProviderName, string>> = {
  anthropic: 'GIZ_ANTHROPIC_MODEL',
  openai: 'GIZ_OPENAI_MODEL',
  gemini: 'GIZ_GEMINI_MODEL',
};

const wait = (milliseconds: number) => new Promise<void>((done) => setTimeout(done, milliseconds));

/** The CLI keys: environment variables or ~/.config/giz/<service>.key. */
export function cliKeyStore(): KeyStore {
  return new EnvironmentKeyStore({ env: process.env, home: homedir() });
}

/** The text provider, with the model of GIZ_<PROVIDER>_MODEL or the default; the key is read only when it is called. */
export function textProviderOf(name: TextProviderName, keys: KeyStore = cliKeyStore()): HttpTextProvider {
  const model = process.env[MODEL_VARIABLES[name]]?.trim() || undefined;
  return new HttpTextProvider(APIS[name], { fetch, keys, wait }, model);
}

/** Which services have a key (never the key itself) and, for the missing ones, how to add it. */
export function keyStatuses(keys: KeyStore = cliKeyStore()): ReadonlyArray<{ service: KeyedService; present: boolean; hint: string }> {
  return KEYED_SERVICES.map((service) => ({ service, present: keys.get(service) !== undefined, hint: keys.hint(service) }));
}
