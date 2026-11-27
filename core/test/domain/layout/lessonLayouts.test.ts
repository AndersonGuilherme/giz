import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box } from '../../../src/domain/layout/Box.ts';
import { createLayoutRegistry } from '../../../src/domain/layout/defaultLayoutRegistry.ts';
import { BLOCK_CAPTIONS } from '../../../src/domain/caption/captionLayouts.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { CardLayout } from '../../../src/domain/lesson/CardLayout.ts';
import { LessonStage } from '../../../src/domain/lesson/LessonStage.ts';
import { TableLayout } from '../../../src/domain/lesson/TableLayout.ts';
import type { CardScene, LessonScene, TableScene } from '../../../src/domain/script/LessonScenes.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Language } from '../../../src/domain/values/Language.ts';

const ASPECTS = [AspectRatio.VERTICAL, AspectRatio.HORIZONTAL];
const LESSON_TYPES = ['title', 'card', 'quote', 'chart', 'symptoms', 'code', 'terminal', 'graph', 'versus', 'table', 'talk', 'house', 'inbox'] as const;

const EXAMPLES: Readonly<Record<(typeof LESSON_TYPES)[number], LessonScene>> = {
  title: { type: 'title', overline: 'Aula 3', title: 'Por que trocar o e-mail quebrou o teste do frete', subtitle: 'Dependências: quem conhece quem' },
  card: { type: 'card', variant: 'objective', title: 'Dependência é uma seta', items: ['A → B: A conhece B (importa, chama ou herda)', 'Se B muda, A pode quebrar'] },
  quote: { type: 'quote', text: 'A mudança anda ao contrário da seta.\nDependa do que muda pouco.' },
  chart: { type: 'chart', xAxisLabel: 'tempo', yAxisLabel: 'custo da mudança', curves: ['healthy', 'rotten'] },
  symptoms: {
    type: 'symptoms',
    shown: 4,
    items: [
      { name: 'Rigidez', description: 'Uma mudança puxa outras cinco.' },
      { name: 'Fragilidade', description: 'Mexe aqui, quebra lá longe.' },
      { name: 'Imobilidade', description: 'Nada se reaproveita sem levar o resto junto.' },
      { name: 'Viscosidade', description: 'O jeito certo dá mais trabalho que a gambiarra.' },
    ],
  },
  code: {
    type: 'code',
    title: 'checkout.ts',
    lines: ['export class Checkout {', '  constructor(private email: SmtpEmail) {}', '  fechar(pedido: Pedido) {', '    this.email.enviar(pedido.cliente);', '  }', '}'],
    added: [1],
    highlight: ['SmtpEmail'],
  },
  terminal: { type: 'terminal', command: 'npm test', lines: [{ text: 'FAIL  frete.test.ts', tone: 'fail' }, { text: 'Tests: 1 failed, 12 passed' }] },
  graph: {
    type: 'graph',
    nodes: [
      { id: 'checkout', label: 'Checkout', x: 20, y: 30, tone: 'core' },
      { id: 'email', label: 'Provedor de e-mail', x: 75, y: 30, tone: 'infrastructure' },
      { id: 'frete', label: 'Frete', x: 45, y: 78, tone: 'soft' },
    ],
    edges: [{ from: 'checkout', to: 'email', bad: true }, { from: 'checkout', to: 'frete' }],
    focusOnBad: true,
  },
  versus: {
    type: 'versus',
    wrong: { title: 'Checkout conhece o SMTP', text: 'Trocar de provedor\nquebra o checkout.' },
    right: { title: 'Checkout conhece uma porta', text: 'O provedor muda\ne o checkout nem sabe.' },
  },
  table: {
    type: 'table',
    title: 'Quem muda junto',
    columns: ['Checkout', 'Frete', 'E-mail'],
    rows: [{ label: 'Trocar SMTP', cells: ['✕', '✓', '●'] }, { label: 'Nova regra de frete', cells: ['✓', '●', '✓'] }],
  },
  talk: { type: 'talk' },
  house: { type: 'house', marks: ['wall', 'tv'] },
  inbox: { type: 'inbox', count: 1, subject: 'Financeiro: total dos pedidos VIP não bate desde terça', note: 'Cenário simulado para fins didáticos' },
};

const CASES = LESSON_TYPES.flatMap((type) => ASPECTS.map((aspect) => ({ type, aspect })));
const boxesOf = (scene: LessonScene, aspect: AspectRatio) => createLayoutRegistry().boxesOf(scene, aspect, Language.PORTUGUESE);

