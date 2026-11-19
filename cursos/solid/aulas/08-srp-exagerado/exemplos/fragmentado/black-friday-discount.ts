import { isBlackFriday } from '../infra.ts';
import type { Customer } from '../types.ts';

export class BlackFridayDiscount {
  rate(c: Customer, now: Date) {
    // funcionário fica de fora (já tem mais)
    return isBlackFriday(now) && c.type !== 'employee' ? 0.2 : 0;
  }
}
