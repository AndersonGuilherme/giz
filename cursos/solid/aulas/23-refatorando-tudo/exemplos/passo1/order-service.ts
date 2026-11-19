// Passo 1 · SRP: cada ator ganhou o seu módulo. O checkout só orquestra.
import { priceOf, type Customer, type Item } from './pricing.ts';
import { shippingFor, type ShippingMethod } from './shipping.ts';
import { OrderRepository } from './order-repository.ts';
import { Notifications } from './notifications.ts';

export type Order = { items: Item[]; shippingMethod: ShippingMethod };

export class OrderService {
  private orders = new OrderRepository();
  private notify = new Notifications();

  checkout(order: Order, customer: Customer, now = new Date()) {
    const price = priceOf(order.items, customer, now);
    const shipping = shippingFor(order.shippingMethod, price.subtotal);
    const total = price.total + shipping;
    this.orders.save({ customerId: customer.id, total });
    this.notify.orderConfirmed(customer.email, total, price.saved);
    return { total, shipping };
  }
}
