// Passo 3 · LSP — o contrato agora diz tudo: quem não atende o pedido AVISA, em vez de explodir.
// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
export type Quote = { subtotal: number; distanceKm: number };
type Items = Array<{ price: number; quantity: number }>;

export function quoteFor(items: Items, distanceKm = 0): Quote {
  return { subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0), distanceKm };
}

export function shippingCost(methods: ShippingMethod[], id: string, quote: Quote): number {
  const method = methods.find((m) => m.id === id);
  if (!method?.available(quote)) throw new Error(`frete ${id} indisponível`);
  return method.price(quote);
}

export interface ShippingMethod {
  readonly id: string;
  available(quote: Quote): boolean; // nunca lança
  price(quote: Quote): number; // se disponível: nunca lança, nunca negativo
}

const yes = () => true;
export const pickup: ShippingMethod = { id: 'pickup', available: yes, price: () => 0 };
export const standard: ShippingMethod = {
  id: 'standard', available: yes, price: (q) => (q.subtotal >= 20000 ? 0 : 2000),
};
export const express: ShippingMethod = { id: 'express', available: yes, price: () => 3500 };
export const locker: ShippingMethod = { id: 'locker', available: yes, price: () => 900 };
export const sameDay: ShippingMethod = {
  id: 'sameDay',
  available: ({ distanceKm }) => distanceKm <= 15, // regra da loja: até 15 km
  price: ({ distanceKm }) => 2500 + distanceKm * 150,
};
export const allMethods = [pickup, standard, express, locker, sameDay];
