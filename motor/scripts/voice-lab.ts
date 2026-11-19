// Laboratório de vozes: sintetiza as mesmas frases com cada voz do Qwen3-TTS e mede, com o Whisper local,
// quantas palavras ele entende (WER menor = pronúncia mais clara em pt-BR). Também mede o tempo de geração.
// Uso: node scripts/voice-lab.ts [pasta-de-saida] [voz1,voz2,...] ["instrução de estilo (só 1.7B)"]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Qwen3TTS, QWEN_RATE } from './qwen3-tts.ts';
import { makeAsr, norm, wer } from './asr-check.ts';

const FRASES = [
  'Três mil clientes receberam uma confirmação de compra, sem comprar absolutamente nada.',
  'Então como uma consulta de frete disparou três mil e-mails?',
  'Código funcionando não quer dizer código fácil de mudar.',
  'Você acha que dá pra resolver isso sem reescrever tudo?',
];
const out = resolve(process.argv[2] ?? 'vozes');
mkdirSync(out, { recursive: true });
const tts = await Qwen3TTS.load();
const voices = process.argv[3]?.split(',') ?? tts.availableSpeakers;
const asr = await makeAsr();
for (const v of voices) {
  let errs = 0, words = 0, gen = 0, dur = 0;
  const heard: string[] = [];
  for (const [i, f] of FRASES.entries()) {
    const t = performance.now();
    const a = await tts.generate(f, { speaker: v, instruct: process.argv[4] || undefined, seed: 7 + i });
    gen += (performance.now() - t) / 1000; dur += a.length / QWEN_RATE;
    const x = new Float32Array(Math.floor((a.length * 16000) / QWEN_RATE));
    for (let k = 0; k < x.length; k++) x[k] = a[Math.floor((k * QWEN_RATE) / 16000)];
    const h = ((await asr(x, { language: 'portuguese', task: 'transcribe' })) as { text: string }).text.trim();
    const r = wer(norm(f), norm(h)); errs += r.errors; words += norm(f).length; heard.push(h);
    const buf = Buffer.alloc(44 + a.length * 2);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + a.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(QWEN_RATE, 24); buf.writeUInt32LE(QWEN_RATE * 2, 28);
    buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(a.length * 2, 40);
    a.forEach((s, k) => buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), 44 + k * 2));
    writeFileSync(join(out, `${v}-${i + 1}.wav`), buf);
  }
  console.log(`${v.padEnd(9)} WER ${((100 * errs) / words).toFixed(1).padStart(5)}%  ${dur.toFixed(1)}s de áudio em ${gen.toFixed(0)}s  | ${heard.join(' | ')}`);
}
