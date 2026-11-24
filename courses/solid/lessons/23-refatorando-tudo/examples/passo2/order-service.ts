// Passo 2 · OCP: o checkout recebe as listas de regras e de fretes. Novidade entra na lista, não aqui.
import { priceOf, storeRules, type Customer, type Item } from './pricing.ts';
import { allMethods, quoteFor, shippingCost } from './shipping.ts';
import { OrderRepository } from './order-repository.ts';
import { Notifications } from './notifications.ts';

export type Order = { items: Item[]; shippingMethod: string; distanceKm?: number };

export class OrderService {
  private orders = new OrderRepository();
  private notify = new Notifications();
  rules = storeRules;
  methods = allMethods;

  checkout(order: Order, customer: Customer, now = new Date()) {
    const price = priceOf(order.items, customer, now, this.rules);
    const quote = quoteFor(order.items, order.distanceKm);
    const shipping = shippingCost(this.methods, order.shippingMethod, quote);
    const total = price.total + shipping;
    this.orders.save({ customerId: customer.id, total });
    this.notify.orderConfirmed(customer.email, total, price.saved);
    return { total, shipping };
  }
}
