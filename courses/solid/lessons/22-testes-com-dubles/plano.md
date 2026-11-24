# Plano: Aula 22 · Seis testes, cinco segundos: pra onde vai o tempo?

**Formato**: investigação com Lia e Téo. **Gancho** (número surpreendente): seis testes de regra do checkout
levam 4,9 s (saída real). "Com seiscentos testes assim, mais de nove minutos." Nenhum deles testa banco ou e-mail.

**Objetivo**: conhecer os cinco dublês (dummy, stub, fake, spy, mock), escolher o certo para cada teste, medir o
ganho real de tempo e manter o fake honesto com um teste de contrato. Saber o risco de "mockar tudo".

**Frase-chave** (uma vez, no final): "Teste a regra sem esperar a rede. A rede ganha o teste dela."

**Regras de negócio usadas nos testes** (no código): pedido sem itens é recusado; VIP 10%; Black Friday 20%,
não acumula (vale o maior); frete grátis sobre o SUBTOTAL ≥ R$ 200, antes do desconto (R$ 200 VIP → R$ 180).

**Exemplo** (`examples/`, `node --test *.test.ts` → 16 testes, ~5 s por causa da suíte "antes"):
- `infra/latency.ts` — latência SIMULADA (120 ms por ida ao banco, 800 ms por e-mail), dita na tela como simulada;
- `checkout-infra.test.ts` — ANTES: 6 testes pela infra simulada → `duration_ms 4887` (saída real);
- `doubles.ts` — dummy (explode se usado), stub (resposta pronta), fake (`InMemoryOrderRepository`);
- `doubles-calls.ts` — spy (anota chamadas) e mock (nasce com a expectativa, falha na hora, `verify()`);
- `checkout.test.ts` — DEPOIS: os mesmos 6 comportamentos com dublês → `duration_ms 152` (quase tudo é o Node
  iniciando; cada teste < 1 ms);
- `mock.demo.ts` — mock pegando um teste errado: VIP na Black Friday economiza R$ 60 (vale o maior), não R$ 30;
- `repository-contract.ts` + `contract.test.ts` — o mesmo contrato roda contra o fake e contra o Postgres (simulado).

**Participação do aluno**: "Qual dublê?" (3 s) antes de revelar o dummy no teste do pedido sem itens.

**Pergunta difícil do Téo**: "se tudo é dublê, como sei que o Postgres funciona?" → teste de contrato; o do
adaptador real é lento e roda em menos lugares (antes de publicar).

**Erro comum**: mockar tudo. Teste que confere cada chamada interna quebra em refatoração que não muda o resultado.
Fake e stub para estado e respostas; spy e mock quando a chamada é o objetivo (avisar o cliente).

**Mistério fechado**: os cinco segundos eram espera de rede, não regra; só deu para tirá-los porque a seta foi
invertida na aula 20.

**Desafio**: medir a própria suíte (quanto é espera de rede), trocar uma peça lenta por fake/stub e escrever o
contrato que mantém o dublê honesto.

**Próxima aula**: 23 · Refatorando o sistema de pedidos inteiro (os cinco princípios juntos, com números).
