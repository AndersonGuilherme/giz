import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EstadoDoPersonagem } from '../../../src/dominio/personagem/EstadoDoPersonagem.ts';

test('guarda o que define o personagem no quadro', () => {
  const estado = EstadoDoPersonagem.de({
    pose: 'acenar', expressao: 'feliz', olhar: 'camera', falando: true, visema: 'A', abertura: 0.8, piscada: 0,
    corpo: { y: -1, rotacao: 0.2, escala: 1.004 },
  });
  assert.equal(estado.pose(), 'acenar');
  assert.equal(estado.expressao(), 'feliz');
  assert.equal(estado.olhaPara(), 'camera');
  assert.ok(estado.estaFalando());
  assert.equal(estado.visema(), 'A');
  assert.equal(estado.abertura(), 0.8);
  assert.equal(estado.fechamentoDosOlhos(), 0);
  assert.equal(estado.deslocamentoDoCorpo().y, -1);
});
