import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertLesson, type V1Sources } from '../../../src/infrastructure/v1/convertLesson.ts';
import type { V1Cue, V1Lesson } from '../../../src/infrastructure/v1/v1Lesson.ts';
import { projectSchema } from '../../../src/infrastructure/schema/projectSchema.ts';
import { scriptSchema } from '../../../src/infrastructure/schema/scriptSchema.ts';

type Line = Record<string, unknown>;

const EXAMPLES: Record<string, string> = {
  'service.v1.ts': 'header\nexport class Service {\n  run() {}\n}\n\n',
  'service.v2.ts': 'header\nexport class Service {\n  run() {}\n  stop() {}\n\n  start() {}\n}\n',
};
const cast = (id: string) => ({ id, name: id, rig: 'lia-style', parameters: { hair: 'bun' }, voice: { id: 'default' }, defaultExpression: 'happy' });
const SOURCES: V1Sources = {
  read: (file) => {
    const text = EXAMPLES[file];
    if (text === undefined) throw new Error(`sem ${file}`);
    return text;
  },
  casts: { lia: cast('lia'), teo: cast('teo') },
  voice: { voices: { lia: 'vivian', teo: 'dylan' }, styles: { lia: 'Fale calorosa', teo: '' }, model: '1.7b' },
};

const cue = (id: string, fields: Partial<V1Cue> = {}): V1Cue => ({ id, chapter: 1, speaker: 'lia', text: `Fala ${id}.`, ...fields });
const lesson = (cues: V1Cue[]): V1Lesson => ({ course: 'solid', number: '01', slug: 'teste', title: 'Aula de teste', chapters: ['Um', 'Dois'], cues });
const linesOf = (cues: V1Cue[], sources = SOURCES) => (convertLesson(lesson(cues), sources).script as { lines: Line[] }).lines;
const sceneOf = (scene: V1Cue['scene']) => linesOf([cue('1', { scene })])[0].scene;

test('project: 16:9 lesson in pt-BR, block captions, Lia and Téo, the Qwen model of the install; the title of the lesson', () => {
  const { project, script } = convertLesson(lesson([cue('1', { scene: { kind: 'talk' } })]), SOURCES);
  assert.deepEqual(project, {
    version: 2, title: 'Aula de teste', format: 'lesson', language: 'pt-BR', aspect: '16:9', captionStyle: 'blocks',
    cast: ['lia', 'teo'], voice: { provider: 'qwen', model: '1.7b' },
  });
  assert.deepEqual((script as { chapters: string[] }).chapters, ['Um', 'Dois']);
  projectSchema.parse(project);
  scriptSchema.parse(script);
});

test('cast: the example presenters with the install voices; the style only with the 1.7B model (as the motor)', () => {
  const { cast: converted } = convertLesson(lesson([cue('1', { scene: { kind: 'talk' } })]), SOURCES);
  assert.deepEqual(converted.lia.voice, { id: 'vivian', style: 'Fale calorosa' });
  assert.deepEqual(converted.teo.voice, { id: 'dylan' }, 'an empty style is left out');
  assert.equal(converted.lia.rig, 'lia-style');
  const small = convertLesson(lesson([cue('1', { scene: { kind: 'talk' } })]), { ...SOURCES, voice: { ...SOURCES.voice, model: '0.6b' } });
  assert.deepEqual(small.cast.lia.voice, { id: 'vivian' });
  assert.deepEqual(small.project.voice, { provider: 'qwen', model: '0.6b' });
});

test('cue fields: say → pronunciation, expr → expression (concerned → worried), viewer → camera, react → reaction, hold → holdAfter, read → reading', () => {
  const [line] = linesOf([cue('007', {
    chapter: 2, speaker: 'teo', text: 'O [cupom] <pausa 0.4> sumiu.', say: 'O cúpom <pausa 0.3>  sumiu.', pose: 'point', expr: 'concerned', look: 'viewer',
    react: { expr: 'concerned', pose: 'think', look: 'viewer' }, hold: { seconds: 3, label: 'Pense' }, read: 2.5, sfx: 'ding',
    scene: { kind: 'talk' }, beats: [{ expr: 'surprised', pose: 'raise', sfx: 'pop' }],
  })]);
  assert.deepEqual(line, {
    id: '007', chapter: 2, speaker: 'teo', expression: 'worried', pose: 'point', look: 'camera',
    reaction: { expression: 'worried', pose: 'think', look: 'camera' }, scene: { type: 'talk' },
    text: 'O [cupom] sumiu.', pronunciation: 'O cúpom sumiu.', beats: [{ expression: 'surprised', pose: 'raise', sfx: 'pop' }],
    holdAfter: { seconds: 3, label: 'Pense' }, reading: 2.5, sfx: 'ding',
  });
  assert.equal(linesOf([cue('1', { scene: { kind: 'talk' }, read: false })])[0].reading, false);
  assert.equal(linesOf([cue('1', { scene: { kind: 'talk' }, look: 'other' })])[0].look, 'other');
});

