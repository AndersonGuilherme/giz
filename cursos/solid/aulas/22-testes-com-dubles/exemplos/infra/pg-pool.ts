// Detalhe: conexão com o Postgres (simulada, com latência). Exige configuração ao carregar.
import { wait, DB_ROUND_TRIP_MS } from './latency.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL ausente: suba o Postgres');

const table = new Map<number, unknown[]>();
export const pool = {
  async query(sql: string, params: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }> {
    await wait(DB_ROUND_TRIP_MS); // cada consulta vai e volta pela rede
    if (sql.startsWith('INSERT')) {
      const id = table.size + 1;
      table.set(id, params);
      return { rows: [{ id }] };
    }
    const row = table.get(params[0] as number);
    return { rows: row ? [{ email: row[0], total: row[1], discount: row[2] }] : [] };
  },
};
