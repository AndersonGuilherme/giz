# Catálogo de cenas

O roteiro só pode usar tipos daqui. **Implementados** no motor: `talk`, `title`, `inbox`, `quote`, `chart`, `house`,
`symptoms`, `code`, `terminal`, `graph`, `versus`, `card` (objetivo/resumo/desafio/próxima). Os demais da tabela são
planejados. Cada tipo vira **um componente** no motor de vídeo, escrito uma vez
e reutilizado em todas as aulas. Isso é o que torna a produção rápida e o visual consistente.

| Tipo | O que aparece | Parâmetros no roteiro | Serve para |
|---|---|---|---|
| `talk` | Personagens grandes no centro | `cast` | gancho, transições, despedida |
| `title` | Título da aula | `eyebrow`, `title`, `subtitle` | abertura |
| `inbox` | Caixa de entrada lotando | `count`, `subject` | gancho com incidente |
| `quote` | Frase-chave em destaque | `text` | conceito |
| `chart` | Curvas desenhadas ao vivo | `curves` | contexto, custo |
| `house` | Analogia da casa | `marks` | analogia (aula 01) |
| `symptoms` | Grade 2×2 revelando itens | `items`, `shown` | conceito com lista |
| `terminal` | Comando + saída real | `command`, `lines` | teste falhando, execução |
| `graph` | Caixas e setas, setas ruins em vermelho | `nodes`, `edges`, `focusBad` | dependências |
| `versus` | ✕ errado × ✓ certo | `wrong`, `right` | erro comum |
| `code` | Editor com destaque de linhas e linhas novas em verde (diff contra outro arquivo) | `file`, `from`, `diffAgainst`, `highlight` | programação, SOLID |
| `card` | Cartão padrão: objetivo, resumo, desafio, próxima aula | `variant`, `title`, `items`, `shown` | blocos 2, 7, 8 |
| — planejados — | | | |
| `quadro` | Lousa ao lado do personagem, texto/fórmula entrando | `texto`, `destaque` | conceito, matemática |
| `analogia` | Ilustração simples do mundo real | `descricao` | modelo mental |
| `passo-a-passo` | Lista numerada que revela um item por fala | `passos`, `atual` | demonstração |
| `video-real` | Trecho filmado com o personagem narrando no canto | `arquivo`, `in`, `out` | jiu-jitsu, práticas físicas |
| `recap` | Miniaturas das aulas anteriores | `aulas` | contexto |

**Poses** (2D): `neutral`, `explain`, `point`, `wave`, `raise`, `think`.
**Expressões**: a criar (`surpreso`, `preocupado`).
**Boca**: abre conforme o volume do áudio da fala, quadro a quadro.

> Jiu-jitsu (e qualquer aula de movimento corporal): o personagem 2D/3D NÃO consegue demonstrar técnica
> com fidelidade. Use `video-real` (você filma) e o personagem narra, desenha setas e congela o quadro.
