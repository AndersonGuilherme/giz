import type { ShippingMethod } from './shipping.ts';

export type Customer = { id: string; email: string; type: 'regular' | 'vip' | 'employee' };
export type Item = { price: number; quantity: number };
export type Order = { items: Item[]; shippingMethod: ShippingMethod };
