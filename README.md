# giz ✏️

**Transforme um roteiro em videoaula animada.** O giz gera aulas de 5 a 10 minutos apresentadas por dois
personagens 2D, **Lia** (mentora) e **Téo** (dev curioso), com voz sintética, legendas, código na tela e
animação sincronizada com a fala.

Você escreve o roteiro (um arquivo com as falas e as cenas). O giz grava as vozes, mede quanto dura cada fala
e anima as cenas no tempo certo. A animação nunca é cronometrada à mão: ela segue o áudio.

> Exemplo completo no repositório: o curso **SOLID** (24 aulas) em [`cursos/solid`](cursos/solid).

## Preciso pagar alguma IA?

**Não.** Tudo roda no seu computador, sem GPU, sem conta e sem chave de API. Veja o que cada parte usa:

| Parte | O que usa | É IA? | Custo |
|---|---|---|---|
| **Escrever o roteiro** | Você. Opcionalmente, uma IA de texto (Claude, ChatGPT, Gemini…) | opcional | o da IA que você escolher, se escolher |
| **Voz** | [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) 0.6B ou 1.7B, modelo aberto da Alibaba, na CPU ou na GPU NVIDIA | sim | grátis (Apache-2.0, uso comercial livre) |
| **Animação e vídeo** | [Remotion](https://remotion.dev): desenha cada quadro com código React | **não** | grátis para pessoa física e empresa de até 3 pessoas; acima disso, licença paga do Remotion |
| **Boca dos personagens** | espeak-ng: converte o texto em fonemas e cada fonema vira uma forma de boca | não | grátis |
| **Conferir a pronúncia** (opcional) | Whisper small, modelo aberto da OpenAI, roda local | sim | grátis (MIT) |

- **A animação não é gerada por IA.** Os personagens, as poses, as expressões e as cenas (código, terminal,
  gráficos, cartões) são componentes programados em [`motor/src`](motor/src). O roteiro diz *o que* acontece; o motor
  desenha sempre do mesmo jeito. Por isso o visual é consistente e não "alucina".
- **Voz e vídeo são etapas separadas.** O Qwen3-TTS gera os arquivos de áudio de cada fala; depois o Remotion
  monta o vídeo, desenhando os personagens e as cenas no ritmo desses áudios. O Remotion não gera voz.
- **Os modelos de IA são baixados sozinhos** do Hugging Face no `npm run setup` (5,9 GB ou 13,4 GB para a voz, conforme o modelo escolhido; ~250 MB
  para o Whisper, se usar). Depois disso, tudo funciona offline.
- **Você não precisa do Claude** nem de nenhuma IA paga. O roteiro é um arquivo TypeScript que você pode
  escrever à mão a partir do modelo. Uma IA de texto só acelera essa etapa (veja a dica no passo 4).

## Requisitos

- **Node.js 22.18 ou mais novo** (roda TypeScript direto, sem build)
- **Disco:** ≈2 GB de dependências + 5,9 GB (modelo 0.6b) ou 13,4 GB (modelo 1.7b); +1,8 GB com GPU
- **Memória:** modelo 0.6b: 8 GB de RAM; modelo 1.7b: GPU com 16 GB de memória de vídeo, ou ~20 GB de RAM na CPU
- Linux, macOS ou Windows com WSL
- GPU é **opcional**: com uma NVIDIA (Linux ou WSL) a voz fica bem mais rápida. O `npm run setup` configura.

Tempo de máquina para cada 1 s de fala: modelo 0.6b ≈ 4 s na CPU (6 núcleos) e ≈ 2 s na GPU (RTX 5060 Ti); modelo 1.7b ≈ 3 s na GPU. Uma aula de 6 min leva de 12 a 25 min de voz,
só na primeira vez; falas que não mudaram não são regravadas). O vídeo leva ~2 min.

## Passo a passo: criando seu curso

### 1. Instale e configure

```bash
git clone https://github.com/AndersonGuilherme/giz.git
cd giz/motor
ONNXRUNTIME_NODE_INSTALL=skip npm install
npm run setup
```

O `npm run setup` é um **onboarding guiado no terminal**. Ele pergunta e prepara tudo para a SUA máquina:

1. confere a versão do Node;
2. pergunta onde guardar os modelos de IA (e mostra o espaço livre);
3. detecta sua placa de vídeo. Com **GPU NVIDIA**, oferece usá-la e baixa sozinho as bibliotecas CUDA
   (sem sudo e sem instalar o CUDA Toolkit; basta o driver da NVIDIA). Sem GPU, pergunta quantos núcleos da CPU usar;
