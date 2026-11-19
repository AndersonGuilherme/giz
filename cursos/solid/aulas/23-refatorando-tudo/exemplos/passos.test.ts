// O mesmo contrato, rodado contra o "antes" e contra cada um dos cinco passos.
import { db, mailer } from './infra.ts';
import { checkoutContract, type Harness } from './contrato.ts';
import { OrderService as V5 } from './order-service.v5.ts';
import { OrderService as P1 } from './passo1/order-service.ts';
import { OrderService as P2 } from './passo2/order-service.ts';
import { OrderService as P3 } from './passo3/order-service.ts';
import { OrderService as P4 } from './passo4/order-service.ts';
import { OrderService as P5 } from './passo5/order-service.ts';
import { confirmationText } from './passo5/message.ts';

// Passos 0 a 4: o checkout ainda cria o banco e o e-mail por dentro, então o teste usa a infra (lenta).
const withInfra = (svc: { checkout: Harness['checkout'] }) => (): Harness => ({
  checkout: (o, c, n) => svc.checkout(o, c, n),
  saved: () => db.rows,
  emails: () => mailer.outbox.map((m) => m.body),
});

checkoutContract('antes (v5)', withInfra(new V5()));
checkoutContract('passo 1 · SRP', withInfra(new P1()));
checkoutContract('passo 2 · OCP', withInfra(new P2()));
checkoutContract('passo 3 · LSP', withInfra(new P3()));
checkoutContract('passo 4 · ISP', withInfra(new P4()));

// Passo 5: o checkout recebe as portas. O teste entrega dublês de uma linha, sem banco e sem e-mail.
checkoutContract('passo 5 · DIP', () => {
  const saved: unknown[] = [];
  const emails: string[] = [];
  const svc = new P5(
    { save: (o) => saved.push(o) },
    { orderConfirmed: (_to, total, economy) => emails.push(confirmationText(total, economy)) },
  );
  return { checkout: (o, c, n) => svc.checkout(o, c, n), saved: () => saved, emails: () => emails };
});
