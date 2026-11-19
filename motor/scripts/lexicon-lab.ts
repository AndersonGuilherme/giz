// Laboratório de pronúncia: sintetiza cada grafia candidata dentro de uma frase e pergunta ao Whisper o que ouviu.
// A grafia vencedora vai para cursos/<curso>/pronuncia.json.
// Uso: LAB_TESTS='[{"word":"deploy","frame":"Fiz o X ontem.","candidates":["deploy","diplói"]}]' node scripts/lexicon-lab.ts
//      LAB_VOICE=serena (padrão: a voz da Lia em src/cast.ts)
import { Qwen3TTS, QWEN_RATE } from './qwen3-tts.ts';
import { makeAsr, norm } from './asr-check.ts';
import { CAST } from '../src/cast.ts';

const TESTS: Array<{ word: string; frame: string; candidates: string[] }> = process.env.LAB_TESTS
  ? JSON.parse(process.env.LAB_TESTS)
  : [{ word: 'e-mails', frame: 'Chegaram três mil X hoje.', candidates: ['e-mails', 'iméios'] }];

const tts = await Qwen3TTS.load();
const asr = await makeAsr();
const voice = process.env.LAB_VOICE ?? CAST.lia.voice.id;
for (const t of TESTS) {
  const res: string[] = [];
  for (const c of t.candidates) {
    const a = await tts.generate(t.frame.replace('X', c), { speaker: voice, seed: 7 });
    const x = new Float32Array(Math.floor((a.length * 16000) / QWEN_RATE));
    for (let k = 0; k < x.length; k++) x[k] = a[Math.floor((k * QWEN_RATE) / 16000)];
    const heard = ((await asr(x, { language: 'portuguese', task: 'transcribe' })) as { text: string }).text.trim();
    const ok = norm(heard).join('').includes(norm(t.word).join(''));
    res.push(`${ok ? '✔' : '✖'} ${c} → "${heard}"`);
  }
  console.log(`\n${t.word}\n  ${res.join('\n  ')}`);
}
