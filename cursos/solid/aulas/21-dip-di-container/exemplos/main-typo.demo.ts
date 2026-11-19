// Demo (falha de propósito): o mesmo erro de digitação na montagem à mão.
import { OrderService } from './domain/order-service.ts';
import { PostgresOrderRepository } from './infra/postgres-order-repository.ts';
import { SmtpNotifier } from './infra/smtp-notifier.ts';

export function compose() {
  const repository = new PostgresOrderRepository();
  const notifier = new SmtpNotifier();
  const orderService = new OrderService(repository, notfier);
  return { orderService };
}