4. pergunta o tamanho do modelo de voz (**0.6b**, leve, ou **1.7b**, mais natural e com instruções de estilo; ele
   recomenda conforme a sua memória), o nome do seu canal (aparece no canto dos vídeos), o idioma, as vozes de
   Lia e Téo e, no 1.7b, o **estilo** de cada um ("fale com energia e curiosidade, como um jovem desenvolvedor");
5. pergunta se você quer o controle de qualidade da pronúncia (Whisper);
6. pergunta quem vai usar (pessoa física ou empresa), por causa da licença do Remotion;
7. baixa o modelo de voz, gera uma fala de teste, mede a velocidade e, se você quiser, gera amostras de todas
   as vozes em `amostras-de-voz/` para você ouvir.

As respostas ficam em `giz.config.json`, na raiz. Esse arquivo é **individual**: não vai para o git, então cada
instalação tem a sua configuração. Para mudar algo, rode `npm run setup` de novo
(ou `npm run setup -- --padrao` para aceitar todas as respostas padrão sem perguntar).

### 2. Crie o curso

```bash
npm run novo-curso -- logica "Lógica de programação do zero"
```

Isso cria `cursos/logica/` com `curso.yaml`, `plano-do-curso.md` e `pronuncia.json`. Preencha o
`plano-do-curso.md`: resultado final, público, **projeto-fio** (um exemplo que atravessa o curso inteiro) e a
lista de aulas.

### 3. Crie a primeira aula

```bash
npm run nova-aula -- logica cupom-negativo "O cupom que deixou o preço negativo"
```

Isso cria `cursos/logica/aulas/01-cupom-negativo/` (o número é automático) com:

```
01-cupom-negativo/
├── plano.md      objetivo, mistério, exemplo, erro comum, desafio
├── roteiro.ts    as falas e as cenas: um exemplo COMPLETO que já renderiza
└── exemplos/     código que aparece na tela, com testes
```

**Dica:** renderize o exemplo antes de mudar qualquer coisa (passo 6). Assim você vê como cada linha do
roteiro vira vídeo.

### 4. Escreva o roteiro

Leia os padrões antes (10 minutos que economizam horas):

| Arquivo | O que ensina |
|---|---|
| [`padrao/estrutura-da-aula.md`](padrao/estrutura-da-aula.md) | os capítulos fixos de toda aula (formato "investigação") |
| [`padrao/como-escrever-uma-aula.md`](padrao/como-escrever-uma-aula.md) | todos os campos do roteiro e as cenas disponíveis |
| [`personagens/guia-editorial.md`](personagens/guia-editorial.md) | personalidade e regras de diálogo de Lia e Téo |
| [`padrao/licoes-aprendidas.md`](padrao/licoes-aprendidas.md) | erros que já aconteceram e como evitá-los |

Cada fala do `roteiro.ts` tem esta cara:

```ts
{
  id: '001', chapter: 1, speaker: 'teo',
  text: 'Um cliente [usou um cupom de desconto]... e [pagou mais caro].',   // legenda; [trecho] dispara uma ação
  say:  'Um cliente [usou um cupom de desconto]... <pausa 0.3> e [pagou mais caro].', // opcional: só para a voz
  pose: 'raise', expr: 'surprised', look: 'viewer',
  react: { expr: 'concerned' },                      // reação de quem está ouvindo
  scene: { kind: 'card', variant: 'ticket', title: 'Reclamação #4521', items: ['Usei o cupom', 'Paguei mais'], shown: 0 },
  beats: [{ shown: 1, sfx: 'pop' }, { shown: 2, sfx: 'error' }],   // uma ação por [trecho]
}
```

Coloque o código que vai aparecer na tela em `exemplos/`, com testes que passam (o aluno pode rodar).

> **Escrevendo com uma IA (opcional):** dê a ela os quatro arquivos da tabela acima, um roteiro pronto
> (por exemplo `cursos/solid/aulas/01-por-que-codigo-apodrece/roteiro.ts`) e o seu `plano.md`, e peça:
> *"Escreva o roteiro.ts desta aula seguindo esses padrões"*. Revise o conteúdo técnico antes de renderizar.

### 5. Valide (sem gerar voz)

```bash
npm run check -- ../cursos/logica/aulas/01-cupom-negativo
```

