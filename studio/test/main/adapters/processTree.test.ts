import { test } from 'node:test';
import assert from 'node:assert/strict';
import { descendantsIn } from '../../../src/main/adapters/processTree.ts';

test("every process under the worker is found (the installer and tar it started, and theirs), nobody else's", () => {
  const table = `
      1     0
    100     1
    200   100
    201   100
    300   200
    400     1
    500   400`;
  assert.deepEqual(descendantsIn(table, 100), [200, 300, 201]);
  assert.deepEqual(descendantsIn(table, 300), []);
  assert.deepEqual(descendantsIn('', 100), []);
});

test('killDescendants stops the grandchildren of a real process', { skip: process.platform === 'win32' }, async () => {
  const { spawn } = await import('node:child_process');
  const { killDescendants } = await import('../../../src/main/adapters/processTree.ts');
  const parent = spawn('sh', ['-c', 'sleep 60 & sleep 60 & wait'], { stdio: 'ignore' });
  await new Promise((done) => setTimeout(done, 300));
  const alive = (pid: number) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };
  const { execFileSync } = await import('node:child_process');
  const children = descendantsIn(execFileSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' }), parent.pid ?? 0);
  assert.equal(children.length, 2);
  await killDescendants(parent.pid ?? 0);
  await new Promise((done) => setTimeout(done, 300));
  assert.deepEqual(children.filter(alive), []);
  parent.kill();
});
