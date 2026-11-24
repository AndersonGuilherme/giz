// Detalhe que implementa a porta do domínio.
import type { OrderRepository, PlacedOrder } from '../domain/ports.ts';
import { pool } from './pg-pool.ts';

export class PostgresOrderRepository implements OrderRepository {
  async save(order: PlacedOrder): Promise<number> {
    const result = await pool.query(
      'INSERT INTO orders (email, total, discount) VALUES ($1, $2, $3) RETURNING id',
      [order.email, order.total, order.discount],
    );
    return result.rows[0].id as number;
  }

  async findById(id: number): Promise<PlacedOrder | undefined> {
    const result = await pool.query('SELECT email, total, discount FROM orders WHERE id = $1', [id]);
    return result.rows[0] as PlacedOrder | undefined;
  }
}
