import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderGrants } from '../../../src/main/services/FolderGrants.ts';

test('only granted folders (and folders inside them) are allowed', () => {
  const grants = new FolderGrants();
  assert.throws(() => grants.require('/p/cupom'), { code: 'invalid-request' });
  grants.grant('/p/cupom/');
  assert.equal(grants.require('/p/cupom'), '/p/cupom');
  assert.equal(grants.require('/p/cupom/sub'), '/p/cupom/sub');
  assert.throws(() => grants.require('/p/cupom-2'), { code: 'invalid-request', message: 'Esta pasta não foi aberta pelo Estúdio: /p/cupom-2' });
  assert.throws(() => grants.require('/p/cupom/../outra'), { code: 'invalid-request' });
  assert.throws(() => grants.require('/p'), { code: 'invalid-request' });
});
