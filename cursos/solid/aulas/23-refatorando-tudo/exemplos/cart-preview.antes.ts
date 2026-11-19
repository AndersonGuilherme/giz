// IMOBILIDADE: a tela do carrinho só quer MOSTRAR o frete antes da compra.
// A única regra de frete que existe mora dentro do checkout, colada no banco e no e-mail.
import { OrderService, type Customer, type Order } from './order-service.v3.ts';

export function previewShipping(cart: Order, customer: Customer): number {
  return new OrderService().checkout(cart, customer).shipping;
}
