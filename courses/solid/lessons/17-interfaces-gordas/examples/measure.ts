// Mede o custo da interface gorda nos arquivos desta aula: quantos métodos o tipo exige,
// quantos o cliente usa, o tamanho do dublê e quantos métodos só lançam "não suportado".
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
const unsupported = (file: string) => src(file).match(/não suportado/g)?.length ?? 0;

const all = interfaceMethods('payment-gateway.ts', 'PaymentGateway');
const n = all.length;
const usedByCheckout = used('checkout.ts', 'gateway');
const fake = src('fake-gateway.ts');
const fakeImpl = all.filter((m) => new RegExp(`^\\s+${m}\\(`, 'm').test(fake)).length;

console.log(`PaymentGateway exige ${n} métodos`);
console.log(`checkout.ts usa ${usedByCheckout.length} de ${n}: ${usedByCheckout.join(', ')}`);
const fakeDead = fake.match(/não usado no teste/g)?.length ?? 0;
console.log(`fake-gateway.ts: ${lines('fake-gateway.ts')} linhas, ${fakeDead} de ${fakeImpl} só lançam erro`);
console.log(`card-gateway.ts: ${unsupported('card-gateway.ts')} de ${n} lançam "não suportado"`);
console.log(`pix-gateway.ts: ${unsupported('pix-gateway.ts')} de ${n} lançam "não suportado"`);
