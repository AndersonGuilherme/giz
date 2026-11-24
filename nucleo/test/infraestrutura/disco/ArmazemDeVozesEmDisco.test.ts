import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { VozGravada } from '../../../src/aplicacao/portas/ArmazemDeVozes.ts';
import { Audio } from '../../../src/dominio/fala/Audio.ts';
import { ArmazemDeVozesEmDisco } from '../../../src/infraestrutura/disco/ArmazemDeVozesEmDisco.ts';
import { deWav } from '../../../src/infraestrutura/voz/wav.ts';

const pasta = await mkdtemp(join(tmpdir(), 'giz-vozes-'));
after(() => rm(pasta, { recursive: true, force: true }));
const registro: VozGravada = { arquivo: 'voz/1.wav', hash: 'abc', duracaoSegundos: 0.5, envelope: [0, 1], visemas: 'XA' };

test('sem gravação, não há hash', () => {
  assert.equal(new ArmazemDeVozesEmDisco(pasta).hashGravado('1'), undefined);
});

test('grava voz/<id>.wav e voz/<id>.json e lê de volta', async () => {
  const armazem = new ArmazemDeVozesEmDisco(pasta);
  await armazem.gravar('1', registro, Audio.de(new Float32Array(12000), 24000));
  assert.deepEqual(await armazem.ler('1'), registro);
  assert.equal(armazem.hashGravado('1'), 'abc');
  assert.equal(deWav(await readFile(join(pasta, 'voz', '1.wav'))).duracao().valor(), 0.5);
});

test('sem o wav, o registro não vale', async () => {
  const armazem = new ArmazemDeVozesEmDisco(pasta);
  await armazem.gravar('2', registro, Audio.de(new Float32Array(10), 24000));
  await rm(join(pasta, 'voz', '2.wav'));
  assert.equal(armazem.hashGravado('2'), undefined);
});
