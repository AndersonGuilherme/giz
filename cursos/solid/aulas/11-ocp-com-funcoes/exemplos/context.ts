// O mesmo contexto da aula 10. Valores em centavos.
export type Customer = { type: 'regular' | 'vip' | 'employee'; birthMonth: number };
export type DiscountContext = { subtotal: number; customer: Customer; now: Date; coupon?: string };
