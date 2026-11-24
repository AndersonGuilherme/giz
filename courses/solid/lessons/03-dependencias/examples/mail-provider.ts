// O provedor de e-mail NOVO. Como muitos SDKs, ele exige a chave já no carregamento do módulo.
const apiKey = process.env.MAIL_API_KEY;
if (!apiKey) throw new Error('MAIL_API_KEY ausente: configure o provedor de e-mail');

export function deliver(to: string, body: string): void {
  // aqui iria a chamada HTTP ao provedor
  void to; void body; void apiKey;
}
