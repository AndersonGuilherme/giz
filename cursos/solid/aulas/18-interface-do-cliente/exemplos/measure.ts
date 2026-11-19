// Mede o custo depois da segregação: o que o papel do checkout exige, o que o checkout usa,
// o tamanho do dublê e quantos métodos só lançam "não suportado".
// Uso: node measure.ts
import { readFileSync } from 'node:fs';

const src = (f: string) => readFileSync(new URL(f, import.meta.url), 'utf8');

function interfaceMethods(file: string, name: string): string[] {
  const body = src(file).split(`interface ${name} {`)[1].split('\n}')[0];
  return [...body.matchAll(/^\s+(\w+)\(/gm)].map((m) => m[1]);
}
const used = (file: string, obj: string) =>
  [...new Set([...src(file).matchAll(new RegExp(`${obj}\\.(\\w+)\\(`, 'g'))].map((m) => m[1]))];
const lines = (file: string) => src(file).trimEnd().split('\n').length;
const count = (file: string, text: string) => src(file).split(text).length - 1;

const n = interfaceMethods('roles.ts', 'Charges').length;
const usedByCheckout = used('checkout.ts', 'charges');

console.log(`Charges exige ${n} método(s)`);
console.log(`checkout.ts usa ${usedByCheckout.length} de ${n}: ${usedByCheckout.join(', ')}`);
console.log(`fake-charges.ts: ${lines('fake-charges.ts')} linhas, ${count('fake-charges.ts', 'não usado')} só lançam erro`);
console.log(`card-gateway.ts: ${count('card-gateway.ts', 'não suportado')} lançam "não suportado"`);
console.log(`pix-gateway.ts: ${count('pix-gateway.ts', 'não suportado')} lançam "não suportado"`);
