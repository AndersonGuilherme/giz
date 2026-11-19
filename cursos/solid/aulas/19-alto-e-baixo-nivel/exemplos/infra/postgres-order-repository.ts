// Detalhe: grava o pedido na tabela orders do Postgres.
import { pool } from './pg-pool.ts';

export class PostgresOrderRepository {
  async save(email: string, total: number): Promise<number> {
    const result = await pool.query(
      'INSERT INTO orders (email, total) VALUES ($1, $2) RETURNING id',
      [email, total],
    );
    return result.rows[0].id;
  }
}
