// As duas versões do script fazem EXATAMENTE a mesma coisa. A diferença é só o custo de ler e manter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toCsv } from './relatorio.ts';
import { ExportService } from './relatorio-solid/export-service.ts';
import { JsonFileOrderSource } from './relatorio-solid/json-source.ts';
import { DayFilter } from './relatorio-solid/day-filter.ts';
import { CsvFormatter } from './relatorio-solid/csv-formatter.ts';

const file = new URL('./pedidos.json', import.meta.url).pathname;
const expected = 'pedido;cliente;total\nP-101;ana@exemplo.com;210,00\nP-102;bia@exemplo.com;80,00';

test('script de um arquivo: CSV dos pedidos do dia', () => {
  assert.equal(toCsv(JSON.parse(readFileSync(file, 'utf8')), '2026-11-27'), expected);
});

test('versão "SOLID" de sete arquivos: o mesmo CSV', () => {
  let written = '';
  new ExportService(new JsonFileOrderSource(file), new DayFilter('2026-11-27'), new CsvFormatter(), { write: (t) => (written = t) }).run();
  assert.equal(written, expected);
});
