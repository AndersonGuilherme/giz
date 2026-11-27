import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CardLayout } from '../../../src/domain/lesson/CardLayout.ts';
import { LessonStage } from '../../../src/domain/lesson/LessonStage.ts';
import { ChartLayout } from '../../../src/domain/lesson/ChartLayout.ts';
import { HouseLayout } from '../../../src/domain/lesson/HouseLayout.ts';
import { InboxLayout } from '../../../src/domain/lesson/InboxLayout.ts';
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

test('house: only the marks present show their label; the newest pops in, the TV blinks every 4 frames', () => {
  const fps = Fps.DEFAULT;
  const both = { type: 'house', marks: ['wall', 'tv'] } as const;
  const drawing = HouseLayout.for(both, HORIZONTAL, Language.PORTUGUESE);
  assert.deepEqual(drawing.wall.fit.lines, ['trocar a lâmpada', '= quebrar a parede']);
  assert.equal(HouseLayout.for(both, HORIZONTAL, Language.ENGLISH).tv.fit.lines[0], 'turned on the shower');
  assert.equal(drawing.boxes().overflowingTexts().length, 0);
  assert.equal(HouseLayout.for({ type: 'house', marks: [] }, HORIZONTAL, Language.PORTUGUESE).boxes().overlappingPairs().length, 0);
  assert.equal(HouseLayout.markProgress(both, 'wall', { age: 0, fps }), 1, 'an older mark is settled');
  assert.equal(HouseLayout.markProgress(both, 'tv', { age: 0, fps }), 0, 'the newest one starts hidden');
  assert.ok(HouseLayout.markProgress(both, 'tv', { age: 30, fps }) > 0.95);
  assert.equal(HouseLayout.markProgress({ type: 'house', marks: ['wall'] }, 'tv', { age: 30, fps }), 0);
  assert.deepEqual([0, 3, 4, 8].map((age) => HouseLayout.screenOff(both, age)), [true, true, false, true]);
  assert.equal(HouseLayout.screenOff({ type: 'house', marks: ['wall'] }, 0), false);
  assert.ok(drawing.art.width <= drawing.panel.width && drawing.art.height <= drawing.panel.height);
  assert.ok(Math.abs(drawing.art.width / drawing.art.height - 1000 / 680) < 1e-9, 'the drawing keeps its proportion');
});

test('inbox: the counter climbs to the count in 2.2 s, accelerating; every 600 messages fill a row, up to 5', () => {
  const fps = Fps.DEFAULT;
  const scene = { type: 'inbox', count: 3000, subject: 'Pedido confirmado!', note: 'Cenário simulado' } as const;
  assert.deepEqual([0, 33, 66, 200].map((age) => InboxLayout.countAt(scene, age, fps)), [0, 750, 3000, 3000]);
  assert.equal(InboxLayout.countAt({ ...scene, count: 0 }, 66, fps), 0);
  assert.deepEqual([0, 1, 600, 601, 3000, 9000].map((shown) => InboxLayout.filledRows(shown)), [0, 1, 1, 2, 5, 5]);
  assert.equal(InboxLayout.badgeScale(scene, 3000, 7), 1, 'still once the counter arrived');
  assert.notEqual(InboxLayout.badgeScale(scene, 750, 7), 1);
  assert.equal(InboxLayout.countText(3000, Language.PORTUGUESE), '3.000');
  assert.equal(InboxLayout.countText(3000, Language.ENGLISH), '3,000');
  const drawing = InboxLayout.for(scene, HORIZONTAL, Language.PORTUGUESE);
  assert.equal(drawing.title.fit.lines[0], 'Caixa de entrada');
  assert.equal(drawing.rows.length, 5);
  assert.ok(drawing.note && drawing.note.rectangle.y >= LessonStage.for(HORIZONTAL).content().y, 'the note pill stays in the content area');
  for (let i = 1; i < 5; i++) assert.ok(drawing.rows[i].rectangle.y >= drawing.rows[i - 1].sender.bottom());
  assert.equal(InboxLayout.for({ ...scene, note: undefined }, VERTICAL, Language.ENGLISH).note, undefined);
});

test('inbox: a long subject takes two lines and only its filled rows grow', () => {
  const subject = 'Financeiro: total dos pedidos VIP não bate desde terça';
  const { rows, boxes } = InboxLayout.for({ type: 'inbox', count: 1, subject }, VERTICAL, Language.PORTUGUESE);
  assert.equal(rows[0].subject.fit.lines.length, 2);
  assert.ok(rows[0].rectangle.height > rows[1].rectangle.height);
  assert.equal(rows[1].rectangle.height, rows[4].rectangle.height);
  assert.deepEqual(boxes().overflowingTexts(), []);
  assert.equal(boxes().overlappingPairs().length, 0);
});
