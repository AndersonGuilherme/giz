# Plano: Aula 09 · O que "fechado para modificação" quer dizer

**Formato**: investigação com Lia e Téo. **Gancho** (pergunta polêmica, não incidente): "Fechado para modificação.
Então, depois de pronta, eu nunca mais posso editar uma classe?" — respondido explicitamente no cap. 6.

**Objetivo**: explicar a diferença entre **ponto de extensão** e **editar código estável**, e que "fechado" é
fechamento contra um tipo de mudança escolhido (não "congelado").

**Retomada do módulo SRP**: o checkout virou quatro peças; o `PriceCalculator` (financeiro) só cuida de dinheiro
e tem um `if/else` de descontos.

**Regras de negócio explícitas** (ditas e escritas no código): VIP 10% · funcionário 30% · Black Friday 20% para
todos (24 a 30/11) · **não acumula: vale o maior** (escondida no `Math.max`) · pedido novo: aniversário 15% no mês
do aniversário, também sem acumular.

**Exemplo** (`examples/`, `node --test price-calculator.test.ts` → 6 testes):
- `price-calculator.ts` — estado do fim do módulo 1 (if/else de descontos);
- `price-calculator.v2.ts` — o `else if` do aniversário: o VIP para no primeiro `if` e nunca vê os 15%;
- `birthday.demo.ts` — falha de propósito (`1000 !== 1500`), mostrado na tela;
- `birthday-calculator.ts` — "estender por herança" (Meyer, 1988): funciona para um caso, explode em combinações;
- `discount-rule.ts` + `price-calculator.open.ts` + `rules.ts` — a parte estável (somar, maior, arredondar) separada
  da parte que muda (a lista de regras);
- `birthday.ts` — a regra nova como arquivo novo; a calculadora não muda.

**Participação**: "Ache o bug" (5 s) no `else if` do aniversário.
**Erro comum**: herança como forma de estender (filha da filha; cada combinação vira uma classe).
**Contraexemplos discutidos**: VIP de 10% → 12% (editar a regra é legítimo); descontos passam a acumular (muda a
parte "estável": nenhum código é fechado contra tudo).
**Ponte**: aula 04 ("estender sem modificar" no frete).
**Frase-chave** (uma vez, cap. 7): "Aberto para o caso novo, fechado para o código que já funciona."
**Desafio**: achar um arquivo que muda sempre pelo mesmo motivo, separar o que muda do que fica e desenhar o ponto
de extensão (sem codar).
**Próxima**: 10 · Promoções plugáveis (o cupom é valor fixo e não cabe numa taxa).

**Não entra nesta aula**: cupom, Dia das Mães, teto do desconto (aula 10); funções e dados (aula 11); YAGNI (aula 12).
