# Plano: Aula 14 · A linha de cinco minutos que mudou o contrato

**Formato**: investigação com Lia e Téo. **Gancho**: uma decisão de produto (pedido do financeiro: "Pix só estorna
em até 90 dias"), não um bug. **Mistério**: como uma linha só no Pix pode mudar "o que todo pagamento promete"?
Fechado no fim: a linha mudou o contrato que a tela do atendimento usava, sem avisar ninguém.

**Objetivo**: escrever o contrato de um método em três partes (pré-condição, pós-condição, invariante), aplicar as
regras de substituição (pré não fica mais forte, pós não fica mais fraca, invariante continua valendo) e checar
todas as subclasses com **um único teste de contrato**.

**Frase-chave** (uma vez, no final): "Um subtipo pode exigir menos e entregar mais. Nunca o contrário."

**Regras de negócio explícitas** (ditas e escritas no código):
- contrato de `refund(value, now)` em `payment.ts`: pré = capturado e `0 < value <= amount - refunded`;
  pós = `refunded` sobe exatamente `value`; invariante = `0 <= refunded <= amount`;
- Pix: devolução só em até 90 dias (`pix.ts`);
- boleto: estorno é uma transferência em até 3 dias úteis (`boleto.ts`, que só agenda).

**Exemplo** (`examples/`, `node --test *.test.ts` → 7 testes):
- `payment.ts` (base + `CreditCardPayment`), `pix.ts` (pré mais forte), `boleto.ts` (pós mais fraca → invariante
  quebrada: dois cliques agendam R$ 160 de R$ 80), `support.ts` (tela do atendimento, escrita para qualquer `Payment`);
- `contract.ts` — `paymentContract(name, make)`: 3 testes (pré, pós, invariante) aplicáveis a qualquer subtipo;
- `contract.test.ts` — contrato no cartão (3 passam); `violations.test.ts` — as violações documentadas (4);
- `support.demo.ts` (Pix de 120 dias derruba a tela), `boleto.demo.ts` (tela mostra R$ 0,00) e
  `contract.demo.ts` (contrato nos três: 9 testes, 6 passam, 3 falham) falham de propósito.

**Analogia**: estacionamento que "aceita qualquer carro" (manobrista que só aceita automático = pré mais forte;
devolver o carro lavado = pós mais forte, ok; devolver sem a chave = pós mais fraca).
**Participação**: "Pense" (4 s) no Pix de 120 dias; "Pense" (3 s) na tela do boleto.
**Erro comum**: adaptar o teste de contrato para cada subclasse (tirar o caso dos 120 dias do Pix): tudo passa e o
atendimento continua caindo. Se a regra é real, ela entra no contrato da base (aula 16).
**Desafio**: escrever pré, pós e invariante de um método de uma classe base e rodar como teste em todas as filhas.
**Não entra**: como corrigir a hierarquia (aula 16); sinais no código (aula 15); variância de tipos.
