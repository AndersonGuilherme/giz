# Plano: Aula 24 · Quando quebrar as regras

**Formato**: episódio de investigação com Lia e Téo (ver `padrao/estrutura-da-aula.md`). Última aula do curso.
**Gancho** (decisão polêmica, não incidente): empolgado com a aula 23, Téo aplicou os cinco princípios no script do
relatório do financeiro: de 12 linhas em 1 arquivo para 51 linhas em 7. Lia pergunta quantas vezes o script mudou no
último ano. Resposta: nenhuma. **Mistério**: se ele fez tudo "certo", por que esse código ficou pior?

**Objetivo**: ao final, o aluno consegue **decidir quando NÃO aplicar SOLID (script pequeno e estável, protótipo
descartável, laço de desempenho crítico, equipe/prazo) usando uma pergunta só: essa mudança vai acontecer, e quanto
ela custa?** — e sabe que, no caso de desempenho, o primeiro passo é medir.

**Frase-chave** (uma vez, no final): "SOLID é ferramenta, não religião. Use onde a mudança custa caro."

**Regras explícitas**: o script tem um dono (financeiro), roda toda noite e não mudou em um ano (cenário simulado);
descontos não acumulam, vale o maior (mesma regra da loja, usada no laço quente).

**Exemplo concreto** (`exemplos/`, `node --test *.test.ts` → 8 testes):
- `relatorio.ts` — o script original (12 linhas de código, função pura `toCsv` + 3 linhas de execução);
- `relatorio-solid/` — a versão "com os cinco princípios": 4 portas, 5 classes, raiz de composição (51 linhas, 7 arquivos);
- `relatorio.test.ts` — as duas versões dão o MESMO CSV (`pedidos.json`);
- `hot-path.ts` — recalcular 1 milhão de preços: regras plugáveis por item × as mesmas regras na borda × escrito à mão;
- `bench.ts` — tempo real (rodado e copiado: 86,3 ms × 1,5 ms × 1,5 ms); `desempenho.test.ts` — os três dão o mesmo total;
- `linhas.ts` — o contador da aula 23.

**Revelação do laço quente**: o custo não era a abstração, era perguntar às regras um milhão de vezes algo que não muda
por item. As mesmas regras plugáveis, decididas uma vez na borda, empatam com o código à mão. Quando a regra muda a cada
item num laço desses, escrever à mão pode valer, com a medição na mão.

**Protótipo**: data de validade escrita; se sobreviver, ganha a rede de testes e os passos da aula 23.
**Equipe e prazo**: dívida consciente: decidida em voz alta, regras com teste, data para pagar; o desenho certo é o
que a equipe consegue manter.

**Pergunta difícil do Téo**: "Então desempenho é desculpa?" (quase sempre; meça) e "Depois de 23 aulas, você vai me
dizer pra não usar SOLID?" (aberta na aula 23, respondida aqui).

**Participação do aluno**: pausa "Qual você aprova?" logo depois do gancho.

**Encerramento do curso**: recapitulação dos 24 episódios em poucas falas (cartão por módulo), desafio final (a
pergunta da régua aplicada a um arquivo real), cartão "O que estudar agora" (testes e TDD, refatoração, Object
Calisthenics, Clean Architecture) e despedida. Fecha o café da aposta da aula 23.
