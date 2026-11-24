import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box } from '../../../src/domain/layout/Box.ts';
import { GraphLayout } from '../../../src/domain/layout/GraphLayout.ts';
import { LessonStage } from '../../../src/domain/lesson/LessonStage.ts';
import type { GraphNode } from '../../../src/domain/script/LessonScenes.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

// Two rows of four, as a lesson written for 16:9 would place them.
const EIGHT: GraphNode[] = [
  { id: 'ui', label: 'Tela de checkout', x: 14, y: 22 },
  { id: 'api', label: 'Controlador HTTP', x: 38, y: 22 },
  { id: 'caso', label: 'Fechar pedido', x: 62, y: 22 },
  { id: 'regra', label: 'Regra de frete', x: 86, y: 22 },
  { id: 'repo', label: 'Repositório de pedidos', x: 14, y: 78 },
  { id: 'banco', label: 'Postgres', x: 38, y: 78 },
  { id: 'email', label: 'Provedor de e-mail', x: 62, y: 78 },
  { id: 'fila', label: 'Fila', x: 86, y: 78 },
];

test('8 nodes in 9:16 without overlap and inside the content area', () => {
  const area = LessonStage.for(AspectRatio.VERTICAL).content();
  const layout = GraphLayout.place(EIGHT, area);
  assert.deepEqual(layout.conflicts, []);
  assert.deepEqual(layout.boxes().overlappingPairs(), []);
  assert.deepEqual(layout.boxes().outsideOf(Box.of('conteúdo', area)), []);
  assert.deepEqual(layout.boxes().overflowingTexts(), []);
});

test('in 16:9 the same graph keeps the largest letters', () => {
  const wide = GraphLayout.place(EIGHT, LessonStage.for(AspectRatio.HORIZONTAL).content());
  const narrow = GraphLayout.place(EIGHT, LessonStage.for(AspectRatio.VERTICAL).content());
  assert.deepEqual(wide.conflicts, []);
  assert.ok(wide.font >= narrow.font);
});

test('a long label is wrapped by TextFit and the box grows in height', () => {
  const area = { x: 0, y: 0, width: 1200, height: 800 };
  const [short] = GraphLayout.place([{ id: 'a', label: 'Fila', x: 50, y: 50 }], area).nodes;
  const [long] = GraphLayout.place([{ id: 'a', label: 'Repositório de pedidos com cache distribuído', x: 50, y: 50 }], area).nodes;
  assert.ok(long.lines.length > 1);
  assert.ok(long.rectangle.height > short.rectangle.height);
});

test('nodes too close together still overlap at the smallest letters and the check sees it', () => {
  const crowd = Array.from({ length: 6 }, (_, i) => ({ id: `n${i}`, label: 'Componente muito importante', x: 50 + i, y: 50 }));
  const layout = GraphLayout.place(crowd, { x: 0, y: 0, width: 900, height: 800 });
  assert.ok(layout.conflicts.length > 0);
  assert.ok(layout.boxes().overlappingPairs().length > 0);
});

test('an edge goes from the border of one box to the border of the other', () => {
  const area = { x: 0, y: 0, width: 1000, height: 500 };
  const layout = GraphLayout.place([{ id: 'a', label: 'A', x: 20, y: 50 }, { id: 'b', label: 'B', x: 80, y: 50 }], area);
  const [edge] = layout.edges([{ from: 'a', to: 'b' }]);
  const [first, second] = layout.nodes;
  assert.ok(edge.start.x >= first.rectangle.x + first.rectangle.width);
  assert.ok(edge.end.x <= second.rectangle.x);
  assert.equal(edge.start.y, 250);
});

test('an edge to an unknown node is a readable error', () => {
  const layout = GraphLayout.place([{ id: 'a', label: 'A', x: 20, y: 50 }], { x: 0, y: 0, width: 1000, height: 500 });
  assert.throws(() => layout.edges([{ from: 'a', to: 'zeta' }]), /nó "zeta"/);
});

test('with focus on the bad edges they turn red in 12 frames and pulse; without it nothing changes', () => {
  assert.deepEqual(GraphLayout.badFocus(undefined, 30), { focus: 0, pulse: 1 });
  assert.equal(GraphLayout.badFocus(true, 6).focus, 0.5);
  assert.equal(GraphLayout.badFocus(true, 24).focus, 1);
  assert.ok(GraphLayout.badFocus(true, 9).pulse > 1);
});
