// Detalhe que se encaixa na porta do domínio. Agora a seta sobe: infra → domínio.
import type { OrderRepository, PlacedOrder } from '../domain/ports.ts';
import { pool } from './pg-pool.ts';

export class PostgresOrderRepository implements OrderRepository {
  async save(order: PlacedOrder): Promise<number> {
    const result = await pool.query(
      'INSERT INTO orders (email, total, discount) VALUES ($1, $2, $3) RETURNING id',
      [order.email, order.total, order.discount],
    );
    return result.rows[0].id;
  }
}
