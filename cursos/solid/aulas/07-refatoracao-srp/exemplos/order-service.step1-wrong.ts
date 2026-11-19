// Passo 1, primeira tentativa: usa o PriceCalculator que esqueceu a data.
// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
import { db, mailer, formatBRL } from './infra.ts';
import { shippingFor } from './shipping.ts';
import { PriceCalculator } from './price-calculator.wrong.ts';
import type { Order, Customer } from './types.ts';

export class OrderService {
  private prices = new PriceCalculator();

  checkout(order: Order, customer: Customer, now = new Date()) {
    const { subtotal, discount } = this.prices.quote(order.items, customer);

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