test('every lesson scene has a layout in both aspect ratios', () => {
  for (const { type, aspect } of CASES) assert.ok(boxesOf(EXAMPLES[type], aspect), `${type} ${aspect.text()}`);
});

test('the example of every lesson scene fits, stays in the safe area and leaves room for the caption', () => {
  for (const { type, aspect } of CASES) {
    const where = `${type} ${aspect.text()}`;
    const boxes = boxesOf(EXAMPLES[type], aspect)!.with(BLOCK_CAPTIONS.box('Uma fala comum de duas linhas.', aspect, 'lesson'));
    assert.deepEqual(boxes.overflowingTexts().map((box) => box.label), [], where);
    assert.deepEqual(boxes.overlappingPairs().map(([a, b]) => `${a.label} × ${b.label}`), [], where);
    assert.deepEqual(boxes.outsideOf(SafeArea.for(aspect)).map((box) => box.label), [], where);
  }
});

test('a 6-column table in 9:16 shrinks its letters or reports an error', () => {
  const columns = ['Checkout', 'Frete', 'E-mail', 'Estoque', 'Pagamento', 'Relatórios'];
  const row = (label: string) => ({ label, cells: ['✕', '✓', '●', '✓', '✕', '●'] });
  const table: TableScene = { type: 'table', columns, rows: [row('Trocar SMTP'), row('Nova regra'), row('Cupom')] };
  const narrow = TableLayout.for(table, AspectRatio.VERTICAL);
  const wide = TableLayout.for(table, AspectRatio.HORIZONTAL);
  assert.ok(narrow.cellSize < wide.cellSize, 'the letters shrink in 9:16');
  assert.deepEqual(boxesOf(table, AspectRatio.VERTICAL)!.overflowingTexts(), []);

  const wordy: TableScene = { ...table, rows: [{ label: 'Trocar o provedor de e-mail transacional', cells: columns.map(() => 'Precisa recompilar, testar e publicar tudo de novo em produção') }] };
  const overflowing = boxesOf(wordy, AspectRatio.VERTICAL)!.overflowingTexts();
  assert.ok(overflowing.length > 0, 'what still does not fit is a check error');
  assert.match(overflowing[0].label, /tabela/);
});

test('too many card items shrink to stay in the panel; past 60% the check reports them', () => {
  const card = (count: number): LessonScene => ({ type: 'card', variant: 'summary', title: 'Resumo', items: Array.from({ length: count }, (_, i) => `Item número ${i + 1} do cartão`) });
  const panel = LessonStage.for(AspectRatio.VERTICAL).content();
  const shrunk = CardLayout.for(card(9) as CardScene, AspectRatio.VERTICAL, Language.PORTUGUESE);
  assert.ok(shrunk.items[0].text.fit.size < 40, 'the items shrank');
  for (const item of shrunk.items) assert.ok(item.text.bottom() <= panel.y + panel.height, `item ${item.mark} inside the panel`);
  assert.deepEqual(boxesOf(card(9), AspectRatio.VERTICAL)!.overflowingTexts(), []);
  const overflowing = boxesOf(card(20), AspectRatio.VERTICAL)!.overflowingTexts().map((box) => box.label);
  assert.ok(overflowing.includes('lista de itens do cartão'), overflowing.join(', '));
});

test('20 lines of code in 9:16 shrink to fit; 40 lines are a check error', () => {
  const lines = (count: number) => Array.from({ length: count }, (_, i) => `  const valor${i} = calcular(entrada, ${i});`);
  const fitting: LessonScene = { type: 'code', title: 'passos.ts', lines: lines(20) };
  assert.deepEqual(boxesOf(fitting, AspectRatio.VERTICAL)!.overflowingTexts(), []);
  const tooLong: LessonScene = { type: 'code', title: 'passos.ts', lines: lines(40) };
  assert.deepEqual(boxesOf(tooLong, AspectRatio.VERTICAL)!.overflowingTexts().map((box) => box.label), ['código']);
});

test('in 16:9 no lesson scene text enters the presenters column', () => {
  const column = Box.of('apresentadores', { x: 0, y: 0, width: 590, height: 1080 });
  for (const type of LESSON_TYPES) {
    const boxes = boxesOf(EXAMPLES[type], AspectRatio.HORIZONTAL)!.with(column);
    assert.deepEqual(boxes.overlappingPairs().map(([a, b]) => `${a.label} × ${b.label}`), [], type);
  }
});
