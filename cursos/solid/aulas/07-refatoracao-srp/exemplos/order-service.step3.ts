// Passo 3: o e-mail sai para o OrderNotifier. O OrderService agora só orquestra.
// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
import { shippingFor } from './shipping.ts';
import { PriceCalculator } from './price-calculator.ts';
import { OrderRepository } from './order-repository.ts';
import { OrderNotifier } from './order-notifier.ts';
import type { Order, Customer } from './types.ts';

export class OrderService {
  private prices = new PriceCalculator();
  private orders = new OrderRepository();
  private notifier = new OrderNotifier();

  checkout(order: Order, customer: Customer, now = new Date()) {
    const { subtotal, discount } = this.prices.quote(order.items, customer, now);

    const shipping = shippingFor(order.shippingMethod, subtotal);
    const total = subtotal - discount + shipping;

    this.orders.save(customer.id, total);
    this.notifier.confirm(customer.email, total, discount);
    return { total, shipping };
  }
}