O comando roda os testes dos exemplos, confere os tipos do roteiro e monta a linha do tempo com a duração
estimada. Ele aponta erros como "3 [marcas] no texto, mas 2 beats".

### 6. Gere o vídeo

```bash
npm run render -- ../cursos/logica/aulas/01-cupom-negativo
```

Saídas em `render/`: `aula-01.mp4` e `legendas.srt` (pronta para o YouTube).
Para ver e ajustar no navegador, quadro a quadro: `npm run studio`.

### 7. Ajuste e regrave só o que mudou

- **Palavra pronunciada errado?** Adicione a grafia que soa certo em `cursos/<curso>/pronuncia.json`
  (`"deploy": "diplói"`). Só a voz muda; a legenda continua com o texto original.
- **Mudou uma fala?** Rode o `render` de novo: só as falas alteradas são regravadas.
- **Não gostou da entonação de uma fala?** Sorteie outra versão: `SEED=2 npm run tts -- <aula> 007`.
- **Uma fala precisa de outro tom?** No modelo 1.7b, dê uma instrução só para ela no roteiro:
  `style: 'Fale surpreso, quase sem acreditar'`. O estilo padrão de cada personagem fica no `npm run setup`.
- **Várias aulas de uma vez**, com controle de qualidade da pronúncia (Whisper):
  `npm run produce -- ../cursos/logica/aulas/*`

### 8. Publique no YouTube (opcional)

`npm run youtube` envia a aula renderizada com título, descrição com capítulos, legendas, capa e playlist do curso.
A credencial OAuth é sua e fica fora do repositório (`~/.config/giz/youtube/`); o passo a passo está no topo de
`motor/scripts/youtube.ts`.

```bash
npm run youtube -- login
npm run youtube -- simular ../cursos/logica/aulas/01-cupom-negativo      # mostra o que seria enviado
npm run youtube -- pendentes ../cursos/logica --privacidade unlisted --vigiar   # publica cada aula assim que fica pronta
```

As capas ficam em `cursos/<curso>/capas/` (ou na pasta `capas:` do `curso.yaml`), com nome `Aula 01 - título.png`.
Atenção: a cota padrão da API permite umas 4 aulas por dia, e projetos de API não verificados pelo Google têm
os vídeos travados como privados até passarem pela auditoria da API.

## Personalizando

| Quero… | Onde |
|---|---|
| trocar a voz, o idioma, a GPU ou a pasta dos modelos | `npm run setup` (grava no seu `giz.config.json`) |
| mudar as cores dos personagens | `look` em [`motor/src/cast.ts`](motor/src/cast.ts) |
| mudar as cores e fontes dos vídeos | [`motor/src/theme.ts`](motor/src/theme.ts) |
| criar um tipo de cena novo | `motor/src/types.ts` → `motor/src/scenes.tsx` → `SCENES` em `motor/src/Lesson.tsx` → [`padrao/catalogo-de-cenas.md`](padrao/catalogo-de-cenas.md) |
| usar outra voz (ElevenLabs, Azure, Kokoro…) | [`motor/scripts/tts.ts`](motor/scripts/tts.ts) |

Detalhes técnicos do motor: [`motor/README.md`](motor/README.md).

## Estrutura

```
giz/
├── motor/          motor de vídeo (Remotion + voz Qwen3-TTS local)
├── padrao/         formato da aula, catálogo de cenas, guia de escrita
├── personagens/    Lia e Téo: guia editorial e ficha visual
├── _template/      modelos usados por novo-curso e nova-aula
└── cursos/solid/   curso de exemplo (24 aulas)
```

Áudios e vídeos gerados não vão para o git: o `render` gera tudo de novo.

## Limitações conhecidas

- As vozes prontas do Qwen3-TTS são nativas de outros idiomas (chinês, inglês, japonês, coreano). Elas falam
  português, mas podem ter um leve sotaque. Use o `pronuncia.json` e o Whisper (`npm run produce`) para achar e
  corrigir palavras problemáticas.
- Gerar voz em CPU é lento (veja "Requisitos"). Fica rápido nas rodadas seguintes, porque só as falas alteradas são regravadas.
- Personagens 2D não demonstram movimentos físicos com fidelidade (para isso, grave vídeo real).

## Licença

Código sob [MIT](LICENSE). Respeite também as licenças das ferramentas usadas (tabela no começo, em especial a do Remotion).
