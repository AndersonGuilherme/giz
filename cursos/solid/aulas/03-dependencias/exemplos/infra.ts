// Infra: banco em memória e o mailer, que agora entrega pelo provedor novo.
import { deliver } from './mail-provider.ts';

export const db = {
  rows: [] as Array<{ table: string; data: Record<string, unknown> }>,
  insert(table: string, data: Record<string, unknown>) { this.rows.push({ table, data }); },
};

export const mailer = {
  send(to: string, body: string) { deliver(to, body); },
};
