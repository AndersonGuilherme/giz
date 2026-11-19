# Plano: Aula 08 · Sete classes, uma regra perdida

**Formato**: investigação com Lia e Téo. **Gancho** (desafio "qual das duas é melhor?", não incidente): duas versões do
mesmo cálculo de preço, mesmo resultado — A com 1 classe (16 linhas), B com 7 classes (62 linhas). Qual é a mais SOLID?
O Téo vota B (foi ele que escreveu). **Mistério** fechado no fim: A, porque tem um ator só e a regra inteira num lugar.

**Objetivo**: reconhecer SRP exagerado (fragmentação, regra espalhada, coesão perdida) e decidir o tamanho certo de
uma classe pelo ator, não pelas linhas.

**Continuidade**: parte do `PriceCalculator` extraído na aula 07. Fecha o módulo 1 e aponta para o módulo 2 (OCP):
as classes de desconto voltam quando promoção virar um eixo próprio, com a regra do maior desconto num lugar só.

**Exemplo** (`exemplos/`, `node --test *.test.ts` → 6 testes): `price-calculator.ts` (versão A), `fragmentado/`
(versão B: SubtotalCalculator, VipDiscount, EmployeeDiscount, BlackFridayDiscount, RateSum, DiscountApplier,
PriceCalculator; "vale o maior" só existe como exceções comentadas em VIP e Black Friday + uma soma),
`pedido-bf35/` (o pedido hipotético "Black Friday passa a 35%" aplicado nas duas: uma linha em cada),
`versions.test.ts` (A e B iguais hoje), `units.test.ts` (testes de cada peça de B verdes mesmo depois da mudança),
`bf35.demo.ts` (falha de propósito: B dá 30% ao funcionário, `3000 !== 3500`). Saída real de `wc -l fragmentado/*.ts`.

**Regra dita**: descontos não acumulam, vale o maior (VIP 10%, funcionário 30%, Black Friday 20%; no "e se", 35%).
**Participação**: "A ou B?" (4 s) e "Ache o bug" (4 s) no arquivo da Black Friday.
**Pistas**: (1) sete arquivos para ler um preço; (2) as sete classes respondem ao mesmo ator (financeiro);
(3) o pedido de 35% quebra B e não A; (4) a regra "vale o maior" sumiu em exceções; (5) testes unitários todos verdes —
o erro mora entre as peças; fragmentar não reduziu acoplamento, só o escondeu.
**Como decidir o tamanho**: um ator por classe (e o ator inteiro nela); uma regra, um lugar; classes que sempre mudam
juntas são uma só; classe grande com um ator → funções privadas primeiro; separar quando o histórico mostrar ator novo.
**Frase-chave**: "Responsabilidade única não é responsabilidade mínima."
**Desafio**: achar classes pequenas que sempre mudam juntas, conferir o ator, juntar e contar arquivos tocados.
