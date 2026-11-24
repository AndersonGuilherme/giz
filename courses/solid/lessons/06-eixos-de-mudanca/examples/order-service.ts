// O checkout no início da aula 06: o mesmo de antes, com o arredondamento num helper (money.ts).
// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
import { db, mailer, formatBRL, isBlackFriday } from './infra.ts';
import { shippingFor } from './shipping.ts';
import { roundMoney } from './money.ts';
import type { Order, Customer } from './types.ts';

export class OrderService {
  checkout(order: Order, customer: Customer, now = new Date()) {
    let subtotal = 0;
    for (const item of order.items) subtotal += item.price * item.quantity;

    let rate = 0;
    if (customer.type === 'vip') rate = 0.1;
    else if (customer.type === 'employee') rate = 0.3;
    if (isBlackFriday(now) && rate < 0.2) rate = 0.2;
    const discount = roundMoney(subtotal * rate);

    const shipping = shippingFor(order.shippingMethod, subtotal);
    const total = subtotal - discount + shipping;

    db.insert('orders', { customerId: customer.id, total });
    mailer.send(
      customer.email,
      `Pedido confirmado! Total: ${formatBRL(total)} (você economizou ${formatBRL(discount)})`,
    );
    return { total, shipping };
  }
}
