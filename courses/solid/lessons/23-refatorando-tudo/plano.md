# Plano: Aula 23 · Cinco refatorações, nenhum teste vermelho

**Formato**: episódio de investigação com Lia e Téo (ver `docs/guides/lesson-structure.md`).
**Gancho** (aposta, não incidente): Téo aposta um café que o checkout da aula 01 não sobrevive a cinco refatorações
seguidas sem quebrar. **Mistério**: dá para mudar o desenho inteiro sem mudar nenhum resultado? E o que melhora de
verdade, em números? Fecha de vez o caso dos três mil e-mails.

**Objetivo**: ao final, o aluno consegue **refatorar um método que faz tudo aplicando os cinco princípios em
sequência (SRP → OCP → LSP → ISP → DIP), um passo pequeno por vez, protegido por um contrato de testes**, e medir
o antes e o depois com números reais.

**Frase-chave** (uma vez, no final): "Refatorar é mudar o desenho sem mudar o comportamento. Um passo verde de cada vez."

**Regras de negócio explícitas** (ditas e escritas em `contrato.ts`): frete grátis para SUBTOTAL a partir de R$ 200,
antes de descontos; padrão R$ 20; expresso R$ 35; descontos VIP 10%, funcionário 30%, Black Friday 20%, não acumulam
(vale o maior); e-mail "Pedido confirmado! Total: R$ X (você economizou R$ Y)". Novo: o frete no mesmo dia (aula 04)
só atende até 15 km da loja.

**Exemplo concreto** (`examples/`, `node --test *.test.ts` → 53 testes):
- `order-service.v3.ts`, `order-service.v4.ts`, `cart-preview.antes.ts` — copiados da aula 01;
- `infra.ts` — a da aula 01, simulando a rede (20 ms por gravação, 40 ms por e-mail; aviso no código e na fala);
- `contrato.ts` — a rede de proteção: 7 regras da loja como testes, rodadas contra cada versão;
- `rede.demo.ts` — o contrato contra a v4 original: 2 falham (VIP e Black Friday perdem o frete grátis);
- `order-service.v5.ts` — o conserto ANTES de refatorar, num passo separado: uma palavra (`total` → `subtotal`);
- `passo1/` SRP: `pricing.ts` (financeiro), `shipping.ts` (logística), `order-repository.ts`, `notifications.ts`
  (comunicação, com os 3 e-mails da loja), `message.ts`; o `dryRun` some porque o carrinho chama o frete direto;
- `passo2/` OCP: descontos como `DiscountRule[]` (vale o maior) e fretes como objetos; entra o `sameDay`, que lança
  erro além de 15 km (herdado da aula 04);
- `passo3/` LSP: `available(quote)` no contrato do frete; `lsp.demo.ts` mostra o passo 2 falhando o contrato,
  `frete.test.ts` mostra o passo 3 passando; o checkout NÃO muda (diff só no comentário);
- `passo4/` ISP: o checkout declara `ConfirmsOrders` (1 método dos 3 de `Notifications`);
- `passo5/` DIP: portas `SavesOrders` e `ConfirmsOrders` no checkout, infra implementa, `main.ts` compõe;
- `passos.test.ts` — o mesmo contrato contra v5 e os cinco passos (42 testes; ~500 ms por versão com infra,
  ~3 ms no passo 5 com dublês);
- `sinais.test.ts` — os quatro sinais da aula 01, um teste cada, contra o código final;
- `integracao.test.ts` — a infra real continua testada, uma vez, pela raiz de composição;
- `deps.ts` (da aula 19) e `linhas.ts` — métricas reais.

**Métricas reais** (copiadas das execuções): checkout 27 linhas → 103 no total (8 arquivos); método `checkout`
21 → 9 linhas; setas do checkout para a infra 1 → 0; contrato 504 ms → 2,2 ms; carrinho: 2 dependências
(passando pelo checkout e pela infra) → 1 (só `shipping.ts`).

**Pergunta difícil do Téo**: "A gente conserta o bug durante a refatoração?" (não: passo separado) e "quatro vezes mais
linhas é melhoria?" (SOLID não promete menos código; promete mudança mais barata). Também: "e o banco de verdade,
ninguém testa mais?" (um teste de integração na raiz de composição).

**Participação do aluno**: pausa "Quantos atores?" antes de revelar os quatro donos do checkout.

**Desafio**: escrever a rede (regras viram testes), escolher um princípio e dar um passo, rodar os testes; verde → próximo.

**Não entra nesta aula**: quando NÃO aplicar (aula 24); containers de injeção (aula 21).
