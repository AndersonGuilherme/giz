# Plano: Aula 13 · Um quadrado é um retângulo?

**Formato**: investigação com Lia e Téo. **Gancho**: pergunta polêmica ("um quadrado é um retângulo?") respondida
na hora por um teste falhando (`16 !== 20`). **Mistério**: se cada classe está certa sozinha, quem quebrou o código?
Fechado no fim: "na geometria, sempre; no código, só se cumprir o que o retângulo promete".

**Objetivo**: explicar por que herdar (ou implementar a mesma interface) não garante substituição, e reconhecer
que o subtipo é definido pelo **contrato de comportamento** da base, não pela relação "é um".

**Frase-chave** (uma vez, no final): "Subtipo não é quem tem os mesmos métodos. É quem cumpre as mesmas promessas."

**Regra de negócio explícita** (dita e escrita em `payment.ts`): `authorize` só reserva o valor, sem cobrar;
`capture` cobra quando o pedido é enviado; `refund` devolve o que foi cobrado. Por isso cancelar antes do envio não
devolve nada: a reserva expira.

**Exemplo** (`examples/`, `node --test *.test.ts` → 8 testes):
- `rectangle.ts` — `Rectangle` com setters (promessa: largura e altura independentes), `Square` que muda os dois
  lados, `stretch()` escrito para o retângulo; `rectangle.demo.ts` falha de propósito (`16 !== 20`);
- `fixed-rectangle.ts` — retângulo imutável: o quadrado vira subtipo perfeito (contraexemplo: depende do contrato);
- `payment.ts` — base `Payment` (authorize/capture/refund) + `CreditCardPayment`;
- `gift-card.ts` — `GiftCardPayment` debita o saldo já em `authorize` ("cartão-presente não tem reserva");
- `orders.ts` — `placeOrder`, `shipOrder`, `cancelOrder` escritos para qualquer `Payment`;
- `credit-card.test.ts` (2) e `gift-card.test.ts` (2) passam; `orders.test.ts` documenta o bug;
  `gift-card.demo.ts` falha de propósito (`6000 !== 10000`: R$ 40 somem num cancelamento antes do envio).

**Participação**: "Sim ou não?" (3 s) no gancho; "Ache o bug" (4 s) no quadrado; "Pense" (4 s) no saldo.
**Erro comum**: um `if` no cancelamento para o cartão-presente (sinal de violação; aula 15) e "trocar herança por
interface resolve" (não resolve: a interface também tem contrato).
**Desafio**: escolher uma classe filha, escrever em uma frase o que cada método da mãe promete, procurar um código
que só funciona com a mãe.
**Não entra**: pré/pós-condições formais (aula 14); como corrigir a hierarquia (aula 16).
