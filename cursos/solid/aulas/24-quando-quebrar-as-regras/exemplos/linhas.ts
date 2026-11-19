// Conta linhas de código (sem linhas vazias e sem comentários) de cada arquivo. Mesma ideia da aula 23.
// Uso: node linhas.ts <arquivo.ts> [outros...]
import { readFileSync } from 'node:fs';

let sum = 0;
for (const file of process.argv.slice(2)) {
  const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() && !l.trim().startsWith('//'));
  sum += lines.length;
  console.log(`${String(lines.length).padStart(3)}  ${file}`);
}
console.log(`${String(sum).padStart(3)}  total`);
