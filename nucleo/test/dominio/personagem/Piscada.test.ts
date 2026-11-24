import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Piscada } from '../../../src/dominio/personagem/Piscada.ts';
import { Fps, Quadro } from '../../../src/dominio/valores/Tempo.ts';

function fechamentos(semente: string, total: number): number[] {
  const piscada = Piscada.para(semente);
  return Array.from({ length: total }, (_, numero) => piscada.fechamentoEm(Quadro.de(numero), Fps.PADRAO));
}

function sequenciasFechadas(valores: number[]): number[][] {
  const sequencias: number[][] = [];
  valores.forEach((valor, numero) => {
    if (valor <= 0) return;
    const continua = valores[numero - 1]! > 0;
    if (continua) sequencias[sequencias.length - 1]!.push(numero);
    if (!continua) sequencias.push([numero]);
  });
  return sequencias;
}

test('piscada é determinística pela semente', () => {
  assert.deepEqual(fechamentos('lia', 900), fechamentos('lia', 900));
  assert.notDeepEqual(fechamentos('lia', 900), fechamentos('leo', 900));
});
test('cada piscada fecha por 4 quadros consecutivos acima de 0,5', () => {
  const sequencias = sequenciasFechadas(fechamentos('lia', 1800));
  assert.ok(sequencias.length >= 8);
  sequencias.forEach((quadros) => assert.equal(quadros.length, 4));
  const valores = fechamentos('lia', 1800);
  sequencias.forEach((quadros) => quadros.forEach((q) => assert.ok(valores[q]! > 0.5 && valores[q]! <= 1)));
});
test('intervalo entre piscadas fica entre 2,5 e 5,5 s', () => {
  const inicios = sequenciasFechadas(fechamentos('lia', 3000)).map((quadros) => quadros[0]!);
  for (let numero = 1; numero < inicios.length; numero++) {
    const segundos = (inicios[numero]! - inicios[numero - 1]!) / 30;
    assert.ok(segundos >= 2.5 && segundos <= 5.5, `intervalo ${segundos}`);
  }
});
test('olhos abertos no começo', () => assert.equal(fechamentos('lia', 60).filter((valor) => valor > 0).length, 0));
