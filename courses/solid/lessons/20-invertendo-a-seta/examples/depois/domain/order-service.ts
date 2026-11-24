// Depois: o serviço só conhece as regras e as portas do próprio domínio.
import { subtotalOf, discountFor, type Item, type CustomerKind } from './pricing.ts';
import { shippingFor, type ShippingMethod } from './shipping.ts';
import type { OrderRepository, Notifier } from './ports.ts';

export type Order = { items: Item[]; shippingMethod: ShippingMethod };
export type Customer = { email: string; kind: CustomerKind };

export class OrderService {
  private repository: OrderRepository;
  private notifier: Notifier;

  constructor(repository: OrderRepository, notifier: Notifier) {
    this.repository = repository;
    this.notifier = notifier;
  }

  async checkout(order: Order, customer: Customer, now: Date) {
    const subtotal = subtotalOf(order.items);
    const discount = discountFor(customer.kind, subtotal, now);
    const shipping = shippingFor(order.shippingMethod, subtotal);
    const total = subtotal - discount + shipping;
    const id = await this.repository.save({ email: customer.email, total, discount });
    await this.notifier.orderConfirmed(customer.email, total, discount);
    return { id, total };
  }
}