test('speed and a per-line style do not carry over: the conversion warns', () => {
  const { warnings, script } = convertLesson(lesson([cue('1', { scene: { kind: 'talk' }, speed: 1.2, style: 'Grite' })]), SOURCES);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0]!, /fala 1: "speed"/);
  assert.match(warnings[1]!, /fala 1: "style"/);
  assert.equal(((script as { lines: Line[] }).lines[0] as Line).style, undefined);
});

test('scenes with the same fields keep them: talk, card, quote, versus, house, inbox', () => {
  assert.deepEqual(sceneOf({ kind: 'card', variant: 'ticket', title: 'T', items: ['a', 'b'], shown: 1 }), { type: 'card', variant: 'ticket', title: 'T', items: ['a', 'b'], shown: 1 });
  assert.deepEqual(sceneOf({ kind: 'quote', text: 'Frase.\nOutra.' }), { type: 'quote', text: 'Frase.\nOutra.' });
  const sides = { wrong: { title: 'Errado', text: 'x' }, right: { title: 'Certo', text: 'y' } };
  assert.deepEqual(sceneOf({ kind: 'versus', ...sides }), { type: 'versus', ...sides });
  assert.deepEqual(sceneOf({ kind: 'house', marks: ['wall', 'tv'] }), { type: 'house', marks: ['wall', 'tv'] });
  assert.deepEqual(sceneOf({ kind: 'inbox', count: 3000, subject: 'Pedido confirmado!', note: 'Simulado' }), { type: 'inbox', count: 3000, subject: 'Pedido confirmado!', note: 'Simulado' });
});

test('scenes with renamed fields: title, chart, symptoms, terminal, graph, table', () => {
  assert.deepEqual(sceneOf({ kind: 'title', eyebrow: 'Aula 1', title: 'T', subtitle: 'S' }), { type: 'title', overline: 'Aula 1', title: 'T', subtitle: 'S' });
  assert.deepEqual(sceneOf({ kind: 'chart', xLabel: 'tempo', yLabel: 'custo', curves: ['healthy', 'rotten'] }), { type: 'chart', xAxisLabel: 'tempo', yAxisLabel: 'custo', curves: ['healthy', 'rotten'] });
  assert.deepEqual(sceneOf({ kind: 'symptoms', items: [{ name: 'Rigidez', desc: 'd' }], shown: 1, focus: 0 }), { type: 'symptoms', items: [{ name: 'Rigidez', description: 'd' }], shown: 1, focus: 0 });
  assert.deepEqual(sceneOf({ kind: 'terminal', command: 'npm test', lines: [{ text: 'a', tone: 'muted' }, { text: 'b', tone: 'fail' }, { text: 'c' }] }),
    { type: 'terminal', command: 'npm test', lines: [{ text: 'a', tone: 'dim' }, { text: 'b', tone: 'fail' }, { text: 'c' }] });
  const nodes = [{ id: 'a', label: 'A', x: 10, y: 20, tone: 'ui' }, { id: 'b', label: 'B', x: 80, y: 20, tone: 'infra' }, { id: 'c', label: 'C', x: 50, y: 70, tone: 'core' }, { id: 'd', label: 'D', x: 50, y: 90 }];
  const edges = [{ from: 'a', to: 'b', bad: true }];
  assert.deepEqual(sceneOf({ kind: 'graph', nodes, edges, focusBad: true }), {
    type: 'graph', edges, focusOnBad: true,
    nodes: [{ ...nodes[0], tone: 'interface' }, { ...nodes[1], tone: 'infrastructure' }, nodes[2], nodes[3]],
  });
  const rows = [{ label: 'r', cells: ['✓'] }];
  assert.deepEqual(sceneOf({ kind: 'table', title: 'T', columns: ['c'], rows, shownRows: 1, highlightCol: 0, highlightRow: 0 }),
    { type: 'table', title: 'T', columns: ['c'], rows, shownRows: 1, highlightedColumn: 0, highlightedRow: 0 });
});

test('code from a file becomes inline code: from the `from` line, the lines new against `diffAgainst`, highlight kept', () => {
  assert.deepEqual(sceneOf({ kind: 'code', file: 'service.v2.ts', from: 'export class', diffAgainst: 'service.v1.ts', highlight: ['stop'], title: 'service.ts' }), {
    type: 'code', title: 'service.ts', lines: ['export class Service {', '  run() {}', '  stop() {}', '', '  start() {}', '}'], added: [2, 4], highlight: ['stop'],
  });
  assert.deepEqual(sceneOf({ kind: 'code', file: 'service.v1.ts' }), {
    type: 'code', title: 'service.v1.ts', lines: ['header', 'export class Service {', '  run() {}', '}'],
  }, 'without from: the whole file, trailing blank lines dropped; the title is the file name');
  assert.throws(() => sceneOf({ kind: 'code', file: 'service.v1.ts', from: 'nada disso' }), /"nada disso" não encontrado em service.v1.ts/);
});

