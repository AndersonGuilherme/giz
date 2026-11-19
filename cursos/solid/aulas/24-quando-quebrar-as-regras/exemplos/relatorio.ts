// Script: exporta os pedidos de um dia em CSV para o financeiro. Um dono, roda toda noite, não muda há um ano.
// Uso: node relatorio.ts pedidos.json 2026-11-27
import { readFileSync } from 'node:fs';

type Order = { id: string; customer: string; total: number; createdAt: string };

export function toCsv(orders: Order[], day: string): string {
  const rows = orders
    .filter((o) => o.createdAt.startsWith(day))
    .map((o) => `${o.id};${o.customer};${(o.total / 100).toFixed(2).replace('.', ',')}`);
  return ['pedido;cliente;total', ...rows].join('\n');
}

if (process.argv[1] === import.meta.filename) {
  const [file, day] = process.argv.slice(2);
  console.log(toCsv(JSON.parse(readFileSync(file, 'utf8')), day));
}
