// Ator: COMUNICAÇÃO. O texto do e-mail de confirmação, movido sem mudar nada.
import { mailer, formatBRL } from './infra.ts';

export class OrderNotifier {
  confirm(email: string, total: number, savings: number) {
    mailer.send(email, `Pedido confirmado! Total: ${formatBRL(total)} (você economizou ${formatBRL(savings)})`);
  }
}
