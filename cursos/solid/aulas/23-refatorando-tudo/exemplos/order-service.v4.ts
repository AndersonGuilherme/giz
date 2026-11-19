// Versão 4: o ATALHO. O carrinho precisa do frete sem gravar pedido nem mandar e-mail,
// então alguém adicionou uma flag. Funciona — e é exatamente a viscosidade da aula.
import { db, mailer, formatBRL, isBlackFriday } from './infra.ts';

export type Customer = { id: string; email: string; type: 'regular' | 'vip' | 'employee' };
export type Item = { price: number; quantity: number };
export type Order = { items: Item[]; shippingMethod: 'standard' | 'pickup' | 'express' };

export class OrderService {
  checkout(order: Order, customer: Customer, now = new Date(), dryRun = false) {
    let subtotal = 0;
    for (const item of order.items) subtotal += item.price * item.quantity;

    let rate = 0;
    if (customer.type === 'vip') rate = 0.1;
    else if (customer.type === 'employee') rate = 0.3;
    if (isBlackFriday(now) && rate < 0.2) rate = 0.2;
    const total = Math.round(subtotal * (1 - rate));

    let shipping = 0;
    if (order.shippingMethod === 'standard') shipping = total >= 20000 ? 0 : 2000;
    else if (order.shippingMethod === 'express') shipping = 3500;

    const finalTotal = total + shipping;
    if (!dryRun) {
      db.insert('orders', { customerId: customer.id, total: finalTotal });
      mailer.send(
        customer.email,
        `Pedido confirmado! Total: ${formatBRL(finalTotal)} (você economizou ${formatBRL(subtotal - total)})`,
      );
    }
    return { total: finalTotal, shipping };
  }
}
