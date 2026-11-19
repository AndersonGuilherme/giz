// Tentativa: o serviço usa uma interface. Mas de quem é essa interface?
import { subtotalOf, discountFor, type Item, type CustomerKind } from './pricing.ts';
import { shippingFor, type ShippingMethod } from './shipping.ts';
import type { IPostgresOrderRepository } from '../infra/order-repository.ts';

export type Order = { items: Item[]; shippingMethod: ShippingMethod };
export type Customer = { email: string; kind: CustomerKind };

export class OrderService {
  private repository: IPostgresOrderRepository;

  constructor(repository: IPostgresOrderRepository) {
    this.repository = repository;
  }

  async checkout(order: Order, customer: Customer, now: Date) {
    const subtotal = subtotalOf(order.items);
    const total = subtotal - discountFor(customer.kind, subtotal, now)
      + shippingFor(order.shippingMethod, subtotal);
    const result = await this.repository.insertOrderRow(customer.email, total);
    return { id: result.rows[0].id, total };
  }
}
