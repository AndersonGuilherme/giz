// Detalhe: manda o e-mail de confirmação pelo provedor SMTP.
import { MailProvider } from './mail-provider.ts';

const brl = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

export class SmtpNotifier {
  async orderConfirmed(email: string, total: number, saved: number): Promise<void> {
    const body = `Pedido confirmado! Total: ${brl(total)} (você economizou ${brl(saved)})`;
    await MailProvider.deliver(email, 'Pedido confirmado', body);
  }
}
