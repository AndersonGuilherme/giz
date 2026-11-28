import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import * as studioPathsModule from '../../src/main/studioPaths.ts';
import { defaultProjectsFolderIn, keyFolderIn, studioPathsOf, systemLanguageOf, userDataIn } from '../../src/main/studioPaths.ts';

test('normally the real home, userData and giz.config.json; GIZ_STUDIO_HOME isolates all three', () => {
  assert.deepEqual(studioPathsOf({}, '/home/ana'), { home: '/home/ana', rehearsal: false });
  assert.deepEqual(studioPathsOf({ GIZ_STUDIO_HOME: '/tmp/s', GIZ_STUDIO_REHEARSAL: '1' }, '/home/ana'), {
    home: '/tmp/s', userData: join('/tmp/s', 'userData'), gizConfig: join('/tmp/s', 'giz.config.json'), rehearsal: true,
  });
  assert.equal(defaultProjectsFolderIn('/home/ana'), join('/home/ana', 'giz', 'projetos'));
  assert.equal(keyFolderIn('/home/ana'), join('/home/ana', '.config', 'giz'));
});

test('the first-run language follows the system: Portuguese for any pt locale, English otherwise', () => {
  assert.equal(systemLanguageOf('pt-BR'), 'pt-BR');
  assert.equal(systemLanguageOf('pt-PT'), 'pt-BR');
  assert.equal(systemLanguageOf('en-US'), 'en');
  assert.equal(systemLanguageOf('de'), 'en');
});

test("core's settings for this run: the installed app keeps giz.config.json in ~/.config/giz, Whisper and ONNX Runtime in userData", () => {
  const { coreEnvironmentOf } = studioPathsModule;
  const normal = studioPathsOf({}, '/home/ana');
  const userData = join('/home/ana', '.config', 'giz-estudio');
  // A checkout: core's own giz.config.json at the repository root, transformers' own cache, ONNX Runtime's own folder.
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: false, userData, env: {} }), {});
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: true, userData, env: {} }), {
    GIZ_CONFIG: join('/home/ana', '.config', 'giz', 'giz.config.json'), GIZ_WHISPER_CACHE: join(userData, 'whisper'), GIZ_ORT_DIR: join(userData, 'onnxruntime'),
  });
  // What the person set by hand stays.
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: true, userData, env: { GIZ_CONFIG: '/mine.json', GIZ_WHISPER_CACHE: '/w', GIZ_ORT_DIR: '/o' } }), {});
});

test("an isolated home's giz.config.json wins over one set outside, for main and the workers alike", () => {
  const { coreEnvironmentOf } = studioPathsModule;
  const isolated = studioPathsOf({ GIZ_STUDIO_HOME: '/tmp/s' }, '/home/ana');
  const userData = join('/tmp/s', 'userData');
  const outside = { GIZ_CONFIG: '/home/ana/.config/giz/giz.config.json' };
  assert.deepEqual(coreEnvironmentOf(isolated, { packaged: false, userData, env: outside }), { GIZ_CONFIG: join('/tmp/s', 'giz.config.json') });
  assert.deepEqual(coreEnvironmentOf(isolated, { packaged: true, userData, env: outside }), {
    GIZ_CONFIG: join('/tmp/s', 'giz.config.json'), GIZ_WHISPER_CACHE: join(userData, 'whisper'), GIZ_ORT_DIR: join(userData, 'onnxruntime'),
  });
});

test('userData has an ASCII name (giz-estudio) in the system folder; an isolated home keeps its own', () => {
  assert.equal(userDataIn(studioPathsOf({}, '/home/ana'), join('/home/ana', '.config')), join('/home/ana', '.config', 'giz-estudio'));
  assert.equal(userDataIn(studioPathsOf({ GIZ_STUDIO_HOME: '/tmp/s' }, '/home/ana'), '/x'), join('/tmp/s', 'userData'));
});
