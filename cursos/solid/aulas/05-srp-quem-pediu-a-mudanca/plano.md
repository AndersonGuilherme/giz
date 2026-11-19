# Plano: Aula 05 · Quem pediu essa mudança?

**Formato**: investigação com Lia e Téo. **Gancho** (pergunta polêmica, não incidente): "uma classe deve fazer uma
coisa só, certo?" — a frase mais repetida do SOLID não é o que o princípio diz. **Mistério**: se não é "fazer uma
coisa", o que é uma responsabilidade? Fechado no fim: é perante alguém, um ator.

**Objetivo**: identificar os atores que pedem mudanças numa classe a partir do histórico de pedidos, e entender
"uma razão para mudar" como "um grupo de pessoas que pede o mesmo tipo de mudança".

**Continuidade**: abre o módulo 1. O checkout da aula 02 ainda faz tudo (só o frete saiu para `shippingFor`).

**Exemplo** (`exemplos/`, `node --test *.test.ts` → 3 testes): `order-service.ts` (checkout da aula 02),
`change-requests.ts` (8 pedidos de mudança simulados de um trimestre, com ator e trecho; `byActor`,
`actorsPerSection`), `report.ts` (`node report.ts` → saída real mostrada no terminal: 4 atores, 1 ator por trecho).

**Pistas**: (1) "uma coisa só" depende do zoom (1 coisa ou 5); (2) o histórico: 8 pedidos em 4 trechos;
(3) cada trecho recebeu pedido de um só grupo; (4) a definição de Robert C. Martin (Clean Architecture):
"um módulo deve responder a um, e só um, ator".

**Participação**: "Pense" (o checkout faz uma coisa só?) e "Quem pediu?" (o preço do expresso → logística).
**Casos difíceis**: mudança técnica (provedor de e-mail → infraestrutura, dentro do trecho do e-mail; volta no
módulo DIP); "mostrar a economia no e-mail" (número = financeiro, aparência = comunicação → gancho da aula 06);
empresa pequena (uma pessoa, vários chapéus); tamanho não é a régua (classe pequena com dois atores).
**Erro comum**: confundir SRP com "função que faz uma coisa só" e achar que ator é uma pessoa ou um cargo.
**Frase-chave**: "Não pergunte o que a classe faz. Pergunte quem pede para ela mudar."
**Desafio**: na classe que mais muda no seu projeto, ler os últimos 10 commits e anotar quem pediu cada um.
