// A solução tentadora: esconder o "new" numa fábrica da infra.
import { PostgresOrderRepository } from './postgres-order-repository.ts';
import { SmtpNotifier } from './smtp-notifier.ts';

export const createRepository = () => new PostgresOrderRepository();
export const createNotifier = () => new SmtpNotifier();
