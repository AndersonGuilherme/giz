// A decisão do time (aula 19): trocar o SMTP por um provedor via API.
// Mais um detalhe que se encaixa na MESMA porta. O domínio não muda.
import type { Notifier } from '../domain/ports.ts';

const brl = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

export class ApiNotifier implements Notifier {
  async orderConfirmed(email: string, total: number, saved: number): Promise<void> {
    await fetch('https://api.provedor-de-email.exemplo/v1/messages', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.MAIL_API_KEY}` },
      body: JSON.stringify({
        to: email,
        text: `Pedido confirmado! Total: ${brl(total)} (você economizou ${brl(saved)})`,
      }),
    });
  }
}
