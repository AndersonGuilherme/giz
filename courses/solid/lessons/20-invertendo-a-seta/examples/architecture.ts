// Teste de arquitetura: lista os imports de domain/ que apontam para a infra.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function domainImportsOfInfra(root: string): string[] {
  const dir = join(root, 'domain');
  return readdirSync(dir).flatMap((file) =>
    [...readFileSync(join(dir, file), 'utf8').matchAll(/from '(\.\.\/infra\/[^']+)'/g)]
      .map((m) => `domain/${file} → ${m[1].slice(3)}`));
}
