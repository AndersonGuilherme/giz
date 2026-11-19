// Baixa os modelos de IA usados pelo giz (uma única vez; depois tudo roda offline):
//   • Qwen3-TTS 0.6B (voz, ~5,9 GB)  → ~/.cache/giz/   (ou GIZ_MODELS_DIR)
//   • Whisper small  (opcional, controle de qualidade da pronúncia, ~250 MB) → cache do @huggingface/transformers
// O `npm run render` também baixa a voz sozinho na primeira vez; este comando só adianta o download.
// Uso: npm run baixar-modelos            (só a voz)
//      npm run baixar-modelos -- --whisper
import { ensureModel } from './qwen3-tts.ts';

console.log(`voz pronta em ${await ensureModel()}`);
if (process.argv.includes('--whisper')) {
  const { makeAsr } = await import('./asr-check.ts');
  await makeAsr();
  console.log('Whisper pronto');
}
