import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultProjectsFolderIn, keyFolderIn, studioPathsOf, systemLanguageOf } from '../../src/main/studioPaths.ts';

test('normally the real home, userData and giz.config.json; GIZ_STUDIO_HOME isolates all three', () => {
  assert.deepEqual(studioPathsOf({}, '/home/ana'), { home: '/home/ana', rehearsal: false });
  assert.deepEqual(studioPathsOf({ GIZ_STUDIO_HOME: '/tmp/s', GIZ_STUDIO_REHEARSAL: '1' }, '/home/ana'), {
    home: '/tmp/s', userData: '/tmp/s/userData', gizConfig: '/tmp/s/giz.config.json', rehearsal: true,
  });
  assert.equal(defaultProjectsFolderIn('/home/ana'), '/home/ana/giz/projetos');
  assert.equal(keyFolderIn('/home/ana'), '/home/ana/.config/giz');
});

test('the first-run language follows the system: Portuguese for any pt locale, English otherwise', () => {
  assert.equal(systemLanguageOf('pt-BR'), 'pt-BR');
  assert.equal(systemLanguageOf('pt-PT'), 'pt-BR');
  assert.equal(systemLanguageOf('en-US'), 'en');
  assert.equal(systemLanguageOf('de'), 'en');
});

test("core's settings for this run: the installed app keeps giz.config.json in ~/.config/giz and Whisper in userData", async () => {
  const { coreEnvironmentOf } = await import('../../src/main/studioPaths.ts');
  const normal = studioPathsOf({}, '/home/ana');
  // A checkout: core's own giz.config.json at the repository root and transformers' own cache.
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: false, userData: '/home/ana/.config/giz-studio', env: {} }), {});
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: true, userData: '/home/ana/.config/giz-studio', env: {} }), {
    GIZ_CONFIG: '/home/ana/.config/giz/giz.config.json', GIZ_WHISPER_CACHE: '/home/ana/.config/giz-studio/whisper',
  });
  // An isolated home: its own file, for the workers too.
  const isolated = studioPathsOf({ GIZ_STUDIO_HOME: '/tmp/s' }, '/home/ana');
  assert.deepEqual(coreEnvironmentOf(isolated, { packaged: false, userData: '/tmp/s/userData', env: {} }), { GIZ_CONFIG: '/tmp/s/giz.config.json' });
  assert.deepEqual(coreEnvironmentOf(isolated, { packaged: true, userData: '/tmp/s/userData', env: {} }), {
    GIZ_CONFIG: '/tmp/s/giz.config.json', GIZ_WHISPER_CACHE: '/tmp/s/userData/whisper',
  });
  // What the person set by hand stays.
  assert.deepEqual(coreEnvironmentOf(normal, { packaged: true, userData: '/u', env: { GIZ_CONFIG: '/mine.json', GIZ_WHISPER_CACHE: '/w' } }), {});
});
