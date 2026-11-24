// Tentativa: o serviço não dá mais "new" na infra... mas ainda importa a infra.
import { subtotalOf, discountFor, type Item, type CustomerKind } from './pricing.ts';
import { shippingFor, type ShippingMethod } from './shipping.ts';
import { createRepository, createNotifier } from '../infra/factory.ts';

export type Order = { items: Item[]; shippingMethod: ShippingMethod };
export type Customer = { email: string; kind: CustomerKind };

export class OrderService {
  private repository = createRepository();
  private notifier = createNotifier();

  async checkout(order: Order, customer: Customer, now: Date) {
    const subtotal = subtotalOf(order.items);
    const discount = discountFor(customer.kind, subtotal, now);
    const shipping = shippingFor(order.shippingMethod, subtotal);
    const total = subtotal - discount + shipping;
    const id = await this.repository.save(customer.email, total);
    await this.notifier.orderConfirmed(customer.email, total, discount);
    return { id, total };
  }
}
