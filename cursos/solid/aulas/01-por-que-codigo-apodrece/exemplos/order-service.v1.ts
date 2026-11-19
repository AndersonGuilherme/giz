// Versão 1: o checkout como ele nasce em muitas lojas. Funciona e tem teste.
// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
import { db, mailer, formatBRL } from './infra.ts';

export type Customer = { id: string; email: string; type: 'regular' | 'vip' | 'employee' };
export type Item = { price: number; quantity: number }; // price em centavos
export type Order = { items: Item[]; shippingMethod: 'standard' | 'pickup' };

export class OrderService {
  checkout(order: Order, customer: Customer) {
    let total = 0;
    for (const item of order.items) total += item.price * item.quantity;

    let shipping = 0;
    if (order.shippingMethod === 'standard') shipping = total >= 20000 ? 0 : 2000;

    if (customer.type === 'vip') total = Math.round(total * 0.9);
    else if (customer.type === 'employee') total = Math.round(total * 0.7);

    const finalTotal = total + shipping;
    db.insert('orders', { customerId: customer.id, total: finalTotal });
    mailer.send(customer.email, `Pedido confirmado! Total: ${formatBRL(finalTotal)}`);
    return { total: finalTotal, shipping };
  }
}
