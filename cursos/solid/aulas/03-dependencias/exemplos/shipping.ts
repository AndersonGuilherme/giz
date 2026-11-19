// A regra de frete extraída na aula 02: não importa nada.
export type ShippingMethod = 'standard' | 'pickup' | 'express';

export function shippingFor(method: ShippingMethod, subtotal: number): number {
  if (method === 'pickup') return 0;
  if (method === 'express') return 3500;
  return subtotal >= 20000 ? 0 : 2000;
}
