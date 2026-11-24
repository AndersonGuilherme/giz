// Infra: implementa a porta que o checkout definiu. A seta agora aponta da infra para o domínio.
import { db } from '../infra.ts';
import type { SavesOrders } from './order-service.ts';

export class OrderRepository implements SavesOrders {
  save(order: { customerId: string; total: number }) {
    db.insert('orders', order);
  }
}
