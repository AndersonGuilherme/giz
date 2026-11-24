// Política: regra de frete (aula 02). Frete grátis sobre o SUBTOTAL, antes de descontos.
export type ShippingMethod = 'pickup' | 'standard' | 'express' | 'locker';

export function shippingFor(method: ShippingMethod, subtotal: number): number {
  if (method === 'pickup') return 0;
  if (method === 'express') return 3500;
  if (method === 'locker') return 900;
  return subtotal >= 20000 ? 0 : 2000;
}
