// Passo 2: a gravação sai para o OrderRepository.
// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
import { mailer, formatBRL } from './infra.ts';
import { shippingFor } from './shipping.ts';
import { PriceCalculator } from './price-calculator.ts';
import { OrderRepository } from './order-repository.ts';
import type { Order, Customer } from './types.ts';

export class OrderService {
  private prices = new PriceCalculator();
  private orders = new OrderRepository();

  checkout(order: Order, customer: Customer, now = new Date()) {
    const { subtotal, discount } = this.prices.quote(order.items, customer, now);

    const shipping = shippingFor(order.shippingMethod, subtotal);
    const total = subtotal - discount + shipping;

    this.orders.save(customer.id, total);
    mailer.send(
      customer.email,
      `Pedido confirmado! Total: ${formatBRL(total)} (você economizou ${formatBRL(discount)})`,
    );
    return { total, shipping };
  }
}
