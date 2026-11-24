// Detalhe: o provedor de e-mail (simulado, com latência). Exige a chave ao carregar.
import { wait, SMTP_SEND_MS } from './latency.ts';

const apiKey = process.env.MAIL_API_KEY;
if (!apiKey) throw new Error('MAIL_API_KEY ausente: configure o provedor de e-mail');

export const MailProvider = {
  outbox: [] as Array<{ to: string; body: string }>, // caixa de saída de teste
  async deliver(to: string, subject: string, body: string): Promise<void> {
    void subject;
    await wait(SMTP_SEND_MS); // handshake, autenticação, envio
    this.outbox.push({ to, body });
  },
};
