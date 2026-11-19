# Plano: Aula 07 · Refatorar na sexta à tarde?

**Formato**: investigação com Lia e Téo. **Gancho** (decisão, não incidente): sexta, 16h, Black Friday na semana
seguinte — cortar o checkout de produção em quatro classes agora ou esperar? **Mistério**: o que torna isso seguro?
Fechado no fim: "com a rede armada e passos pequenos, pode; sem rede, nem na segunda de manhã".

**Objetivo**: refatorar para o desenho da aula 06 sem mudar comportamento: testes de caracterização primeiro (pela
porta da frente, copiando a saída real), uma extração por vez, testes a cada passo, mudança de comportamento em
passo separado.

**Exemplo** (`exemplos/`, `node --test *.test.ts` → 17 testes): `order-service.step0.ts` → `step1` (PriceCalculator)
→ `step2` (OrderRepository) → `step3` (OrderNotifier; o serviço só orquestra). `characterization.ts` define os 4 testes
(preço VIP R$ 188,82; Black Friday R$ 210 → R$ 168 com frete grátis; linha gravada; texto exato do e-mail com
` `). `characterization.test.ts` roda em todos os passos (`STEP=n` roda um só — saídas reais na tela).
`price-calculator.test.ts`: teste próprio do preço depois da extração.
Demos que falham de propósito: `email-guess.demo.ts` (o espaço inseparável depois de "R$"; o Node mostra `^` sob
a diferença) e `step1-wrong.demo.ts` (o PriceCalculator sem a data perdeu a Black Friday: `total 21000 ≠ 16800`).

**Participação**: "Ache a diferença" (4 s) entre as duas linhas aparentemente iguais.
**Pistas**: (1) refatorar = estrutura muda, comportamento não; (2) caracterização registra o que o código FAZ;
(3) o palpite errado (espaço inseparável); (4) o passo 1 quebrado expõe o acoplamento escondido com a data (aula 02);
(5) passos 2 e 3 verdes; classes novas ganham teste próprio.
**Erro comum**: reescrever do zero (perde os detalhes que ninguém lembra) e misturar refatoração com o pedido novo
(a economia em reais redondos da aula 06 entra depois, como passo separado: só o teste do e-mail pode mudar).
**Frase-chave**: "Primeiro a rede. Depois, um passo de cada vez."
**Desafio**: num método grande do seu projeto, 3 testes de caracterização com a saída real e uma extração.
