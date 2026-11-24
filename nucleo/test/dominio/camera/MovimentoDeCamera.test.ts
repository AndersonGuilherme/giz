import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MovimentoDeCamera } from '../../../src/dominio/camera/MovimentoDeCamera.ts';
import { Quadro } from '../../../src/dominio/valores/Tempo.ts';

test('aproximar vai de zoom 1 a 1,3 e nunca abaixo de 1', () => {
  const m = MovimentoDeCamera.de({ tipo: 'aproximar', para: { x: 0, y: 0, zoom: 1.3 } });
  assert.equal(m.enquadramentoEm(0, Quadro.de(0)).zoom, 1);
  assert.equal(m.enquadramentoEm(1, Quadro.de(90)).zoom, 1.3);
  assert.ok(m.enquadramentoEm(0.5, Quadro.de(45)).zoom >= 1);
});
test('deslizar nunca mostra a borda: x limitado pela folga do zoom', () => {
  const m = MovimentoDeCamera.de({ tipo: 'deslizar', de: { x: -1, y: 0, zoom: 1.1 }, para: { x: 1, y: 0, zoom: 1.1 } });
  const e = m.enquadramentoEm(1, Quadro.de(0));
  assert.ok(Math.abs(e.x) <= (1.1 - 1) / 2 + 1e-9);
  assert.ok(Math.abs(m.enquadramentoEm(0, Quadro.de(0)).x) <= (1.1 - 1) / 2 + 1e-9);
});
test('zoom abaixo de 1 vira 1 e y também respeita a folga', () => {
  const m = MovimentoDeCamera.de({ tipo: 'parada', de: { x: 0.5, y: 0.5, zoom: 0.5 } });
  const e = m.enquadramentoEm(0, Quadro.de(0));
  assert.equal(e.zoom, 1);
  assert.equal(e.x, 0);
  assert.equal(e.y, 0);
});
test('tipo de câmera desconhecido lista os válidos', () => {
  assert.throws(() => MovimentoDeCamera.de({ tipo: 'girar' } as never), /aproximar.*tremer/);
});
test('afastar faz o caminho inverso: de 1,3 a 1', () => {
  const m = MovimentoDeCamera.de({ tipo: 'afastar' });
  assert.equal(m.enquadramentoEm(0, Quadro.de(0)).zoom, 1.3);
  assert.equal(m.enquadramentoEm(1, Quadro.de(0)).zoom, 1);
});
test('linear é proporcional e suave é ease-in-out', () => {
  const para = { x: 0, y: 0, zoom: 1.4 };
  const linear = MovimentoDeCamera.de({ tipo: 'aproximar', para, suavidade: 'linear' });
  const suave = MovimentoDeCamera.de({ tipo: 'aproximar', para, suavidade: 'suave' });
  assert.ok(Math.abs(linear.enquadramentoEm(0.25, Quadro.de(0)).zoom - 1.1) < 1e-9);
  assert.ok(suave.enquadramentoEm(0.25, Quadro.de(0)).zoom < 1.1);
  assert.ok(Math.abs(suave.enquadramentoEm(0.5, Quadro.de(0)).zoom - 1.2) < 1e-9);
});
test('seguir caminha até o alvo `para`', () => {
  const m = MovimentoDeCamera.de({ tipo: 'seguir', para: { x: 0.1, y: -0.1, zoom: 1.4 } });
  const meio = m.enquadramentoEm(0.5, Quadro.de(0));
  const fim = m.enquadramentoEm(1, Quadro.de(0));
  assert.ok(meio.x > 0 && meio.x < fim.x);
  assert.ok(Math.abs(fim.x - 0.1) < 1e-9 && Math.abs(fim.y + 0.1) < 1e-9);
});
test('tremer é determinístico por quadro, varia entre quadros e mantém zoom >= 1', () => {
  const m = MovimentoDeCamera.de({ tipo: 'tremer', intensidade: 2 });
  const a = m.enquadramentoEm(0.5, Quadro.de(10));
  const b = MovimentoDeCamera.de({ tipo: 'tremer', intensidade: 2 }).enquadramentoEm(0.5, Quadro.de(10));
  assert.deepEqual({ ...a }, { ...b });
  assert.notEqual(a.x, m.enquadramentoEm(0.5, Quadro.de(11)).x);
  assert.ok(a.zoom >= 1);
});
test('transformacaoCss descreve deslocamento, zoom e rotação', () => {
  const css = MovimentoDeCamera.de({ tipo: 'parada', de: { x: 0.05, y: 0, zoom: 1.2 } }).enquadramentoEm(0, Quadro.de(0)).transformacaoCss();
  assert.equal(css, 'translate(5%, 0%) scale(1.2) rotate(0deg)');
});
