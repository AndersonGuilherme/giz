import type { KeyedService, KeyStore } from '../../application/ports/KeyStore.ts';

/** The key of the service, or a readable error saying how to add it (the message never holds a key). */
export function requiredKey(keys: KeyStore, service: KeyedService): string {
  const key = keys.get(service);
  if (key) return key;
  throw new Error(`chave da ${service} não encontrada: ${keys.hint(service)}`);
}
