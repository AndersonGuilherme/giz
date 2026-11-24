// Raiz de composição: o ÚNICO lugar que dá new na infra e liga as peças. Mora na borda.
import { OrderService } from './domain/order-service.ts';
import { PostgresOrderRepository } from './infra/postgres-order-repository.ts';
import { SmtpNotifier } from './infra/smtp-notifier.ts';

export function compose() {
  const repository = new PostgresOrderRepository();
  const notifier = new SmtpNotifier();
  const orderService = new OrderService(repository, notifier);
  return { orderService };
}
