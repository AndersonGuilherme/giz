import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Audio } from '../../../src/domain/speech/Audio.ts';
import { DiskProjectRepository } from '../../../src/infrastructure/disk/DiskProjectRepository.ts';
import { aggregatePronunciation } from '../../../src/infrastructure/qa/asrAggregate.ts';
import { checkPronunciation } from '../../../src/infrastructure/qa/asrCheck.ts';
import { compareSpellings } from '../../../src/infrastructure/qa/lexiconLab.ts';
import { checkQuestions } from '../../../src/infrastructure/qa/pitchCheck.ts';
import { compareVoices } from '../../../src/infrastructure/qa/voiceLab.ts';
import type { Transcriber } from '../../../src/infrastructure/qa/WhisperTranscriber.ts';
import { FakeRigCatalog } from '../../doubles/FakeRigCatalog.ts';

const FIXTURE = fileURLToPath(new URL('../../fixtures/minimal-project/', import.meta.url));

class FakeTranscriber implements Transcriber {
  readonly languages: string[] = [];
  readonly answers: string[];
  constructor(answers: string[]) {
    this.answers = answers;
  }
  async transcribe(_audio: Audio, language: string): Promise<string> {
    this.languages.push(language);
    return this.answers.shift() ?? '';
  }
}

async function fixtureCopy(change?: (script: { lines: Array<Record<string, unknown>> }) => void) {
  const folder = mkdtempSync(join(tmpdir(), 'gizzy-qa-'));
  cpSync(FIXTURE, folder, { recursive: true });
  const cast = JSON.parse(readFileSync(join(folder, 'cast', 'ana.json'), 'utf8'));
  writeFileSync(join(folder, 'cast', 'ana.json'), JSON.stringify({ ...cast, rig: 'test', parameters: { skin: '#f0c8a0' } }));
  const script = JSON.parse(readFileSync(join(folder, 'script.json'), 'utf8'));
  change?.(script);
  writeFileSync(join(folder, 'script.json'), JSON.stringify(script));
  const project = await new DiskProjectRepository({ catalog: new FakeRigCatalog() }).load(folder);
  return { folder, project };
}

test('asr: WER against the caption text, the wrong lines, questions not heard as questions, and output/asr.{txt,json}', async () => {
  const { folder, project } = await fixtureCopy((script) => {
    script.lines[1]!.text = 'Hoje vamos aprender juntos?';
  });
  const transcriber = new FakeTranscriber(['Oi, eu sou a Ana.', 'Hoje vamos aprender juntas.']);
  const report = await checkPronunciation({ folder, project, transcriber });
  assert.equal(report[0], 'WER 11.1% (1/9 palavras) · perguntas percebidas 0/1');
  assert.match(report[1]!, /palavras mais erradas: juntos×1/);
  assert.deepEqual(report.slice(2), ['2 (1/4) ouviu: "Hoje vamos aprender juntas."', '2 PERGUNTA NÃO PERCEBIDA: "Hoje vamos aprender juntas."']);
  assert.deepEqual(transcriber.languages, ['portuguese', 'portuguese']);
  assert.match(readFileSync(join(folder, 'output', 'asr.txt'), 'utf8'), /^WER 11\.1%.*\n2 \(1\/4\)/);
  const saved = JSON.parse(readFileSync(join(folder, 'output', 'asr.json'), 'utf8'));
  assert.deepEqual(saved[1], { line: '2', reference: 'Hoje vamos aprender juntos?', heard: 'Hoje vamos aprender juntas.', errors: 1, words: 4 });
});

test('asr-aggregate: only words missed in two or more projects, most spread first', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gizzy-aggregate-'));
  const write = (project: string, lines: object[]) => {
    mkdirSync(join(folder, project, 'output'), { recursive: true });
    writeFileSync(join(folder, project, 'output', 'asr.json'), JSON.stringify(lines));
  };
  write('01-a', [{ line: '1', reference: 'o deploy quebrou', heard: 'o diploi quebrou', errors: 1, words: 3 }]);
  write('02-b', [{ line: '7', reference: 'fiz deploy e commit', heard: 'fiz diploi e comite', errors: 2, words: 4 }]);
  mkdirSync(join(folder, '03-sem-relatorio'));
  const rows = aggregatePronunciation(folder);
  assert.equal(rows.length, 1);
  assert.match(rows[0]!, /^deploy +2× em 2 aulas  01-a\/1: "o diploi quebrou"$/);
});

test('pitch: one row per question line with a voice', async () => {
  const { folder, project } = await fixtureCopy((script) => {
    script.lines[0]!.text = 'Oi, eu sou a Ana?';
  });
  const rows = await checkQuestions(folder, project);
  assert.equal(rows.length, 1);
  assert.match(rows[0]!, /^1 +([+-]\d+\.\d|n\/a) st  "Oi, eu sou a Ana\?"$/);
});

test('voice and lexicon labs: one row per voice; ✔ when Whisper heard the word', async () => {
  const tts = {
    availableSpeakers: () => ['vivian', 'dylan'],
    generate: async () => new Float32Array(2400).fill(0.1),
  };
  const output = mkdtempSync(join(tmpdir(), 'gizzy-lab-'));
  const sentences = ['Três mil clientes receberam uma confirmação de compra, sem comprar absolutamente nada.',
    'Então como uma consulta de frete disparou três mil e-mails?', 'Código funcionando não quer dizer código fácil de mudar.',
    'Você acha que dá pra resolver isso sem reescrever tudo?'];
  const rows: string[] = [];
  await compareVoices({ tts, transcriber: new FakeTranscriber([...sentences, ...sentences.map(() => 'nada')]), output }, {}, (row) => rows.push(row));
  assert.match(rows[0]!, /^vivian +WER +0\.0%/);
  assert.match(rows[1]!, /^dylan +WER +\d+\.\d%/);
  assert.ok(readFileSync(join(output, 'dylan-4.wav')).length > 44);
  const lines: string[] = [];
  const tests = [{ word: 'deploy', frame: 'Fiz o X ontem.', candidates: ['deploy', 'diplói'] }];
  await compareSpellings({ tts, transcriber: new FakeTranscriber(['Fiz o diploi ontem.', 'Fiz o deploy ontem.']), voice: 'vivian' }, tests, (text) => lines.push(text));
  assert.equal(lines[0], '\ndeploy\n  ✖ deploy → "Fiz o diploi ontem."\n  ✔ diplói → "Fiz o deploy ontem."');
});
