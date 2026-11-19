# Como escrever uma aula (kit de autoria)

Leia antes: `personagens/guia-editorial.md` (Lia e Téo), `padrao/estrutura-da-aula.md` (capítulos),
`padrao/licoes-aprendidas.md` (o que já deu errado), `padrao/projeto-fio.md` (estado do código da loja).
Exemplos completos: `cursos/solid/aulas/01-*` a `04-*` (leia pelo menos um `roteiro.ts` inteiro).

## Pasta de uma aula

```
cursos/solid/aulas/NN-slug/
├── plano.md          objetivo, mistério, regra de negócio, exemplo, erro comum, desafio
├── roteiro.ts        export const lesson: Lesson (tipos em motor/src/types.ts)
└── exemplos/         código que aparece na tela: *.ts com testes (*.test.ts) que PASSAM;
                      *.demo.ts = testes que falham DE PROPÓSITO para mostrar na tela
```
Cada aula é autocontida: copie `infra.ts` e o que precisar de aulas anteriores para dentro de `exemplos/`.
Imports com extensão `.ts` (Node 22 roda TypeScript direto). Valores em centavos.

## O roteiro (`roteiro.ts`)

```ts
import type { Lesson } from '../../../../motor/src/types.ts';
export const lesson: Lesson = {
  course: 'solid', number: 'NN', slug: '...', title: 'Título-gancho da aula',
  chapters: ['…', '…'],            // 6–8 nomes curtos (aparecem na barra de progresso)
  cues: [ /* falas */ ],
};
```

Cada fala (cue):

| campo | uso |
|---|---|
| `id` | '001', '002'… |
| `chapter` | 1-based, índice em `chapters` |
| `speaker` | `'lia'` ou `'teo'` |
| `text` | legenda (o que se diz). `[trecho]` marca um beat |
| `say` | opcional: versão para a voz (pronúncia, `<pausa 0.3>`). Se tiver `[trecho]`, os beats seguem o `say` |
| `pose` | neutral · explain · point · wave · raise · think · shrug · celebrate |
| `expr` | neutral · happy · excited · surprised · confused · thinking · skeptical · concerned |
| `look` | 'viewer' (fala com o aluno) · 'other' (com o colega) · 'content' (padrão em cena de conteúdo) |
| `react` | `{ expr, pose, look }` de quem ESCUTA (sempre preencha nas falas importantes) |
| `scene` | nova cena (ausente = continua a anterior, com o estado final dela) |
| `set` | muda campos da cena no início da fala (ex.: `{ highlight: [] }`, `{ focus: 2 }`) |
| `beats` | um objeto por `[trecho]`: campos da cena + `sfx` + `expr`/`pose` de quem fala |
| `hold` | `{ seconds, label }` pausa com contagem DEPOIS da fala (ex.: "Ache o bug") |
| `read` | pausa de leitura de código (automática em cena de código nova); número = segundos; `false` desliga |
| `sfx` | efeito no início: pop · ding · dings · error · success · tick (whoosh é automático na troca de cena) |

O número de `[trechos]` tem que ser igual ao de `beats` (o build acusa).

## Cenas disponíveis (não invente outras)

| `kind` | campos |
|---|---|
| `title` | `eyebrow`, `title`, `subtitle?` — use `eyebrow: 'Téo e Lia explicam SOLID · Aula NN'` |
| `talk` | (nenhum) — Lia e Téo grandes no centro |
| `inbox` | `count`, `subject`, `note?` (use `note: 'Cenário simulado para fins didáticos'` se o caso é inventado) |
| `card` | `variant` (objective · summary · challenge · next · ticket · rule), `title`, `items[]`, `shown?` |
| `quote` | `text` (use `\n` para quebrar) |
| `chart` | `xLabel`, `yLabel`, `curves: ('healthy'\|'rotten')[]` |
| `symptoms` | `items: {name, desc}[]` (4 itens, grade 2×2), `shown`, `focus?` |
| `code` | `file` (em exemplos/), `from?` (texto da 1ª linha), `title?`, `diffAgainst?` (linhas novas em verde), `highlight?: string[]` (destaca linhas que CONTÊM o texto) |
| `terminal` | `command`, `lines: {text, tone?: 'fail'\|'ok'\|'muted'}[]` — saída REAL, linhas de até ~52 caracteres |
| `graph` | `nodes: {id,label,x,y,tone?}[]` (x,y em % 0–100; tone core·infra·ui·soft), `edges: {from,to,bad?}[]`, `focusBad?` |
| `versus` | `wrong: {title,text}`, `right: {title,text}` |
| `table` | `title?`, `columns[]`, `rows: {label, cells[]}[]`, `shownRows?`, `highlightCol?`, `highlightRow?` — célula `'●'` vira marca; 'Sim'/'Não' e '✕…'/'✓…' ganham cor |

Código na tela: até ~26 linhas (use `from` para pular imports/comentários). Linhas muito longas encolhem a fonte.

## Validar (obrigatório, nesta ordem)

```bash
cd cursos/solid/aulas/NN-slug/exemplos && node --test *.test.ts      # tudo passa
cd ../../../../motor && npx tsc --noEmit                                  # roteiro tipa
node scripts/lesson.ts build ../cursos/solid/aulas/NN-slug               # monta; duração estimada 5–7 min
```
O build sem áudio usa duração estimada (aviso "sem áudio atualizado" é esperado). Voz, controle de qualidade
(Whisper) e render são feitos depois, em lote.
