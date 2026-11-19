// O checkout como terminou a aula 02: o frete já saiu (shippingFor), mas o resto continua aqui dentro.
// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
import { db, mailer, formatBRL, isBlackFriday } from './infra.ts';
import { shippingFor, type ShippingMethod } from './shipping.ts';

export type Customer = { id: string; email: string; type: 'regular' | 'vip' | 'employee' };
export type Item = { price: number; quantity: number };
export type Order = { items: Item[]; shippingMethod: ShippingMethod };

export class OrderService {
  checkout(order: Order, customer: Customer, now = new Date()) {
    let subtotal = 0;
    for (const item of order.items) subtotal += item.price * item.quantity;

    let rate = 0;
    if (customer.type === 'vip') rate = 0.1;
    else if (customer.type === 'employee') rate = 0.3;
    if (isBlackFriday(now) && rate < 0.2) rate = 0.2;
    const total = Math.round(subtotal * (1 - rate));

    const shipping = shippingFor(order.shippingMethod, subtotal);

    const finalTotal = total + shipping;
    db.insert('orders', { customerId: customer.id, total: finalTotal });
    mailer.send(
      customer.email,
      `Pedido confirmado! Total: ${formatBRL(finalTotal)} (você economizou ${formatBRL(subtotal - total)})`,
    );
    return { total: finalTotal, shipping };
  }
}
