// A regra de frete extraída: recebe só o que precisa saber (baixo acoplamento)
// e reúne só o que muda junto (alta coesão). Sem banco, sem e-mail, sem ordem de linhas.
export type ShippingMethod = 'standard' | 'pickup' | 'express';

// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, antes de descontos.
export const FREE_SHIPPING_FROM = 20000;

export function shippingFor(method: ShippingMethod, subtotal: number): number {
  if (method === 'pickup') return 0;
  if (method === 'express') return 3500;
  return subtotal >= FREE_SHIPPING_FROM ? 0 : 2000;
}
