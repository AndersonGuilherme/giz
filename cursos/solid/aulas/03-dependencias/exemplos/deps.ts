// Segue a trilha de imports locais a partir de um arquivo e imprime a cadeia de dependências.
// Uso: node deps.ts <arquivo.ts>
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

function importsOf(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  return [...src.matchAll(/from '(\.\/[^']+)'/g)].map((m) => join(dirname(file), m[1]));
}

function walk(file: string, depth: number, seen: Set<string>): number {
  let count = 0;
  for (const dep of importsOf(file)) {
    console.log(`${'  '.repeat(depth)}→ ${dep}`);
    count++;
    if (!seen.has(dep)) { seen.add(dep); count += walk(dep, depth + 1, seen); }
  }
  return count;
}

const root = process.argv[2];
console.log(root);
const total = walk(root, 1, new Set());
console.log(`${total} dependência(s), incluindo as transitivas`);
