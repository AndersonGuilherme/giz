import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Corpo, type ContextoDoCorpo } from '../../../src/dominio/personagem/Corpo.ts';
import { Fps, Quadro } from '../../../src/dominio/valores/Tempo.ts';

const base: ContextoDoCorpo = { pose: 'neutra', inicioDaPose: Quadro.de(0), falando: false, abertura: 0, fase: 0, fps: Fps.PADRAO };
const corpo = new Corpo();

test('respiração fica em ±2 px e não gira nem escala', () => {
  for (let numero = 0; numero < 300; numero += 7) {
    const d = corpo.deslocamentoEm(Quadro.de(numero), base);
    assert.ok(Math.abs(d.y) <= 2 + 1e-9);
    assert.equal(d.rotacao, 0);
    assert.equal(d.escala, 1);
  }
});
test('o volume puxa o corpo até 5 px para cima, com rotação e escala leves', () => {
  const calado = corpo.deslocamentoEm(Quadro.de(30), base);
  const falando = corpo.deslocamentoEm(Quadro.de(30), { ...base, falando: true, abertura: 1 });
  assert.ok(Math.abs(falando.y - (calado.y - 5)) < 1e-9);
  assert.ok(Math.abs(falando.escala - 1.006) < 1e-9);
  assert.ok(Math.abs(falando.rotacao) <= 0.6);
});
test('sem falar, a abertura é ignorada', () => {
  assert.deepEqual(corpo.deslocamentoEm(Quadro.de(30), { ...base, abertura: 1 }), corpo.deslocamentoEm(Quadro.de(30), base));
});
test('comemorar sobe 18 px uma vez, no meio de 0,5 s', () => {
  const contexto = { ...base, pose: 'comemorar' } as const;
  const parado = corpo.deslocamentoEm(Quadro.de(15), base);
  const pico = corpo.deslocamentoEm(Quadro.de(15), { ...contexto, inicioDaPose: Quadro.de(7) });
  assert.ok(pico.y < parado.y - 17);
});
test('gesto da pose acontece uma vez: 2 s depois do início só sobra a respiração', () => {
  for (const pose of ['comemorar', 'levantar', 'acenar', 'explicar', 'apontar', 'ombros', 'mao-na-cabeca', 'maos-na-boca'] as const) {
    const depois = corpo.deslocamentoEm(Quadro.de(90), { ...base, pose, inicioDaPose: Quadro.de(30) });
    assert.deepEqual(depois, corpo.deslocamentoEm(Quadro.de(90), base), pose);
  }
});
test('acenar balança e se acalma; pensar mantém a cabeça inclinada', () => {
  const aceno = corpo.deslocamentoEm(Quadro.de(5), { ...base, pose: 'acenar' });
  assert.ok(Math.abs(aceno.rotacao) > 0.5);
  const pensando = corpo.deslocamentoEm(Quadro.de(600), { ...base, pose: 'pensar' });
  assert.ok(pensando.rotacao > 1.3);
});
test('fase muda a respiração', () => {
  assert.notEqual(corpo.deslocamentoEm(Quadro.de(30), base).y, corpo.deslocamentoEm(Quadro.de(30), { ...base, fase: 1.7 }).y);
});
