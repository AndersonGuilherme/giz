import type { Customer } from './types.ts';

// Subtotal R$ 209,80 → VIP 10% = R$ 20,98 de desconto → R$ 188,82 (frete grátis: subtotal ≥ R$ 200).
export const vip: Customer = { id: 'c1', email: 'ana@exemplo.com', type: 'vip' };
export const normalDay = new Date(2026, 9, 10);
export const order = { items: [{ price: 10490, quantity: 2 }], shippingMethod: 'standard' as const };