test('beats: character fields renamed, scene fields translated for the scene on screen (own or inherited)', () => {
  const lines = linesOf([
    cue('1', { text: '[a] e [b]', scene: { kind: 'table', title: 'T', columns: ['c'], rows: [] }, beats: [{ highlightCol: 1, sfx: 'pop' }, { shownRows: 2, expr: 'concerned' }] }),
    cue('2', { text: '[c]', beats: [{ highlightRow: 0 }] }),
    cue('3', { text: '[d]', scene: { kind: 'graph', nodes: [], edges: [] }, beats: [{ focusBad: true, nodes: [{ id: 'n', label: 'N', x: 1, y: 1, tone: 'ui' }] }] }),
  ]);
  assert.deepEqual(lines[0].beats, [{ highlightedColumn: 1, sfx: 'pop' }, { shownRows: 2, expression: 'worried' }]);
  assert.deepEqual(lines[1].beats, [{ highlightedRow: 0 }]);
  assert.equal(lines[1].scene, undefined, 'a line without a scene still inherits it');
  assert.deepEqual(lines[2].beats, [{ focusOnBad: true, nodes: [{ id: 'n', label: 'N', x: 1, y: 1, tone: 'interface' }] }]);
});

test('set on a line that opens a scene: merged into the scene', () => {
  const scene = sceneOf({ kind: 'symptoms', items: [{ name: 'A', desc: 'a' }], shown: 1 });
  assert.equal((scene as Line).focus, undefined);
  const [line] = linesOf([cue('1', { scene: { kind: 'symptoms', items: [{ name: 'A', desc: 'a' }], shown: 1 }, set: { focus: 0 } })]);
  assert.deepEqual(line.scene, { type: 'symptoms', items: [{ name: 'A', description: 'a' }], shown: 1, focus: 0 });
  assert.equal(line.beats, undefined);
});

test('set on a line that inherits its scene: a beat on the first word (of the text, or of the pronunciation when it holds the beats)', () => {
  const opening = cue('1', { scene: { kind: 'table', title: 'T', columns: ['c'], rows: [] } });
  const [, inText, inPronunciation, merged] = linesOf([
    opening,
    cue('2', { text: 'Olha a [coluna] agora.', say: 'Olha a coluna agora.', set: { highlightRow: 3 }, beats: [{ sfx: 'pop' }] }),
    cue('3', { text: 'Olha a coluna.', say: 'Olha a [coluna].', set: { highlightCol: 1 }, beats: [{ sfx: 'pop' }] }),
    cue('4', { text: '[Olha] só.', set: { highlightCol: 1, shownRows: 1 }, beats: [{ shownRows: 2, sfx: 'pop' }] }),
  ]);
  assert.equal(inText.text, '[Olha] a [coluna] agora.');
  assert.equal(inText.pronunciation, 'Olha a coluna agora.');
  assert.deepEqual(inText.beats, [{ highlightedRow: 3 }, { sfx: 'pop' }]);
  assert.equal(inPronunciation.text, 'Olha a coluna.');
  assert.equal(inPronunciation.pronunciation, '[Olha] a [coluna].');
  assert.deepEqual(inPronunciation.beats, [{ highlightedColumn: 1 }, { sfx: 'pop' }]);
  assert.equal(merged.text, '[Olha] só.');
  assert.deepEqual(merged.beats, [{ highlightedColumn: 1, shownRows: 2, sfx: 'pop' }], 'the beat that opens the line wins over the set');
});

test('the converted script of every scene kind passes the v2 script schema', () => {
  const kinds: V1Cue['scene'][] = [
    { kind: 'title', eyebrow: 'A', title: 'T', subtitle: 'S' }, { kind: 'talk' }, { kind: 'inbox', count: 1, subject: 's' },
    { kind: 'card', variant: 'summary', title: 'T', items: ['a'], shown: 1 }, { kind: 'quote', text: 'q' },
    { kind: 'chart', xLabel: 'x', yLabel: 'y', curves: ['rotten'] }, { kind: 'house', marks: ['sink'] },
    { kind: 'symptoms', items: [{ name: 'n', desc: 'd' }], shown: 1 }, { kind: 'code', file: 'service.v1.ts', highlight: [] },
    { kind: 'terminal', command: 'c', lines: [{ text: 't', tone: 'muted' }] },
    { kind: 'graph', nodes: [{ id: 'a', label: 'A', x: 1, y: 1, tone: 'infra' }], edges: [], focusBad: false },
    { kind: 'versus', wrong: { title: 'a', text: 'b' }, right: { title: 'c', text: 'd' } },
    { kind: 'table', columns: ['c'], rows: [{ label: 'r', cells: ['x'] }], highlightCol: 0 },
  ];
  const { script } = convertLesson(lesson(kinds.map((scene, index) => cue(String(index + 1), { scene }))), SOURCES);
  assert.equal(scriptSchema.safeParse(script).success, true, JSON.stringify(scriptSchema.safeParse(script).error?.issues));
});
