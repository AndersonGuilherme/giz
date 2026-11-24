// Passo 2 · OCP — cada método de entrega é um objeto (como na aula 04). Método novo = objeto novo.
// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
export type Quote = { subtotal: number; distanceKm: number };
type Items = Array<{ price: number; quantity: number }>;

export function quoteFor(items: Items, distanceKm = 0): Quote {
  return { subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0), distanceKm };
}

export function shippingCost(methods: ShippingMethod[], id: string, quote: Quote): number {
  const method = methods.find((m) => m.id === id);
  if (!method) throw new Error(`frete ${id} não existe`);
  return method.price(quote);
}

export interface ShippingMethod {
  readonly id: string;
  price(quote: Quote): number;
}

export const pickup: ShippingMethod = { id: 'pickup', price: () => 0 };
export const standard: ShippingMethod = { id: 'standard', price: (q) => (q.subtotal >= 20000 ? 0 : 2000) };
export const express: ShippingMethod = { id: 'express', price: () => 3500 };
export const locker: ShippingMethod = { id: 'locker', price: () => 900 };
export const sameDay: ShippingMethod = {
  id: 'sameDay',
  price: ({ distanceKm }) => {
    if (distanceKm > 15) throw new Error('fora da área de entrega no mesmo dia');
    return 2500 + distanceKm * 150;
  },
};
export const allMethods = [pickup, standard, express, locker, sameDay];
