import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CardLayout } from '../../../src/domain/lesson/CardLayout.ts';
import { LessonStage } from '../../../src/domain/lesson/LessonStage.ts';
import { ChartLayout } from '../../../src/domain/lesson/ChartLayout.ts';
import { QuoteLayout } from '../../../src/domain/lesson/QuoteLayout.ts';
import { SymptomsLayout } from '../../../src/domain/lesson/SymptomsLayout.ts';
import { TableLayout, toneOf } from '../../../src/domain/lesson/TableLayout.ts';
import { TerminalLayout } from '../../../src/domain/lesson/TerminalLayout.ts';
import { TitleLayout } from '../../../src/domain/lesson/TitleLayout.ts';
import { VersusLayout } from '../../../src/domain/lesson/VersusLayout.ts';
import type { SymptomsScene } from '../../../src/domain/script/LessonScenes.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Language } from '../../../src/domain/values/Language.ts';
import { Fps } from '../../../src/domain/values/Time.ts';

const { VERTICAL, HORIZONTAL } = AspectRatio;

test('card: the label comes from the fixed texts of the language and each variant has its bullets', () => {
  const card = { type: 'card', variant: 'summary', title: 'Resumo', items: ['um', 'dois'] } as const;
  assert.equal(CardLayout.for(card, HORIZONTAL, Language.PORTUGUESE).label.fit.lines[0], 'RESUMO');
  assert.equal(CardLayout.for(card, HORIZONTAL, Language.ENGLISH).label.fit.lines[0], 'SUMMARY');
  assert.deepEqual(CardLayout.for(card, VERTICAL, Language.PORTUGUESE).items.map((item) => item.mark), ['1', '2']);
  assert.deepEqual(CardLayout.for({ ...card, variant: 'objective' }, VERTICAL, Language.PORTUGUESE).items.map((item) => item.mark), ['◎', '◎']);
});

test('card: items go down the panel without touching each other', () => {
  const { items } = CardLayout.for({ type: 'card', variant: 'challenge', title: 'T', items: ['a', 'b', 'c'] }, VERTICAL, Language.PORTUGUESE);
  for (let i = 1; i < items.length; i++) assert.ok(items[i].bullet.y >= items[i - 1].bullet.y + items[i - 1].bullet.height);
});

test('quote: the lines keep their paragraph and only the last paragraph is highlighted', () => {
  const { lines } = QuoteLayout.for({ type: 'quote', text: 'Primeira frase bem comprida que quebra em duas linhas.\nFim.' }, VERTICAL);
  assert.ok(lines.length >= 3);
  assert.deepEqual(lines.at(-1), { text: 'Fim.', paragraph: 1, last: true, delay: 34 });
  assert.equal(lines[0].delay, 12, 'the first paragraph enters 12 frames in; each next one 22 frames later');
  assert.ok(lines.slice(0, -1).every((line) => line.paragraph === 0 && !line.last));
});

test('title: centered on the height of the content, in the order overline, title, subtitle', () => {
  const drawing = TitleLayout.for({ type: 'title', overline: 'Aula 1', title: 'Título', subtitle: 'Sub' }, HORIZONTAL);
  assert.ok(drawing.overline.bottom() <= drawing.title.rectangle.y);
  assert.ok(drawing.title.bottom() <= drawing.subtitle!.rectangle.y);
  assert.ok(drawing.overline.rectangle.y > 54);
});

test('chart: the newest curve draws itself in 1.6 s, the others are complete; rotten ends higher', () => {
  const fps = Fps.DEFAULT;
  assert.equal(ChartLayout.progressOf({ index: 0, count: 2 }, 0, fps), 1);
  assert.equal(ChartLayout.progressOf({ index: 1, count: 2 }, 0, fps), 0);
  assert.equal(ChartLayout.progressOf({ index: 1, count: 2 }, 24, fps), 0.5);
  assert.equal(ChartLayout.progressOf({ index: 1, count: 2 }, 48, fps), 1);
  const { curves } = ChartLayout.for({ type: 'chart', xAxisLabel: 't', yAxisLabel: 'c', curves: ['healthy', 'rotten'] }, HORIZONTAL, Language.ENGLISH);
  assert.ok(curves[1].points.at(-1)!.y < curves[0].points.at(-1)!.y);
  assert.equal(curves[1].label.fit.lines[0], 'rotten');
});

test('symptoms: 2 columns, numbered clues, and the focus dims the others in 8 frames', () => {
  const scene: SymptomsScene = { type: 'symptoms', shown: 2, focus: 1, items: [{ name: 'A', description: 'a' }, { name: 'B', description: 'b' }, { name: 'C', description: 'c' }] };
  const { cells } = SymptomsLayout.for(scene, HORIZONTAL, Language.PORTUGUESE);
  assert.equal(cells[0].rectangle.y, cells[1].rectangle.y);
  assert.ok(cells[2].rectangle.y > cells[0].rectangle.y);
  assert.equal(cells[1].clue.fit.lines[0], 'PISTA 02');
  assert.equal(SymptomsLayout.focusOpacity(scene, 0, 8), 0.4);
  assert.equal(SymptomsLayout.focusOpacity(scene, 1, 0), 0.4);
  assert.equal(SymptomsLayout.focusOpacity(scene, 1, 8), 1);
  assert.equal(SymptomsLayout.focusOpacity({ ...scene, focus: undefined }, 0, 0), 1);
});

