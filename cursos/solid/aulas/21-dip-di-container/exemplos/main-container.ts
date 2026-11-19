// A mesma montagem, agora com o container. Repare: as ligações viraram nomes em texto.
import { Container } from './container.ts';
import { OrderService } from './domain/order-service.ts';
import type { OrderRepository, Notifier } from './domain/ports.ts';
import { PostgresOrderRepository } from './infra/postgres-order-repository.ts';
import { SmtpNotifier } from './infra/smtp-notifier.ts';

export function compose() {
  const c = new Container();
  c.register('repository', () => new PostgresOrderRepository());
  c.register('notifier', () => new SmtpNotifier());
  c.register('orderService', (c) => new OrderService(
    c.resolve<OrderRepository>('repository'),
    c.resolve<Notifier>('notifier'),
  ));
  return { orderService: c.resolve<OrderService>('orderService') };
}
