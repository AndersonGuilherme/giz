import type { Customer } from '../types.ts';

export class EmployeeDiscount {
  rate(c: Customer) {
    return c.type === 'employee' ? 0.3 : 0;
  }
}
