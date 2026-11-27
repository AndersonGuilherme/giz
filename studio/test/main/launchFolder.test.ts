import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launchFolderOf } from '../../src/main/launchFolder.ts';

test('the project folder comes from --project=<folder>, or null', () => {
  assert.equal(launchFolderOf(['electron', '.', '--project=/p/cupom']), '/p/cupom');
  assert.equal(launchFolderOf(['electron', '.']), null);
});
