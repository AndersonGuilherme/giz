// A: cria a peça sozinho.
import { PostgresOrderRepository } from '../infra/postgres-order-repository.ts';

export class OrderServiceA {
  private repository = new PostgresOrderRepository();
}
