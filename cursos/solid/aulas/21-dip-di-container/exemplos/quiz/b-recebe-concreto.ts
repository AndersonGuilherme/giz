// B: recebe a peça pelo construtor... mas o tipo é a classe do Postgres.
import { PostgresOrderRepository } from '../infra/postgres-order-repository.ts';

export class OrderServiceB {
  repository: PostgresOrderRepository;

  constructor(repository: PostgresOrderRepository) {
    this.repository = repository;
  }
}
