// Detalhe: conexão com o Postgres (simulada). Como o driver real, exige configuração ao carregar.
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL ausente: suba o Postgres');

let nextId = 1;
export const pool = {
  async query(sql: string, params: unknown[]): Promise<{ rows: Array<{ id: number }> }> {
    void sql; void params; // aqui iria a ida ao banco
    return { rows: [{ id: nextId++ }] };
  },
};
