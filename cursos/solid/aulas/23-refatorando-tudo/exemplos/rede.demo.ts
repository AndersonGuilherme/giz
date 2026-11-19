// Demonstração usada na tela: a rede de proteção rodada contra a v4 ORIGINAL da aula 01.
// Não segue o padrão *.test.ts de propósito: um teste FALHA (o bug do frete na Black Friday).
// Rodar: node --test rede.demo.ts
import { db, mailer } from './infra.ts';
import { checkoutContract } from './contrato.ts';
import { OrderService as V4 } from './order-service.v4.ts';

const v4 = new V4();
checkoutContract('antes (v4 da aula 01)', () => ({
  checkout: (o, c, n) => v4.checkout(o, c, n),
  saved: () => db.rows,
  emails: () => mailer.outbox.map((m) => m.body),
}));
