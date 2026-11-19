# Projeto-fio: a loja online (estado do código por módulo)

O curso inteiro acompanha o checkout de uma loja online. Cada módulo parte de um estado conhecido, para que os
módulos possam ser escritos em paralelo sem se contradizer. Valores em centavos. Regras de negócio fixas:

- **Frete**: retirada R$ 0 · padrão R$ 20 (grátis se SUBTOTAL ≥ R$ 200, antes de descontos) · expresso R$ 35 · locker R$ 9.
- **Descontos**: VIP 10% · funcionário 30% · Black Friday 20% para todos, não acumula (vale o maior).
- **E-mail** de confirmação: "Pedido confirmado! Total: R$ X (você economizou R$ Y)".

## O que já aconteceu (aulas 01–04)
- 01: `OrderService.checkout()` faz tudo (soma, desconto, frete, grava no banco, manda e-mail). Os 4 sinais:
  rigidez, fragilidade (Black Friday quebrou frete grátis), imobilidade (carrinho criava pedido), viscosidade (`dryRun`).
- 02: a regra de frete virou `shippingFor(method, subtotal)` em `shipping.ts` (coesão/acoplamento; fim do
  acoplamento temporal da variável `total`).
- 03: dependências; o teste do frete quebrava pelo provedor de e-mail (`mail-provider.ts` exige `MAIL_API_KEY`).
- 04: frete por interface `ShippingMethod { id; price(quote) }` + polimorfismo; o locker sem `break`.

## Estado no início de cada módulo

**Módulo 1 · SRP (05–08)** — parte do checkout da aula 02: `OrderService.checkout(order, customer, now)` ainda
calcula subtotal + desconto + chama `shippingFor` + `db.insert` + `mailer.send` + monta o texto do e-mail.
Termina com: `PriceCalculator` (financeiro), `shippingFor` (logística), `OrderRepository` (persistência),
`OrderNotifier` (comunicação) e um `OrderService` fino que só orquestra.

**Módulo 2 · OCP (09–12)** — parte do `PriceCalculator` do módulo 1, que tem um `if/else` de descontos
(VIP, funcionário, Black Friday). Termina com regras de desconto plugáveis (`DiscountRule`), escolha do maior
desconto, composição por funções e uma discussão de YAGNI. (O frete por interface já foi feito na aula 04 —
não repita: use descontos/promoções.)

**Módulo 3 · LSP (13–16)** — introduz PAGAMENTOS: classe base `Payment` com `authorize`, `capture`, `refund`;
subclasses `CreditCardPayment`, `PixPayment`, `BoletoPayment`, `GiftCardPayment`. Violações reais: Pix só
estorna em até 90 dias (pré-condição mais forte), boleto não tem `capture` (lança erro), gift card não estorna
para o cartão. Termina com capacidades separadas (`Refundable`, `Capturable`) e composição.

**Módulo 4 · ISP (17–18)** — parte de um `PaymentGateway` gordo (cobrar, capturar, estornar, parcelar, gerar
boleto, gerar QR Pix, chargeback, consultar status…) que o adaptador de Pix precisa implementar lançando erro.
Termina com interfaces por papel do cliente (`Charges`, `Refunds`, `Installments`…).

**Módulo 5 · DIP (19–22)** — parte do `OrderService` fino do módulo 1, mas importando classes concretas
(`PostgresOrderRepository`, `SmtpNotifier`, `MailProvider`) — volta o problema da aula 03. Termina com portas
definidas pelo domínio (`OrderRepository`, `Notifier`) implementadas pela infra, raiz de composição manual,
diferença DIP × injeção × container, e testes com dublês (fake, stub, mock) medindo tempo real.

**Módulo 6 · Tudo junto (23–24)** — junta tudo: o checkout da aula 01 refatorado com os cinco princípios, com
métricas antes/depois reais (dependências por `deps.ts`, linhas por classe, tempo dos testes); e quando NÃO aplicar
SOLID (script de 50 linhas, protótipo, desempenho). Fecha o curso.
