// Comunicação: TODOS os e-mails da loja moram aqui (um dono só: o time de comunicação).
import { mailer } from '../infra.ts';
import { confirmationText } from './message.ts';

export class Notifications {
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
