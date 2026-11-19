// O mesmo script "com os cinco princípios": uma porta para cada coisa que PODERIA mudar.
export type Order = { id: string; customer: string; total: number; createdAt: string };
export interface OrderSource { load(): Order[] }
export interface OrderFilter { accepts(order: Order): boolean }
export interface RowFormatter { header(): string; row(order: Order): string }
export interface Output { write(text: string): void }
