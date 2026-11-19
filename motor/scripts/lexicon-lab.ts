// Laboratório de pronúncia: sintetiza cada grafia candidata dentro de uma frase e pergunta ao Whisper o que ouviu.
// A grafia vencedora vai para cursos/<curso>/pronuncia.json. Uso: node scripts/lexicon-lab.ts
import { KokoroTTS } from 'kokoro-js';
import { phonemizeForLab } from './tts.ts';
import { makeAsr, norm } from './asr-check.ts';

const TESTS: Array<{ word: string; frame: string; candidates: string[] }> = process.env.LAB_TESTS
  ? JSON.parse(process.env.LAB_TESTS)
  : [{ word: 'e-mails', frame: 'Chegaram três mil X hoje.', candidates: ['e-mails', 'iméios'] }];

const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
const asr = await makeAsr();
for (const t of TESTS) {
  const res: string[] = [];
  for (const c of t.candidates) {
    const phon = await phonemizeForLab(t.frame.replace('X', c));
    const { input_ids } = tts.tokenizer(phon, { truncation: true });
    const a = (await tts.generate_from_ids(input_ids, { voice: (process.env.LAB_VOICE ?? 'pf_dora') as never, speed: Number(process.env.LAB_SPEED ?? 1.04) })).audio as Float32Array;
    const x = new Float32Array(Math.floor((a.length * 16000) / 24000));
    for (let k = 0; k < x.length; k++) x[k] = a[Math.floor((k * 24000) / 16000)];
    const heard = ((await asr(x, { language: 'portuguese', task: 'transcribe' })) as { text: string }).text.trim();
    const target = norm(t.word).join('');
    const ok = norm(heard).join('').includes(target);
    res.push(`${ok ? '✔' : '✖'} ${c} → "${heard}"`);
  }
  console.log(`\n${t.word}\n  ${res.join('\n  ')}`);
}
