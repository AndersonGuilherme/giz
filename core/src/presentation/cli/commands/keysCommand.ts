import { isTextProvider, TEXT_PROVIDERS } from '../../../domain/ai/TextProviderName.ts';
import type { AiOverrides } from '../composition/aiOverrides.ts';
import { UsageError } from '../usage.ts';

// `giz keys`: the keys of the paid services. The composition part loads on demand.
const text = () => import('../composition/text.ts');
const USAGE = `uso: giz keys list | test <${TEXT_PROVIDERS.join('|')}>`;

// The smallest real call: a few tokens in and out (costs a fraction of a cent).
const PING = { system: 'Reply with the single word: ok', prompt: 'ok', maxTokens: 64 };

async function list(): Promise<void> {
  const { keyStatuses } = await text();
  for (const { service, present, hint } of keyStatuses()) console.log(present ? `${service}: chave configurada` : `${service}: sem chave (${hint})`);
}

// Runs only when asked: it calls the real service once (a single attempt, no retries) with the configured key.
async function testKey(name: string | undefined, overrides: AiOverrides): Promise<void> {
  if (!isTextProvider(name)) throw new UsageError(USAGE);
  const provider = (await text()).keyCheckProviderOf(name, overrides);
  const { usage } = await provider.generate(PING);
  console.log(`${name}: ok (modelo ${provider.model()}, ${usage.inputTokens} tokens de entrada, ${usage.outputTokens} de saída)`);
}

type Action = (provider: string | undefined, overrides: AiOverrides) => Promise<void>;
const ACTIONS: Readonly<Record<string, Action>> = { list, test: testKey };

/**
 * `giz keys list | test <provider>`: which keys exist (never their values), or one tiny real call to check a key.
 * `overrides` (the HTTP client, the key store) is for the tests.
 */
export async function keysCommand([action = '', provider]: readonly string[], overrides: AiOverrides = {}): Promise<void> {
  const run = Object.hasOwn(ACTIONS, action) ? ACTIONS[action] : undefined;
  if (!run) throw new UsageError(USAGE);
  await run(provider, overrides);
}
