// Persistência: grava o pedido no banco.
import { db } from '../infra.ts';

export class OrderRepository {
  save(order: { customerId: string; total: number }) {
    db.insert('orders', order);
  }
}
