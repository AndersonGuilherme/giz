import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import * as studioPathsModule from '../../src/main/studioPaths.ts';
import { defaultProjectsFolderIn, keyFolderIn, studioPathsOf, systemLanguageOf, userDataIn } from '../../src/main/studioPaths.ts';

test('normally the real home, userData and gizzycera.config.json; GIZZY_STUDIO_HOME isolates all three', () => {
  assert.deepEqual(studioPathsOf({}, '/home/ana'), { home: '/home/ana', rehearsal: false });
  assert.deepEqual(studioPathsOf({ GIZZY_STUDIO_HOME: '/tmp/s', GIZZY_STUDIO_REHEARSAL: '1' }, '/home/ana'), {
    home: '/tmp/s', userData: join('/tmp/s', 'userData'), gizzyConfig: join('/tmp/s', 'gizzycera.config.json'), rehearsal: true,
  });
  assert.equal(defaultProjectsFolderIn('/home/ana', 'pt-BR'), join('/home/ana', 'Gizzycera', 'projetos'));
  assert.equal(defaultProjectsFolderIn('/home/ana', 'en'), join('/home/ana', 'Gizzycera', 'projects'));
  assert.equal(keyFolderIn('/home/ana'), join('/home/ana', '.config', 'gizzycera'));
});

test('the first-run language follows the system: Portuguese for any pt locale, English otherwise', () => {
  assert.equal(systemLanguageOf('pt-BR'), 'pt-BR');
  assert.equal(systemLanguageOf('pt-PT'), 'pt-BR');
  assert.equal(systemLanguageOf('en-US'), 'en');
  assert.equal(systemLanguageOf('de'), 'en');
});

test("core's settings for this run: the installed app keeps gizzycera.config.json in ~/.config/gizzycera, Whisper and ONNX Runtime in userData", () => {
  const { coreEnvironmentOf } = studioPathsModule;
  const normal = studioPathsOf({}, '/home/ana');
  const userData = join('/home/ana', '.config', 'gizzycera');
  // A checkout: core's own gizzycera.config.json at the repository root, transformers' own cache, ONNX Runtime's own folder.
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: false, userData, env: {} }), {});
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: true, userData, env: {} }), {
    GIZZY_CONFIG: join('/home/ana', '.config', 'gizzycera', 'gizzycera.config.json'), GIZZY_WHISPER_CACHE: join(userData, 'whisper'), GIZZY_ORT_DIR: join(userData, 'onnxruntime'),
  });
  // What the person set by hand stays.
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: true, userData, env: { GIZZY_CONFIG: '/mine.json', GIZZY_WHISPER_CACHE: '/w', GIZZY_ORT_DIR: '/o' } }), {});
});

test("an isolated home's gizzycera.config.json wins over one set outside, for main and the workers alike", () => {
  const { coreEnvironmentOf } = studioPathsModule;
  const isolated = studioPathsOf({ GIZZY_STUDIO_HOME: '/tmp/s' }, '/home/ana');
  const userData = join('/tmp/s', 'userData');
  const outside = { GIZZY_CONFIG: '/home/ana/.config/gizzycera/gizzycera.config.json' };
  assert.deepEqual(coreEnvironmentOf(isolated, { packaged: false, userData, env: outside }), { GIZZY_CONFIG: join('/tmp/s', 'gizzycera.config.json') });
  assert.deepEqual(coreEnvironmentOf(isolated, { packaged: true, userData, env: outside }), {
    GIZZY_CONFIG: join('/tmp/s', 'gizzycera.config.json'), GIZZY_WHISPER_CACHE: join(userData, 'whisper'), GIZZY_ORT_DIR: join(userData, 'onnxruntime'),
  });
});

test('userData has an ASCII name (gizzycera) in the system folder; an isolated home keeps its own', () => {
  assert.equal(userDataIn(studioPathsOf({}, '/home/ana'), join('/home/ana', '.config')), join('/home/ana', '.config', 'gizzycera'));
  assert.equal(userDataIn(studioPathsOf({ GIZZY_STUDIO_HOME: '/tmp/s' }, '/home/ana'), '/x'), join('/tmp/s', 'userData'));
});

test('installed after giz Estúdio: Whisper and the ONNX Runtime copy are read from the old userData while the new one has none (no download again)', () => {
  const { coreEnvironmentOf } = studioPathsModule;
  const normal = studioPathsOf({}, '/home/ana');
  const userData = join('/home/ana', '.config', 'gizzycera');
  const former = join('/home/ana', '.config', 'giz-estudio');
  const oldOnly = (path: string) => path.startsWith(former);
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: true, userData, env: {}, former, exists: oldOnly }), {
    GIZZY_CONFIG: join('/home/ana', '.config', 'gizzycera', 'gizzycera.config.json'), GIZZY_WHISPER_CACHE: join(former, 'whisper'), GIZZY_ORT_DIR: join(former, 'onnxruntime'),
  });
  const both = () => true;
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: true, userData, env: {}, former, exists: both }), {
    GIZZY_CONFIG: join('/home/ana', '.config', 'gizzycera', 'gizzycera.config.json'), GIZZY_WHISPER_CACHE: join(userData, 'whisper'), GIZZY_ORT_DIR: join(userData, 'onnxruntime'),
  }, 'the new ones win once they exist');
});
