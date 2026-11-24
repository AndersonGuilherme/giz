// Abstração: o checkout só precisa saber QUE existe um preço de frete, não COMO cada um calcula.
export type Quote = { subtotal: number; distanceKm: number };

// Interface: o contrato que todo método de entrega cumpre.
export interface ShippingMethod {
  readonly id: string;
  price(quote: Quote): number;
}

// Polimorfismo: a mesma chamada, method.price(quote), com o comportamento de cada um.
export const pickup: ShippingMethod = { id: 'pickup', price: () => 0 };
export const standard: ShippingMethod = { id: 'standard', price: ({ subtotal }) => (subtotal >= 20000 ? 0 : 2000) };
export const locker: ShippingMethod = { id: 'locker', price: () => 900 };
export const express: ShippingMethod = { id: 'express', price: () => 3500 };
export const sameDay: ShippingMethod = {
  id: 'sameDay',
  price: ({ distanceKm }) => {
    if (distanceKm > 15) throw new Error('fora da área de entrega no mesmo dia');
    return 2500 + distanceKm * 150;
  },
};
