// Conta linhas de código (sem linhas vazias e sem comentários) de cada arquivo
// e, se o arquivo tiver um método checkout(), as linhas só dele.
// Uso: node linhas.ts <arquivo.ts> [outros...]
import { readFileSync } from 'node:fs';

let sum = 0;
for (const file of process.argv.slice(2)) {
  const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() && !l.trim().startsWith('//'));
  sum += lines.length;
  const start = lines.findIndex((l) => l.trim().startsWith('checkout('));
  const end = start < 0 ? -1 : lines.findIndex((l, i) => i > start && l === '  }');
  const method = start < 0 ? '' : `  (checkout: ${end - start + 1})`;
  console.log(`${String(lines.length).padStart(3)}  ${file}${method}`);
}
console.log(`${String(sum).padStart(3)}  total`);
