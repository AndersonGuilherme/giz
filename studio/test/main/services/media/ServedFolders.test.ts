import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderGrants } from '../../../../src/main/services/FolderGrants.ts';
import { ServedFolders } from '../../../../src/main/services/media/ServedFolders.ts';

test('the samples folder is served by the media scheme, but it is not a granted project folder', () => {
  const grants = new FolderGrants();
  grants.grant('/projects');
  const served = new ServedFolders(grants);
  const samples = served.serve('/user/samples/');
  assert.equal(samples, '/user/samples');
  assert.equal(served.allows('/user/samples/ab12.wav'), true);
  assert.equal(served.allows('/projects/cats/voice/1.wav'), true, 'a granted folder is served too');
  assert.equal(served.allows('/user/keys.json'), false);
  assert.throws(() => grants.require('/user/samples'), { code: 'invalid-request' }, 'no stage can open, check or write it as a project');
});
