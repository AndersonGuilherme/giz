// O checkout cortado nos eixos de mudança: cada ator tem a sua classe; o OrderService só orquestra.
import { shippingFor } from './shipping.ts';
import { PriceCalculator } from './price-calculator.ts';
import { OrderRepository } from './order-repository.ts';
import { OrderNotifier } from './order-notifier.ts';
import type { Order, Customer } from './types.ts';

export class OrderService {
  private prices = new PriceCalculator(); // financeiro
  private orders = new OrderRepository(); // jurídico
  private notifier = new OrderNotifier(); // comunicação

  checkout(order: Order, customer: Customer, now = new Date()) {
    const { subtotal, discount } = this.prices.quote(order.items, customer, now);
    const shipping = shippingFor(order.shippingMethod, subtotal); // logística: subtotal, antes do desconto
    const total = subtotal - discount + shipping;
    this.orders.save(customer.id, total);
    this.notifier.confirm(customer.email, total, discount);
    return { total, shipping };
  }
}
