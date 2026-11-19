// A borda do sistema: o único arquivo que conhece as duas pontas e liga uma na outra.
import { OrderService } from './domain/order-service.ts';
import { PostgresOrderRepository } from './infra/postgres-order-repository.ts';
import { SmtpNotifier } from './infra/smtp-notifier.ts';

export const orderService = new OrderService(new PostgresOrderRepository(), new SmtpNotifier());
