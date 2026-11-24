import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from '@huggingface/transformers';
import type { Alinhador } from '../../../src/aplicacao/portas/Alinhador.ts';
import { Audio } from '../../../src/dominio/fala/Audio.ts';
import type { PalavraJson } from '../../../src/dominio/fala/PalavraJson.ts';
import type { Palavras } from '../../../src/dominio/fala/Palavras.ts';
import { Idioma } from '../../../src/dominio/valores/Idioma.ts';
import { AlinhadorPorEnvelope } from '../../../src/infraestrutura/alinhamento/AlinhadorPorEnvelope.ts';
import { AlinhadorWhisper, type Ouvido } from '../../../src/infraestrutura/alinhamento/AlinhadorWhisper.ts';
import { MODELO_DO_WHISPER, OuvidoWhisper } from '../../../src/infraestrutura/alinhamento/OuvidoWhisper.ts';
import { deWav } from '../../../src/infraestrutura/voz/wav.ts';

const som = Audio.de(new Float32Array(24000), 24000);

class OuvidoFalso implements Ouvido {
  readonly idiomas: Idioma[] = [];
  readonly #ouvidas: PalavraJson[];

  constructor(ouvidas: PalavraJson[]) {
    this.#ouvidas = ouvidas;
  }

  async ouvir(_audio: Audio, idioma: Idioma): Promise<PalavraJson[]> {
    this.idiomas.push(idioma);
    return this.#ouvidas;
  }
}

class ReservaFalsa implements Alinhador {
  chamadas = 0;

  async alinhar(_audio: Audio, texto: string): Promise<Palavras> {
    this.chamadas++;
    return new AlinhadorPorEnvelope().alinhar(som, texto);
  }
}

test('AlinhadorWhisper reconcilia o que ouviu com o texto do roteiro', async () => {
  const reserva = new ReservaFalsa();
  const ouvido = new OuvidoFalso([{ texto: ' ola', inicio: 0, fim: 0.3 }, { texto: ' teu', inicio: 0.3, fim: 0.6 }]);
  const palavras = await new AlinhadorWhisper(reserva, ouvido).alinhar(som, 'Olá, Téo!', Idioma.INGLES);
  assert.deepEqual(palavras.paraJson(), [{ texto: 'Olá,', inicio: 0, fim: 0.3 }, { texto: 'Téo!', inicio: 0.3, fim: 0.6 }]);
  assert.equal(reserva.chamadas, 0);
  assert.deepEqual(ouvido.idiomas, [Idioma.INGLES]);
});

test('AlinhadorWhisper cai para a reserva quando o alinhamento é ruim demais', async () => {
  const reserva = new ReservaFalsa();
  const ouvido = new OuvidoFalso([{ texto: 'banana', inicio: 0, fim: 1 }]);
  const palavras = await new AlinhadorWhisper(reserva, ouvido).alinhar(som, 'um dois três quatro', Idioma.PORTUGUES);
  assert.equal(reserva.chamadas, 1);
  assert.deepEqual(palavras.textos(), ['um', 'dois', 'três', 'quatro']);
});

class OuvidoQueFalha implements Ouvido {
  async ouvir(): Promise<PalavraJson[]> {
    throw new Error('sem rede para baixar o modelo');
  }
}

test('AlinhadorWhisper avisa e usa a reserva quando o Whisper falha', async () => {
  const reserva = new ReservaFalsa();
  const avisos: string[] = [];
  const alinhador = new AlinhadorWhisper(reserva, new OuvidoQueFalha(), (mensagem) => avisos.push(mensagem));
  const palavras = await alinhador.alinhar(som, 'um dois', Idioma.PORTUGUES);
  assert.equal(reserva.chamadas, 1);
  assert.deepEqual(palavras.textos(), ['um', 'dois']);
  assert.deepEqual(avisos, ['alinhamento por Whisper falhou (sem rede para baixar o modelo); usando o envelope da voz']);
});

test('AlinhadorWhisper sem quem avise também usa a reserva quando o Whisper falha', async () => {
  const reserva = new ReservaFalsa();
  await new AlinhadorWhisper(reserva, new OuvidoQueFalha()).alinhar(som, 'um', Idioma.PORTUGUES);
  assert.equal(reserva.chamadas, 1);
});

test('AlinhadorWhisper limita os tempos à duração do áudio', async () => {
  const ouvido = new OuvidoFalso([{ texto: 'um', inicio: 0, fim: 5 }]);
  const palavras = await new AlinhadorWhisper(new ReservaFalsa(), ouvido).alinhar(som, 'um', Idioma.PORTUGUES);
  assert.deepEqual(palavras.paraJson(), [{ texto: 'um', inicio: 0, fim: 1 }]);
});

// Integração com o modelo de verdade: só roda se ele já estiver no cache e a fixture já tiver voz.
const modeloBaixado = existsSync(join(env.cacheDir ?? '', MODELO_DO_WHISPER, 'config.json'));
const wavDaFixture = new URL('../../fixtures/projeto-minimo/voz/1.wav', import.meta.url);
const semModelo = `modelo ${MODELO_DO_WHISPER} não está em ${env.cacheDir} (baixa sozinho na primeira voz gerada)`;
const semVoz = 'a fixture não tem voz/1.wav (gere com: node src/apresentacao/cli/giz.ts voz test/fixtures/projeto-minimo)';
const pulo = !modeloBaixado ? semModelo : !existsSync(wavDaFixture) && semVoz;

test('OuvidoWhisper ouve a fala da fixture com o tempo de cada palavra', { skip: pulo || false, timeout: 120_000 }, async () => {
  const audio = deWav(readFileSync(wavDaFixture));
  const ouvido = new OuvidoWhisper();
  const ouvidas = await ouvido.ouvir(audio, Idioma.PORTUGUES);
  const reserva = new ReservaFalsa();
  const palavras = await new AlinhadorWhisper(reserva, ouvido).alinhar(audio, 'Oi, eu sou a Ana.', Idioma.PORTUGUES);
  assert.equal(reserva.chamadas, 0);
  assert.ok(ouvidas.length >= 4, JSON.stringify(ouvidas));
  assert.deepEqual(palavras.textos(), ['Oi,', 'eu', 'sou', 'a', 'Ana.']);
  assert.ok((palavras.paraJson().at(-1)?.fim ?? 0) <= audio.duracao().valor() + 0.05);
});
