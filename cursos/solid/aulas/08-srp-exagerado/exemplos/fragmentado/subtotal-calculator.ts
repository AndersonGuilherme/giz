import type { Item } from '../types.ts';

export class SubtotalCalculator {
  sum(items: Item[]) {
    return items.reduce((s, i) => s + i.price * i.quantity, 0);
  }
}
