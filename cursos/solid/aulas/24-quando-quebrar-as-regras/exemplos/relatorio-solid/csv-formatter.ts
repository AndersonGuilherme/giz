import type { Order, RowFormatter } from './ports.ts';

export class CsvFormatter implements RowFormatter {
  header(): string { return 'pedido;cliente;total'; }
  row(o: Order): string { return `${o.id};${o.customer};${(o.total / 100).toFixed(2).replace('.', ',')}`; }
}
