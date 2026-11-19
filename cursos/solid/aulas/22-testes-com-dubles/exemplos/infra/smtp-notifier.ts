// Detalhe que se encaixa na porta Notifier do domínio.
import type { Notifier } from '../domain/ports.ts';
import { MailProvider } from './mail-provider.ts';

const brl = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

export class SmtpNotifier implements Notifier {
  async orderConfirmed(email: string, total: number, saved: number): Promise<void> {
    const body = `Pedido confirmado! Total: ${brl(total)} (você economizou ${brl(saved)})`;
    await MailProvider.deliver(email, 'Pedido confirmado', body);
  }
}
