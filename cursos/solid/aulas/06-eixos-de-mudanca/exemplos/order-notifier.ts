// Ator: COMUNICAÇÃO. O texto e o formato do e-mail de confirmação.
import { mailer, formatBRL } from './infra.ts';

// Regra da comunicação: a economia aparece em reais redondos ("R$ 21").
function wholeReais(cents: number): string {
  return Math.round(cents / 100).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
}

export class OrderNotifier {
  confirm(email: string, total: number, savings: number) {
    mailer.send(email, `Pedido confirmado! Total: ${formatBRL(total)} (você economizou ${wholeReais(savings)})`);
  }
}
