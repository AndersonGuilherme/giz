// Infra da loja: a mesma da aula 01, com uma diferença — simula a rede, para o tempo dos testes ser realista.
// Valores SIMULADOS: 20 ms por gravação no banco, 40 ms por e-mail enviado.
const pause = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

export const db = {
  rows: [] as Array<{ table: string; data: Record<string, unknown> }>,
  insert(table: string, data: Record<string, unknown>) {
    pause(20);
    this.rows.push({ table, data });
  },
};

export const mailer = {
  outbox: [] as Array<{ to: string; body: string }>,
  send(to: string, body: string) {
    pause(40);
    this.outbox.push({ to, body });
  },
};

export function resetInfra() {
  db.rows.length = 0;
  mailer.outbox.length = 0;
}

// Valores sempre em centavos (inteiros).
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function isBlackFriday(date: Date): boolean {
  return date.getMonth() === 10 && date.getDate() >= 24 && date.getDate() <= 30;
}
