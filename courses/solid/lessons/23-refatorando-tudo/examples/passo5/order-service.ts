// Passo 5 · DIP: o checkout define as PORTAS de que precisa; banco e e-mail implementam por fora.
import { priceOf, storeRules, type Customer, type Item } from './pricing.ts';
import { allMethods, quoteFor, shippingCost } from './shipping.ts';

export type Order = { items: Item[]; shippingMethod: string; distanceKm?: number };
export interface SavesOrders { save(order: { customerId: string; total: number }): void }
export interface ConfirmsOrders { orderConfirmed(email: string, total: number, saved: number): void }

export class OrderService {
  private orders: SavesOrders;
  private notify: ConfirmsOrders;
  rules = storeRules;
  methods = allMethods;

  constructor(orders: SavesOrders, notify: ConfirmsOrders) {
    this.orders = orders;
    this.notify = notify;
  }

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
