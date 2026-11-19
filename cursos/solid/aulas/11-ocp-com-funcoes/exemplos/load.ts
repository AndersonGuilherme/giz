// Carrega a tabela de promoções (como o sistema faria ao subir). Uso: node load.ts <arquivo.json>
import { readFileSync } from 'node:fs';
import { fromConfig } from './from-config.ts';

const file = process.argv[2] ?? 'promotions.json';
try {
  const rows = JSON.parse(readFileSync(file, 'utf8'));
  fromConfig(rows);
  console.log(`ok: ${rows.length} promoções carregadas`);
} catch (err) {
  console.log(`✖ ${file} recusado`);
  console.log(`  ${(err as Error).message}`);
  process.exitCode = 1;
}