test('terminal: the command row comes first, then one row per output line with its tone', () => {
  const drawing = TerminalLayout.for({ type: 'terminal', command: 'npm test', lines: [{ text: 'FAIL', tone: 'fail' }, { text: 'ok' }] }, VERTICAL);
  assert.deepEqual(drawing.rows.map((row) => row.tone), ['fail', 'dim']);
  assert.ok(drawing.rows[0].rectangle.y > drawing.prompt.y);
});

test('versus: side by side in 16:9, one above the other in 9:16; right comes 20 frames later', () => {
  const scene = { type: 'versus', wrong: { title: 'Errado', text: 'x' }, right: { title: 'Certo', text: 'y' } } as const;
  const wide = VersusLayout.for(scene, HORIZONTAL).sides;
  assert.equal(wide[0].panel.y, wide[1].panel.y);
  const tall = VersusLayout.for(scene, VERTICAL).sides;
  assert.equal(tall[0].panel.x, tall[1].panel.x);
  assert.deepEqual(tall.map((side) => side.delay), [0, 20]);
});

test('table: cell tones and the cells of a row sit side by side after the label column', () => {
  assert.deepEqual(['●', '✕ não', '✓', 'talvez'].map(toneOf), ['dot', 'bad', 'good', 'plain']);
  const drawing = TableLayout.for({ type: 'table', columns: ['A', 'B'], rows: [{ label: 'linha', cells: ['●', '✓'] }] }, HORIZONTAL);
  const [first, second] = drawing.rows[0].cells;
  assert.equal(first.band.x + first.band.width, second.band.x);
  assert.ok(drawing.rows[0].rectangle.y >= drawing.headerBase);
});

test('table: a highlighted column or row lights up in 10 frames; without one nothing lights', () => {
  const scene = { type: 'table', columns: ['A'], rows: [{ label: 'l', cells: ['x'] }] } as const;
  assert.equal(TableLayout.highlightProgress(scene, 30), 0);
  assert.equal(TableLayout.highlightProgress({ ...scene, highlightedColumn: 0 }, 5), 0.5);
  assert.equal(TableLayout.highlightProgress({ ...scene, highlightedRow: 0 }, 10), 1);
});

test('chart: the y label starts at the bottom left of its strip, left of the axis; a curve label shows when 90% drawn', () => {
  const drawing = ChartLayout.for({ type: 'chart', xAxisLabel: 't', yAxisLabel: 'c', curves: ['healthy'] }, HORIZONTAL, Language.PORTUGUESE);
  const { yStrip, yOrigin, plot, yLabel } = drawing;
  assert.deepEqual(yOrigin, { x: yStrip.x, y: yStrip.y + yStrip.height });
  assert.equal(yStrip.x + yStrip.width, plot.left - 34);
  assert.equal(yStrip.height, yLabel.rectangle.width, 'the label was measured along the strip');
  assert.equal(ChartLayout.labelVisible(0.9), false);
  assert.equal(ChartLayout.labelVisible(0.95), true);
});

test('reveal: card and table show everything by default; the table animates rows unless a column is highlighted', () => {
  const card = { type: 'card', variant: 'summary', title: 'R', items: ['a', 'b', 'c'] } as const;
  assert.equal(CardLayout.reveal(card).isVisible(2), true);
  assert.equal(CardLayout.reveal({ ...card, shown: 1 }).isVisible(1), false);
  const table = { type: 'table', columns: ['A'], rows: [{ label: 'x', cells: ['1'] }, { label: 'y', cells: ['2'] }] } as const;
  assert.equal(TableLayout.reveal(table).isVisible(1), true);
  assert.equal(TableLayout.reveal({ ...table, shownRows: 1 }).isVisible(1), false);
  assert.equal(TableLayout.reveal(table).progressAt(1, 0, Fps.DEFAULT), 0, 'the newest row slides in');
  assert.equal(TableLayout.reveal({ ...table, highlightedColumn: 0 }).progressAt(1, 0, Fps.DEFAULT), 1);
});

test('reveal: the newest clue pops in only when no clue is in focus', () => {
  const scene: SymptomsScene = { type: 'symptoms', shown: 2, items: [{ name: 'A', description: 'a' }, { name: 'B', description: 'b' }, { name: 'C', description: 'c' }] };
  assert.equal(SymptomsLayout.reveal(scene).isVisible(2), false);
  assert.equal(SymptomsLayout.reveal(scene).progressAt(1, 0, Fps.DEFAULT), 0);
  assert.equal(SymptomsLayout.reveal({ ...scene, focus: 0 }).progressAt(1, 0, Fps.DEFAULT), 1);
});

test('terminal and table panels are as tall as what they hold, centered in the content area', () => {
  const content = LessonStage.for(VERTICAL).content();
  const terminal = TerminalLayout.for({ type: 'terminal', command: 'npm test', lines: [{ text: 'ok' }] }, VERTICAL);
  assert.ok(terminal.panel.height < content.height / 2);
  const lastRow = terminal.rows.at(-1)!.rectangle;
  assert.ok(lastRow.y + lastRow.height <= terminal.panel.y + terminal.panel.height);
  const table = TableLayout.for({ type: 'table', title: 'T', columns: ['A'], rows: [{ label: 'l', cells: ['x'] }] }, VERTICAL);
  assert.ok(table.panel.height < content.height / 2);
  const row = table.rows[0].rectangle;
  assert.ok(row.y + row.height < table.panel.y + table.panel.height);
  assert.ok(Math.abs(table.panel.y - content.y - (content.y + content.height - table.panel.y - table.panel.height)) < 1e-6);
});
