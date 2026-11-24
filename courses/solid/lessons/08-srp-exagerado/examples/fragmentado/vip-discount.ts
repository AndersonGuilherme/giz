import { isBlackFriday } from '../infra.ts';
import type { Customer } from '../types.ts';

export class VipDiscount {
  rate(c: Customer, now: Date) {
    // na Black Friday o VIP fica de fora (lá ele ganha mais)
    return c.type === 'vip' && !isBlackFriday(now) ? 0.1 : 0;
  }
}
