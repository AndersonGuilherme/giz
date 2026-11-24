import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Idioma } from '../../../src/dominio/valores/Idioma.ts';
import { MapaDeVisemas } from '../../../src/dominio/fala/Visemas.ts';
import { FonetizadorEspeak } from '../../../src/infraestrutura/fonetica/FonetizadorEspeak.ts';

test('espeak fonetiza pt-BR e en (integração)', async () => {
  const f = new FonetizadorEspeak();
  assert.match(await f.ipa('olá mundo', Idioma.PORTUGUES), /ol/);
  assert.match(await f.ipa('hello world', Idioma.INGLES), /h/);
});
test('palavra inglesa no meio de fala pt-BR não quebra', async () => {
  const ipa = await new FonetizadorEspeak().ipa('fiz o deploy ontem', Idioma.PORTUGUES);
  assert.ok(MapaDeVisemas.para(Idioma.PORTUGUES).converter(ipa).texto().length > 8);
});
test('chamadas concorrentes com idiomas diferentes não misturam vozes', async () => {
  const f = new FonetizadorEspeak();
  const [pt, en] = await Promise.all([f.ipa('olá', Idioma.PORTUGUES), f.ipa('hello', Idioma.INGLES)]);
  assert.equal(pt, await f.ipa('olá', Idioma.PORTUGUES));
  assert.equal(en, await f.ipa('hello', Idioma.INGLES));
});
test('no inglês o æ continua vogal (não vira ɐ)', async () => {
  assert.match(await new FonetizadorEspeak().ipa('cat', Idioma.INGLES), /æ/);
});
test('mantém a pontuação entre os trechos', async () => {
  assert.match(await new FonetizadorEspeak().ipa('olá, mundo.', Idioma.PORTUGUES), /,.*\.$/);
});
