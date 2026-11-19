// O checkout ainda com o frete dentro (como antes da extração da aula 02).
import { db, mailer } from './infra.ts';

export type Order = { items: Array<{ price: number; quantity: number }>; shippingMethod: 'standard' | 'pickup' | 'express' };

export class OrderService {
  quoteShipping(order: Order): number {
    let subtotal = 0;
    for (const item of order.items) subtotal += item.price * item.quantity;
    if (order.shippingMethod === 'pickup') return 0;
    if (order.shippingMethod === 'express') return 3500;
    return subtotal >= 20000 ? 0 : 2000;
  }

  checkout(order: Order, email: string) {
    const shipping = this.quoteShipping(order);
    db.insert('orders', { shipping });
    mailer.send(email, 'Pedido confirmado!');
    return { shipping };
  }
}
