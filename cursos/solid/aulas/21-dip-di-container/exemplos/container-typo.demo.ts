// Demo (falha de propósito): um erro de digitação no nome. O compilador não reclama.
import './test-env.ts';
import { test } from 'node:test';
import { Container } from './container.ts';
import { OrderService } from './domain/order-service.ts';
import type { OrderRepository, Notifier } from './domain/ports.ts';
import { PostgresOrderRepository } from './infra/postgres-order-repository.ts';
import { SmtpNotifier } from './infra/smtp-notifier.ts';

test('container monta o serviço', () => {
  const c = new Container();
  c.register('repository', () => new PostgresOrderRepository());
  c.register('notifier', () => new SmtpNotifier());
  c.register('orderService', (c) => new OrderService(
    c.resolve<OrderRepository>('repository'),
    c.resolve<Notifier>('notfier'),
  ));
  c.resolve<OrderService>('orderService');
});
