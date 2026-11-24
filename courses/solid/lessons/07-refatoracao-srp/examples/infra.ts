// Infra em memória, para os exemplos rodarem sem banco e sem servidor de e-mail.
// No código "real" da aula, estes seriam o banco de produção e o provedor de e-mail.
export const db = {
  rows: [] as Array<{ table: string; data: Record<string, unknown> }>,
  insert(table: string, data: Record<string, unknown>) {
    this.rows.push({ table, data });
  },
};

export const mailer = {
  outbox: [] as Array<{ to: string; body: string }>,
  send(to: string, body: string) {
    this.outbox.push({ to, body });
  },
};

export function resetInfra() {
  db.rows.length = 0;
  mailer.outbox.length = 0;
}

// Valores sempre em centavos (inteiros): dinheiro em ponto flutuante é outro tipo de podridão.
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function isBlackFriday(date: Date): boolean {
  return date.getMonth() === 10 && date.getDate() >= 24 && date.getDate() <= 30;
}
