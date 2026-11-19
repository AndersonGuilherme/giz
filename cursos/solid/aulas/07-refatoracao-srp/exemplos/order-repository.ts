// Ator: JURÍDICO. O que é gravado de cada pedido (LGPD: só o id do cliente; o total cobrado, com frete).
import { db } from './infra.ts';

export class OrderRepository {
  save(customerId: string, total: number) {
    db.insert('orders', { customerId, total });
  }
}
