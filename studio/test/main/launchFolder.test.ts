import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launchFolderOf } from '../../src/main/launchFolder.ts';

test('the project folder comes from --project=<folder>, or null', () => {
  assert.equal(launchFolderOf(['electron', '.', '--project=/p/cupom']), '/p/cupom');
  assert.equal(launchFolderOf(['electron', '.']), null);
  assert.equal(launchFolderOf(['gizzycera', '--project=']), null, 'an empty value names no folder');
});

test('a second launch: Chromium may move the switch among its own; a relative folder is read from where it was launched', () => {
  const argv = ['/opt/gizzycera/gizzycera', '--allow-file-access-from-files', '--project=projetos/cupom', '--original-process-start-time=1'];
  assert.equal(launchFolderOf(argv, '/home/ana'), '/home/ana/projetos/cupom');
  assert.equal(launchFolderOf(['gizzycera', '--project=/p/a b/c'], '/home/ana'), '/p/a b/c');
  assert.equal(launchFolderOf(['gizzycera', '--project=../outro'], '/home/ana/Gizzycera'), '/home/ana/outro');
});
