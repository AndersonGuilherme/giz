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
