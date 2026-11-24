// O OrderService fino do módulo SRP: só orquestra. Mas olhe os imports.
import { subtotalOf, discountFor, type Item, type CustomerKind } from './pricing.ts';
import { shippingFor, type ShippingMethod } from './shipping.ts';
import { PostgresOrderRepository } from '../infra/postgres-order-repository.ts';
import { SmtpNotifier } from '../infra/smtp-notifier.ts';

export type Order = { items: Item[]; shippingMethod: ShippingMethod };
export type Customer = { email: string; kind: CustomerKind };

export class OrderService {
  private repository = new PostgresOrderRepository();
  private notifier = new SmtpNotifier();

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
