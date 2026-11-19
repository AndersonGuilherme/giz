// C: recebe a peça pelo construtor, e o tipo é a porta do domínio.
import type { OrderRepository } from '../domain/ports.ts';

export class OrderServiceC {
  repository: OrderRepository;

  constructor(repository: OrderRepository) {
    this.repository = repository;
  }
}
