// D: ninguém entrega nada. A classe vai buscar a porta num registro do domínio.
import type { OrderRepository } from '../domain/ports.ts';
import { registry } from '../domain/registry.ts';

export class OrderServiceD {
  get repository() {
    return registry.get<OrderRepository>('orders');
  }
}
