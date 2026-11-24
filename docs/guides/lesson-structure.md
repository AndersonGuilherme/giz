# Estrutura fixa de toda aula

Toda aula é um **episódio de investigação** de 5 a 10 minutos com Lia e Téo (ver
[`core/casts/example/editorial-guide.md`](../../core/casts/example/editorial-guide.md)). Vale para SOLID, matemática do fundamental,
Python ou jiu-jitsu: muda o mistério, não o formato.

| # | Capítulo | Tempo (aula de ~5 min) | Função pedagógica | Cena típica |
|---|---|---|---|---|
| 1 | **O desastre** | 0:00–0:25 | Gancho: o problema aparece em até 8 s e vira uma pergunta | `inbox`, `code`, `title` |
| 2 | **O suspeito** | 0:25–1:10 | Contexto: o objeto de estudo e por que ele "parece certo" | `code`, `terminal` (testes passando), `symptoms` vazio |
| 3–6 | **As pistas** | 1:10–3:50 | Conceito + demonstração: cada pista é um conceito, descoberto num caso concreto | `card` (pedido/regra), `code` com diff, `terminal`, `graph` |
| — | **A pausa** | dentro de uma pista | O aluno tenta achar antes da revelação | `hold` de 2–3 s |
| — | **A solução tentadora** | última pista | Erro comum: a ideia boa que piora as coisas | `code` com diff |
| 7 | **A lição** | 3:50–4:30 | Resumo: o padrão por trás das pistas + a frase-chave (uma vez) | `symptoms` com foco, `versus`, `quote` |
| 8 | **Desafio** | 4:30–4:50 | Exercício para agora + gancho da próxima aula | `card` challenge/next, `talk` |

Os nomes dos capítulos são definidos pela aula (`chapters` no `roteiro.ts`) e aparecem na barra de progresso.

## Regras de didática

- Um conceito central por aula; as pistas são facetas dele.
- Todo conceito aparece primeiro num caso concreto e só depois ganha nome ("isso tem nome: **rigidez**").
- O mistério aberto no capítulo 1 é respondido aos poucos e fechado explicitamente ("agora os três mil e-mails
  fazem sentido").
- Uma descoberta a cada 10–20 s; tela nunca parada mais de ~6 s sem uma ação (destaque, reação, revelação).
- Código na tela roda de verdade e tem teste em `examples/`; saídas de terminal na tela são copiadas de execuções reais.
