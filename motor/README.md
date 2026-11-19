# Motor de vídeo das aulas

Transforma `roteiro.ts` + `exemplos/` de uma aula em `render/aula-NN.mp4` + `render/legendas.srt`.
Tudo roda local, sem GPU e sem serviço pago.

| Peça | Ferramenta | Licença |
|---|---|---|
| Animação e render | [Remotion](https://remotion.dev) 4 (React → MP4) | grátis para pessoa física ou empresa de até 3 pessoas; acima disso, Company License (~US$ 25/mês por assento) |
| Voz | Kokoro-82M via `kokoro-js` (CPU) + vozes `pf_dora` (professora) e `pm_alex` (professor) | Apache-2.0 (uso comercial livre) |
| Fonética pt-BR | espeak-ng (`@echogarden/espeak-ng-emscripten`) | GPL-3.0 (só usado como ferramenta, não vai no vídeo) |
| Fontes | Nunito + JetBrains Mono | OFL |

## Comandos

```bash
npm install                     # primeira vez (use ONNXRUNTIME_NODE_INSTALL_CUDA=skip: não há GPU)
npm run render -- ../cursos/solid/aulas/01-por-que-codigo-apodrece   # voz + build + MP4
npm run studio                  # pré-visualização interativa no navegador
npm run tts -- <aula> 012 013   # regravar só algumas falas
npm run lesson -- <aula>        # só o build (gera roteiro.md, legendas.srt e props.json)
```

## Como funciona

1. `roteiro.ts` lista as falas (cues) de Lia e Téo em três camadas: `text` (legenda), `say` (voz, opcional:
   pausas `<pausa 0.3>`) e o visual (`scene`, `beats`, `pose`, `expr`, `look`, `react`, `hold`, `sfx`).
   `[trecho]` no texto dispara o beat correspondente. Regras de escrita: `../personagens/guia-editorial.md`.
2. `scripts/tts.ts` gera um WAV por fala (voz e ritmo de cada personagem em `src/cast.ts`), mede volume e
   converte a fonética (espeak-ng) em visema por frame. Guarda onde cada frase cai no áudio.
   Fala inalterada não é regravada (hash). Pronúncia: `cursos/<curso>/pronuncia.json`.
3. `scripts/lesson.ts` monta a linha do tempo: duração da cena = duração do áudio (+ pausa "pense"). O beat cai
   na frase certa do áudio. Áudio desatualizado em relação ao texto é detectado (não toca fora de sincronia).
4. Remotion desenha cada quadro: `src/Lesson.tsx` (orquestra), `src/scenes.tsx` (catálogo),
   `src/Character.tsx` (rig: ombro + cotovelo, 8 poses, 8 expressões, sobrancelhas, pálpebras, olhar, 9 bocas).
5. `scripts/sfx.ts` sintetiza os efeitos (`assets/sfx`): whoosh automático a cada cena nova, pop, sucesso, erro.

Ficha de revisão dos personagens: composição `CharacterSheet`
(`npx remotion still src/index.ts CharacterSheet ficha.png`).

## Adicionar um tipo de cena

Tipo em `src/types.ts` → componente em `src/scenes.tsx` → registro em `SCENES` (`src/Lesson.tsx`) →
linha em `../padrao/catalogo-de-cenas.md`.

## Limitações conhecidas

- O beat é alinhado à frase certa do áudio, mas dentro da frase a posição é proporcional (erro típico de ±0,2 s).
- Os visemas vêm da fonética do texto espalhada pelos trechos com voz, não de um alinhador acústico.
- O Kokoro não tem controle de emoção: a expressão vem do texto (`say`), do ritmo e da animação.
- Vozes do Kokoro em pt-BR são boas, mas não de nível estúdio; trocar por ElevenLabs/Azure é mexer só em `scripts/tts.ts`.
