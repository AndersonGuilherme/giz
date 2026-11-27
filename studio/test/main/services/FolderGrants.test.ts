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

test('allows compares real paths: a link inside a granted folder that points outside is refused, also for a file not written yet', async () => {
  const { mkdtemp, mkdir, symlink, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const root = await mkdtemp(join(tmpdir(), 'giz-grants-'));
  const [project, outside] = [join(root, 'project'), join(root, 'outside')];
  await Promise.all([mkdir(join(project, 'scenes'), { recursive: true }), mkdir(outside)]);
  await writeFile(join(outside, 'secret.png'), 'x');
  await symlink(outside, join(project, 'scenes', 'link'));
  await symlink(join(outside, 'secret.png'), join(project, 'scenes', 'file.png'));
  const grants = new FolderGrants();
  grants.grant(project);
  assert.equal(grants.allows(join(project, 'scenes', 'own.png')), true, 'a file not written yet, inside');
  assert.equal(grants.allows(join(project, 'scenes', 'link', 'secret.png')), false, 'through a linked folder');
  assert.equal(grants.allows(join(project, 'scenes', 'link', 'new', 'x.png')), false, 'not written yet, under a linked folder');
  assert.equal(grants.allows(join(project, 'scenes', 'file.png')), false, 'a linked file');
  const linkedGrant = new FolderGrants();
  await symlink(project, join(root, 'alias'));
  linkedGrant.grant(join(root, 'alias'));
  assert.equal(linkedGrant.allows(join(project, 'scenes', 'own.png')), true, 'a granted folder reached through a link is the same folder');
});
