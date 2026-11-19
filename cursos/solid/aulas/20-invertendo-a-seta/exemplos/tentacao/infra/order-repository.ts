// A tentação: criar a interface... mas dentro da pasta da infra, ao lado do Postgres.
export interface IPostgresOrderRepository {
  insertOrderRow(email: string, total: number): Promise<{ rows: Array<{ id: number }> }>;
}
