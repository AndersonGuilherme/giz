# Motor de vídeo das aulas

Transforma `roteiro.ts` + `examples/` de uma aula em `render/aula-NN.mp4` + `render/legendas.srt`.
Tudo roda local, sem GPU e sem serviço pago.

| Peça | Ferramenta | Licença |
|---|---|---|
| Animação e render | [Remotion](https://remotion.dev) 4 (React → MP4) | grátis para pessoa física ou empresa de até 3 pessoas; acima disso, Company License (~US$ 25/mês por assento) |
| Voz | [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) 12Hz CustomVoice 0.6B ou 1.7B, export ONNX ([0.6B](https://huggingface.co/elbruno/Qwen3-TTS-12Hz-0.6B-CustomVoice-ONNX), [1.7B](https://huggingface.co/elbruno/Qwen3-TTS-12Hz-1.7B-CustomVoice-ONNX)), rodando em CPU com `onnxruntime-node` (`scripts/qwen3-tts.ts`) | Apache-2.0 (uso comercial livre) |
| Boca dos personagens | fonética do espeak-ng (`@echogarden/espeak-ng-emscripten`) | GPL-3.0 (só usado como ferramenta, não vai no vídeo) |
| Controle de qualidade (opcional) | Whisper small via `@huggingface/transformers` | MIT |
| Fontes | Nunito + JetBrains Mono | OFL |

## Comandos

```bash
ONNXRUNTIME_NODE_INSTALL=skip npm install   # primeira vez
npm run setup                     # onboarding: GPU/CPU, vozes, idioma, modelos → giz.config.json (individual)
npm run novo-curso -- <curso> "Título"
npm run nova-aula -- <curso> <slug> "Título"
npm run check -- <aula>           # testes dos exemplos + tipos + linha do tempo (sem gerar voz)
npm run render -- <aula>          # voz + build + MP4
npm run studio                    # pré-visualização interativa (abre a última aula montada)
npm run tts -- <aula> 012 013     # regravar só algumas falas
npm run produce -- <aula> [...]   # lote: voz + QA (Whisper) + render + cópia leve, para qualquer curso
node scripts/voice-lab.ts <saida> # compara as vozes do Qwen3-TTS em pt-BR (Whisper)
```

## Configuração individual

`npm run setup` grava `../giz.config.json` (fora do git), lido por `scripts/config.ts`: `model` (`0.6b`/`1.7b`),
`styles` (instrução de estilo por personagem, só 1.7b), `brand`, `device` (`cuda`/`cpu`),
`threads`, `modelsDir`, `language`, `voices`, `qa`, `render.concurrency`. Variáveis de ambiente pontuais:
`GIZ_DEVICE=cpu`, `GIZ_MODELS_DIR=...`, `VOICE_OVERRIDE=teo:aiden`.

GPU NVIDIA (`scripts/gpu.ts`): baixa o provider CUDA do ONNX Runtime e as bibliotecas oficiais da NVIDIA
(CUDA 12.9 runtime, cuBLAS, cuFFT, cuRAND, NVRTC, cuDNN 9) dos redistribuíveis públicos para
`<modelsDir>/cuda/lib` e as liga na pasta do ONNX Runtime. Sem sudo; só precisa do driver.

## Como funciona

1. `roteiro.ts` lista as falas (cues) de Lia e Téo em três camadas: `text` (legenda), `say` (voz, opcional:
   pausas `<pausa 0.3>`) e o visual (`scene`, `beats`, `pose`, `expr`, `look`, `react`, `hold`, `sfx`).
   `[trecho]` no texto dispara o beat correspondente. Regras de escrita: `../core/casts/example/editorial-guide.md`.
2. `scripts/tts.ts` gera um WAV por fala com o Qwen3-TTS (voz de cada personagem em `src/cast.ts`), uma frase
   por vez, mede volume e converte a fonética (espeak-ng) em visema por frame. Guarda onde cada frase cai no áudio.
   Fala inalterada não é regravada (hash); a semente do sorteio vem do texto, então o resultado é reproduzível.
   Pronúncia: `courses/<curso>/pronuncia.json`. Não gostou de uma fala? `SEED=2 npm run tts -- <aula> 012`.
3. `scripts/lesson.ts` monta a linha do tempo: duração da cena = duração do áudio (+ pausa "pense"). O beat cai
   na frase certa do áudio. Áudio desatualizado em relação ao texto é detectado (não toca fora de sincronia).
4. Remotion desenha cada quadro: `src/Lesson.tsx` (orquestra), `src/scenes.tsx` (catálogo),
   `src/Character.tsx` (rig: ombro + cotovelo, 8 poses, 8 expressões, sobrancelhas, pálpebras, olhar, 9 bocas).
5. `scripts/sfx.ts` sintetiza os efeitos (`assets/sfx`): whoosh automático a cada cena nova, pop, sucesso, erro.

Ficha de revisão dos personagens: composição `CharacterSheet`
(`npx remotion still src/index.ts CharacterSheet ficha.png`).

## Adicionar um tipo de cena

Tipo em `src/types.ts` → componente em `src/scenes.tsx` → registro em `SCENES` (`src/Lesson.tsx`) →
linha em `../docs/guides/scene-catalog.md`.

## Limitações conhecidas

- O beat é alinhado à frase certa do áudio, mas dentro da frase a posição é proporcional (erro típico de ±0,2 s).
- Os visemas vêm da fonética do texto espalhada pelos trechos com voz, não de um alinhador acústico.
- Velocidade da voz em CPU: o Qwen3-TTS leva ~4 s para gerar 1 s de fala (6 núcleos); uma aula de 6 min leva
  ~25 min de voz na primeira vez. Usa ~7 GB de RAM durante a geração.
- As 9 vozes prontas do modelo 0.6B são nativas de chinês, inglês, japonês e coreano; falam português, mas
  podem ter leve sotaque. Só o modelo 1.7B aceita instruções de estilo (`styles` no config, `style` por fala).
- Trocar por outro motor de voz (ElevenLabs, Azure, Kokoro…) é mexer só em `scripts/tts.ts`.
