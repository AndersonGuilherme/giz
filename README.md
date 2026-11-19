# giz ✏️

**Transforme um roteiro em videoaula animada.** O giz gera aulas de 5–10 minutos apresentadas por dois
personagens 2D, **Lia** (mentora) e **Téo** (dev curioso), com voz sintética, legendas, código na tela e
animação sincronizada com a fala. Tudo roda **local, sem GPU e sem serviço pago**.

Você escreve o roteiro (um arquivo TypeScript com as falas e as cenas); o giz grava as vozes, mede a duração
de cada fala e anima as cenas no tempo certo. A animação nunca é cronometrada à mão: ela segue o áudio.

> Exemplo completo no repositório: o curso **SOLID** (24 aulas) em [`cursos/solid`](cursos/solid).

## Como funciona

```
roteiro.ts ──► voz (Kokoro, uma faixa por fala) ──► linha do tempo ──► Remotion ──► aula-NN.mp4 + legendas.srt
   └── exemplos/ (código mostrado na tela, com testes)
```

| Peça | Ferramenta | Licença |
|---|---|---|
| Animação e render | [Remotion](https://remotion.dev) 4 | grátis para pessoa física ou empresa de até 3 pessoas; acima disso, licença paga |
| Voz | Kokoro-82M (`kokoro-js`, CPU) | Apache-2.0 |
| Fonética pt-BR | espeak-ng (`@echogarden/espeak-ng-emscripten`) | GPL-3.0 (ferramenta) |

## Requisitos

- **Node.js 22.18 ou mais novo** (roda TypeScript direto, sem build)
- ~2 GB de disco para as dependências; Linux, macOS ou WSL

## Passo a passo: criando seu curso

### 1. Instale

```bash
git clone https://github.com/AndersonGuilherme/giz.git
cd giz/motor
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install
```

Teste com uma aula pronta (a primeira execução baixa o modelo de voz, ~90 MB):

```bash
npm run render -- ../cursos/solid/aulas/01-por-que-codigo-apodrece
```

O vídeo sai em `cursos/solid/aulas/01-por-que-codigo-apodrece/render/aula-01.mp4`.

### 2. Leia os padrões (10 minutos que economizam horas)

| Arquivo | O que ensina |
|---|---|
| [`padrao/estrutura-da-aula.md`](padrao/estrutura-da-aula.md) | os 8 capítulos fixos de toda aula (formato "investigação") |
| [`padrao/como-escrever-uma-aula.md`](padrao/como-escrever-uma-aula.md) | todos os campos do roteiro e as cenas disponíveis |
| [`personagens/guia-editorial.md`](personagens/guia-editorial.md) | personalidade e regras de diálogo de Lia e Téo |
| [`padrao/licoes-aprendidas.md`](padrao/licoes-aprendidas.md) | erros que já aconteceram e como evitá-los |

### 3. Crie a pasta do curso

```bash
cp -r _template/curso cursos/meu-curso
mkdir -p cursos/meu-curso/aulas
echo '{}' > cursos/meu-curso/pronuncia.json
```

Preencha `curso.yaml` e `plano-do-curso.md`: resultado final, público, **projeto-fio** (um exemplo que
atravessa o curso inteiro) e a lista de aulas.

### 4. Crie cada aula

Cada aula fica em `cursos/<curso>/aulas/NN-slug/`:

```
cursos/meu-curso/aulas/01-minha-primeira-aula/
├── plano.md      objetivo, mistério, exemplo, erro comum, desafio (modelo em _template/aula/plano.md)
├── roteiro.ts    as falas + as cenas (fonte única da narração E da animação)
└── exemplos/     código que aparece na tela, com testes que passam
```

O jeito mais rápido é copiar um roteiro existente e adaptar:

```bash
mkdir -p cursos/meu-curso/aulas/01-minha-primeira-aula/exemplos
cp _template/aula/plano.md cursos/meu-curso/aulas/01-minha-primeira-aula/
cp cursos/solid/aulas/01-por-que-codigo-apodrece/roteiro.ts cursos/meu-curso/aulas/01-minha-primeira-aula/
```

No `roteiro.ts`, ajuste `course: 'meu-curso'`, `number: '01'`, `slug`, `title`, `chapters` e reescreva as `cues`.
Uma fala tem esta cara:

```ts
{
  id: '003', chapter: 1, speaker: 'teo',
  text: 'Três mil e-mails [em dez minutos]. Alguém sabe o que aconteceu?',
  say:  'Três mil iméios [em dez minutos]. <pausa 0.3> Alguém sabe o que aconteceu?', // opcional: só para a voz
  pose: 'shrug', expr: 'surprised', look: 'viewer',
  react: { expr: 'thinking', look: 'other' },          // reação de quem escuta
  scene: { kind: 'inbox', count: 3000, subject: 'Pedido confirmado!' },
  beats: [{ count: 3000, sfx: 'pop' }],                 // um beat por [trecho]
}
```

> **Dica:** peça para uma IA (Claude, por exemplo) escrever o `plano.md` e o `roteiro.ts` passando
> `padrao/como-escrever-uma-aula.md`, o guia editorial e um roteiro de exemplo. Você revisa o conteúdo técnico.

### 5. Valide antes de gerar voz

```bash
cd cursos/meu-curso/aulas/01-minha-primeira-aula/exemplos && node --test   # exemplos passam
cd ~/giz/motor                                                             # ajuste para onde clonou
npx tsc --noEmit                                                           # o roteiro tipa
node scripts/lesson.ts build ../cursos/meu-curso/aulas/01-minha-primeira-aula   # duração estimada
```

O aviso "sem áudio atualizado" é esperado nesta etapa.

### 6. Pré-visualize e renderize

```bash
npm run studio                                                    # editor visual no navegador
npm run render -- ../cursos/meu-curso/aulas/01-minha-primeira-aula   # voz + build + MP4
```

Saídas em `render/`: `aula-NN.mp4` e `legendas.srt` (pronta para o YouTube).

### 7. Ajuste e regrave só o que mudou

- Palavra pronunciada errado? Adicione em `cursos/<curso>/pronuncia.json` (`"Postgres": "pôust grés"`).
- Mudou uma fala? `npm run render` regrava **apenas** as falas alteradas (hash por fala).
- Regravar falas específicas: `npm run tts -- <pasta-da-aula> 012 013`.

## Personalizando

| Quero… | Onde |
|---|---|
| mudar voz, ritmo ou cores dos personagens | [`motor/src/cast.ts`](motor/src/cast.ts) |
| mudar cores/tema dos vídeos | [`motor/src/theme.ts`](motor/src/theme.ts) |
| criar um tipo de cena novo | `motor/src/types.ts` → `motor/src/scenes.tsx` → `SCENES` em `motor/src/Lesson.tsx` → [`padrao/catalogo-de-cenas.md`](padrao/catalogo-de-cenas.md) |
| trocar o motor de voz (ElevenLabs, Azure…) | [`motor/scripts/tts.ts`](motor/scripts/tts.ts) |

Detalhes técnicos do motor: [`motor/README.md`](motor/README.md).

## Estrutura

```
giz/
├── motor/          motor de vídeo (Remotion + voz Kokoro)
├── padrao/         formato da aula, catálogo de cenas, guia de escrita
├── personagens/    Lia e Téo: guia editorial e ficha visual
├── _template/      modelos de curso e de aula
└── cursos/solid/   curso de exemplo (24 aulas)
```

Áudios e vídeos gerados não vão para o git (são regenerados pelo `npm run render`).

## Limitações conhecidas

- Vozes do Kokoro em pt-BR são boas, mas não de estúdio; não há controle de emoção na voz.
- Personagens 2D não demonstram movimentos físicos com fidelidade (para isso, grave vídeo real).

## Licença

Código sob [MIT](LICENSE). Respeite também as licenças das dependências (veja a tabela acima, em especial a do Remotion).
