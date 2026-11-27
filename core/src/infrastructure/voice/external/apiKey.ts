import { EnvironmentKeyStore, type KeySources } from '../../keys/EnvironmentKeyStore.ts';
import { requiredKey } from '../../keys/requiredKey.ts';

export type ExternalService = 'elevenlabs' | 'fish';

/** The service key: the environment variable, or ~/.config/giz/<service>.key (outside the repository). */
export function apiKeyOf(service: ExternalService, sources: KeySources): string {
  return requiredKey(new EnvironmentKeyStore(sources), service);
}
