import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PedidoDeVoz } from '../../../src/aplicacao/portas/ProvedorVoz.ts';
import { Audio } from '../../../src/dominio/fala/Audio.ts';
import { Idioma } from '../../../src/dominio/valores/Idioma.ts';
import { VozDeArquivo } from '../../../src/infraestrutura/voz/VozDeArquivo.ts';
import { paraWav } from '../../../src/infraestrutura/voz/wav.ts';

const pasta = await mkdtemp(join(tmpdir(), 'giz-gravacoes-'));
after(() => rm(pasta, { recursive: true, force: true }));
const pedido = (idFala: string): PedidoDeVoz => ({ idFala, texto: 'Oi', voz: 'eu', idioma: Idioma.PORTUGUES });

test('VozDeArquivo sem a gravação diz onde ela deveria estar', async () => {
  await assert.rejects(new VozDeArquivo(pasta).gerar(pedido('7')), /gravacoes\/7\.wav/);
});

test('VozDeArquivo lê a gravação da fala', async () => {
  await mkdir(join(pasta, 'gravacoes'), { recursive: true });
  await writeFile(join(pasta, 'gravacoes', '3.wav'), paraWav(Audio.de(new Float32Array(12000), 24000)));
  const audio = await new VozDeArquivo(pasta).gerar(pedido('3'));
  assert.equal(audio.duracao().valor(), 0.5);
});
