// O serviço das aulas 20 e 21, com uma regra a mais: pedido sem itens é recusado.
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
    if (order.items.length === 0) throw new Error('Pedido sem itens');
    const subtotal = subtotalOf(order.items);
    const discount = discountFor(customer.kind, subtotal, now);
    const total = subtotal - discount + shippingFor(order.shippingMethod, subtotal);
    const id = await this.repository.save({ email: customer.email, total, discount });
    await this.notifier.orderConfirmed(customer.email, total, discount);
    return { id, total };
  }
}
