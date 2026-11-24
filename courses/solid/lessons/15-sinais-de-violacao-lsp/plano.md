# Plano: Aula 15 · Sete linhas que denunciam uma herança quebrada

**Formato**: investigação com Lia e Téo. **Gancho**: um número (uma busca de dez segundos no código de pagamentos
devolve 7 resultados, com todos os testes passando) + "ainda falta o pior sinal, que busca nenhuma acha".
**Mistério**: o que essas sete linhas têm em comum, e qual é o sinal invisível? Fechado no fim: "não eram sete
problemas, era um só, vazando em sete lugares"; o invisível é o override vazio.

**Objetivo**: reconhecer no código real os quatro sinais de violação de Liskov (perguntar o tipo, "não suportado",
override que ignora/devolve null, comentário "não chame"), ligar cada um a pré/pós-condição da aula 14 e saber
quando `instanceof` NÃO é sinal (na borda: tipos de erro, dado vindo de fora).

**Frase-chave** (uma vez, no final): "Quando quem usa precisa saber qual subtipo chegou, o subtipo já não substitui."

**Regras de negócio explícitas**: boleto é confirmado pelo banco (não tem captura); Pix estorna em até 90 dias;
estorno de cartão-presente é manual (financeiro). Recusa de cartão faz parte do contrato da base (não é sinal).

**Exemplo** (`examples/`, `node --test *.test.ts` → 5 testes):
- `loja/` — o código "consertado às pressas" das aulas 13–14: `payment.ts` (comentários ATENÇÃO), `methods.ts`
  (Pix com prazo, boleto que lança "não suporta captura", cartão-presente com `refund` vazio), `orders.ts` e
  `support.ts` (`instanceof`), `receipt.ts` (`switch (payment.constructor.name)`), e dois códigos NOVOS escritos só
  com a base: `jobs.ts` (captura noturna) e `returns.ts` (devolução de produto);
- `sinais.txt` — padrões da busca (`grep -rnoEf sinais.txt loja/` → 7 linhas, saída real na tela);
- `signs.test.ts` — os sinais documentados (5 passam);
- `jobs.demo.ts` (`Error: boleto não suporta captura`) e `returns.demo.ts` (`0 !== 5000`) falham de propósito.

**Participação**: "Ache o sinal" (3 s) no `receipt.ts` (switch pelo nome da classe, sem `instanceof`).
**Erro comum**: "lançar erro é honesto" (é, mas é a pré-condição mais forte possível) e "documentei no comentário"
(contrato que compilador e teste não leem). Falso alarme: `instanceof` na borda; override que chama a base e
acrescenta um log (entrega mais).
**Desafio**: rodar a busca no próprio projeto (instanceof/switch por tipo, "não suportado", "não chame") e procurar
à mão overrides vazios ou que devolvem null.
**Não entra**: a correção da hierarquia (aula 16).
