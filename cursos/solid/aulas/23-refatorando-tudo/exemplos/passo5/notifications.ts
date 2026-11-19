// Comunicação: todos os e-mails da loja. Cumpre o papel ConfirmsOrders — e outros, para outros clientes.
import { mailer } from '../infra.ts';
import { confirmationText } from './message.ts';
import type { ConfirmsOrders } from './order-service.ts';

export class Notifications implements ConfirmsOrders {
  orderConfirmed(email: string, total: number, saved: number) {
    mailer.send(email, confirmationText(total, saved));
  }
  orderShipped(email: string, trackingCode: string) {
    mailer.send(email, `Seu pedido saiu para entrega. Rastreio: ${trackingCode}`);
  }
  cartReminder(email: string) {
    mailer.send(email, 'Você esqueceu itens no carrinho!');
  }
}
