import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { KeyService } from '../../../src/main/services/KeyService.ts';
import { FakeCipher, InMemoryVault } from '../../doubles/fakes.ts';

const SECRET = 'sk-test-0123456789';

test('set keeps the key encrypted, has sees it, remove forgets it', async () => {
  const vault = new InMemoryVault();
  const keys = new KeyService({ cipher: new FakeCipher(), vault });
  assert.equal(await keys.has('openai'), false);
  assert.equal(await keys.set('openai', SECRET), true);
  assert.equal(await keys.has('openai'), true);
  assert.equal(JSON.stringify(vault.keys).includes(SECRET), false);
  assert.equal(await keys.remove('openai'), true);
  assert.equal(await keys.has('openai'), false);
  assert.equal(await keys.remove('openai'), false);
});

test('setting one provider keeps the others', async () => {
  const vault = new InMemoryVault();
  const keys = new KeyService({ cipher: new FakeCipher(), vault });
  await keys.set('openai', 'a-key');
  await keys.set('anthropic', 'b-key');
  await keys.remove('openai');
  assert.deepEqual(Object.keys(vault.keys), ['anthropic']);
});

test('without system encryption the key is refused and nothing is written', async () => {
  const vault = new InMemoryVault();
  const keys = new KeyService({ cipher: new FakeCipher(false), vault });
  await assert.rejects(keys.set('openai', SECRET), { code: 'unavailable' });
  assert.equal(vault.writes, 0);
});

test('the key is never logged and no answer carries it', async () => {
  const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
  const spies = methods.map((method) => mock.method(console, method, () => undefined));
  const keys = new KeyService({ cipher: new FakeCipher(), vault: new InMemoryVault() });
  const answers = [await keys.set('google', SECRET), await keys.has('google'), await keys.remove('google')];
  assert.equal(spies.reduce((calls, spy) => calls + spy.mock.callCount(), 0), 0);
  assert.equal(JSON.stringify(answers).includes(SECRET), false);
  spies.forEach((spy) => spy.mock.restore());
});

test('two keys set at the same time both survive (the read-modify-write runs one at a time)', async () => {
  const vault = new InMemoryVault(5);
  const keys = new KeyService({ cipher: new FakeCipher(), vault });
  await Promise.all([keys.set('openai', 'a-key'), keys.set('anthropic', 'b-key'), keys.set('google', 'c-key')]);
  assert.deepEqual(Object.keys(vault.keys).sort(), ['anthropic', 'google', 'openai']);
  await Promise.all([keys.remove('openai'), keys.remove('google')]);
  assert.deepEqual(Object.keys(vault.keys), ['anthropic']);
});

test('a failed write does not block the next call', async () => {
  const vault = new InMemoryVault();
  const keys = new KeyService({ cipher: new FakeCipher(), vault });
  vault.failNextWrite = true;
  await assert.rejects(keys.set('openai', 'a-key'));
  assert.equal(await keys.set('openai', 'a-key'), true);
});
