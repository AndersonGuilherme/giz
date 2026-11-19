# Plano: Aula 16 · Quatro arquivos para um pagamento novo?

**Formato**: investigação com Lia e Téo. **Gancho**: um pedido de produto (carteira digital) e uma conta para o aluno
("no código da aula passada, quantos arquivos você teria que abrir?" → 4). **Mistério**: dá para um pagamento novo
entrar sem mexer em quem usa? Fechado no fim com a mesma tabela: 4 arquivos → 1, e um teste que confere.

**Objetivo**: refatorar a hierarquia de pagamentos para respeitar Liskov: base mínima (`method`, `amount`),
capacidades separadas e opcionais (`Capturable`, `Refundable`) montadas por composição, prazo do Pix declarado no
contrato (`canRefund`), clientes sem `instanceof` e um teste de contrato por capacidade passando para todos.

**Frase-chave** (uma vez, no final): "Não force um subtipo a prometer o que ele não cumpre. Deixe cada um declarar só
o que sabe fazer."

**Regras de negócio explícitas**: só o cartão (e a carteira digital) captura em duas etapas; Pix devolve em até
90 dias; boleto devolve por transferência agendada (o estorno é registrado na hora); cartão-presente não devolve
dinheiro (vira crédito na loja); carteira digital estorna em até 180 dias (pedido simulado).

**Exemplo** (`exemplos/`, `node --test *.test.ts` → 24 testes):
- `payment.ts` — `Payment { method; amount; capture?; refunds? }`, contratos de `Capturable` e `Refundable`
  (pré/pós/invariante escritos);
- `capabilities.ts` — peças: `TwoStepCapture`, `RefundLedger` (trava do valor + prazo + como devolver);
- `methods.ts` — `creditCard`, `pix`, `boleto`, `giftCard` montam só as peças que têm; `wallet.ts` — pagamento novo,
  sem tocar em nenhum outro arquivo;
- `orders.ts` (`payment.capture?.capture(now)`), `support.ts` (atendimento + política do comprovante pelo contrato);
- `contract.ts` — `refundableContract` (4 testes) e `capturableContract` (1); `contract.test.ts` aplica a todos
  (18 passam); `orders.test.ts` — quem usa, com os cinco pagamentos (6 passam: dois cliques no boleto não agendam
  duas transferências, Pix aos 120 dias oferece crédito sem quebrar, etc.);
- `broken.demo.ts` — `Refundable` com estorno vazio: o contrato pega (1 passa, 3 falham, de propósito);
- `antes/` — cópia do código da aula 15, para conferir a conta dos 4 arquivos.

**Participação**: "Conte" (4 s) no gancho; "Pense" (3 s) antes do `broken.demo.ts`.
**Erro comum / perguntas difíceis do Téo**: "`if (!r)` não é o `instanceof` com outro nome?" (não: pergunta pela
capacidade, que está no contrato e vale para pagamentos futuros); "o `canRefund` deixa a pré-condição mais forte para
todo mundo?" (sim, e por isso fica na base, à vista; o que quebra é mudar escondido); "por que não uma classe mãe
que estorna?" (funciona se cada filha só herdar o que cumpre; composição evita a árvore).
**Ponte**: quebrar um contrato grande em capacidades pequenas → aula 17, interfaces gordas (ISP).
**Desafio**: pegar a hierarquia caçada na aula 15, montar a tabela do que cada filha faz de verdade, separar em
capacidades e rodar um contrato por capacidade.
