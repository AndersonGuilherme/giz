import type { Order, OrderFilter } from './ports.ts';

export class DayFilter implements OrderFilter {
  private day: string;
  constructor(day: string) { this.day = day; }
  accepts(order: Order): boolean { return order.createdAt.startsWith(this.day); }
}
