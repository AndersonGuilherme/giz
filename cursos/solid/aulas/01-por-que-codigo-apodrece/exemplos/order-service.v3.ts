// Versão 3: pedido de negócio nº 2 — Black Friday: 20% para todos, sem acumular com VIP
// (vale o maior desconto), e o e-mail passa a mostrar quanto o cliente economizou.
// Para calcular a economia, o desconto foi para ANTES do frete. A linha do frete não mudou
// nem um caractere, mas agora `total` já vem com desconto: a regra da loja quebrou em silêncio.
import { db, mailer, formatBRL, isBlackFriday } from './infra.ts';

export type Customer = { id: string; email: string; type: 'regular' | 'vip' | 'employee' };
export type Item = { price: number; quantity: number };
export type Order = { items: Item[]; shippingMethod: 'standard' | 'pickup' | 'express' };

export class OrderService {
  checkout(order: Order, customer: Customer, now = new Date()) {
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
    db.insert('orders', { customerId: customer.id, total: finalTotal });
    mailer.send(
      customer.email,
      `Pedido confirmado! Total: ${formatBRL(finalTotal)} (você economizou ${formatBRL(subtotal - total)})`,
    );
    return { total: finalTotal, shipping };
  }
}
