// Detalhe: o provedor de e-mail da aula 03. Exige a chave já no carregamento do módulo.
const apiKey = process.env.MAIL_API_KEY;
if (!apiKey) throw new Error('MAIL_API_KEY ausente: configure o provedor de e-mail');

export const MailProvider = {
  async deliver(to: string, subject: string, body: string): Promise<void> {
    void to; void subject; void body; void apiKey; // aqui iria a chamada SMTP
  },
};
