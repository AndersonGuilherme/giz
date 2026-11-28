import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { KeyService } from '../../../src/main/services/KeyService.ts';
import { FakeCipher, InMemoryVault } from '../../doubles/fakes.ts';
import { FakeChecker, InMemoryKeyFiles } from '../../doubles/settingsFakes.ts';

const SECRET = 'sk-test-0123456789';

function keyService(options: { secure?: boolean; vault?: InMemoryVault } = {}) {
  const vault = options.vault ?? new InMemoryVault();
  const files = new InMemoryKeyFiles();
  const checker = new FakeChecker();
  const service = new KeyService({ cipher: new FakeCipher(options.secure ?? true), vault, files, checker });
  return { service, vault, files, checker };
}

test('set keeps the key encrypted in the keychain vault, the status sees it, remove forgets it', async () => {
  const { service: keys, vault, files } = keyService();
  const stored = async () => (await keys.status()).keys.openai;
  assert.equal(await stored(), null);
  assert.equal(await keys.set('openai', SECRET), 'keychain');
  assert.equal(await stored(), 'keychain');
  assert.equal(JSON.stringify(vault.keys).includes(SECRET), false);
  assert.equal(files.files.size, 0);
  assert.equal(await keys.remove('openai'), true);
  assert.equal(await stored(), null);
  assert.equal(await keys.remove('openai'), false);
});

test('setting one provider keeps the others', async () => {
  const { service: keys, vault } = keyService();
  await keys.set('openai', 'a-key');
  await keys.set('anthropic', 'b-key');
  await keys.remove('openai');
  assert.deepEqual(Object.keys(vault.keys), ['anthropic']);
});

test('without a system keychain the key goes to the CLI file (ruling S2) and the vault is never written', async () => {
  const { service: keys, vault, files } = keyService({ secure: false });
  assert.equal(await keys.set('elevenlabs', `  ${SECRET} `), 'file');
  assert.equal(files.files.get('elevenlabs'), SECRET);
  assert.equal(vault.writes, 0);
  const status = await keys.status();
  assert.equal(status.secure, false);
  assert.equal(status.fileFolder, '/home/ana/.config/gizzycera');
  assert.equal(status.keys.elevenlabs, 'file');
  assert.equal(status.keys.openai, null);
  assert.deepEqual(status.testable, ['anthropic', 'openai', 'gemini']);
  assert.equal(await keys.remove('elevenlabs'), true);
  assert.equal(files.files.size, 0);
});

test('status lists every service and where its key is, never the key; a key the CLI already has counts', async () => {
  const { service: keys, files } = keyService();
  files.files.set('fish', 'from-the-cli');
  await keys.set('gemini', SECRET);
  const status = await keys.status();
  assert.deepEqual(status.keys, { anthropic: null, openai: null, gemini: 'keychain', fal: null, elevenlabs: null, fish: 'file' });
  assert.equal(JSON.stringify(status).includes(SECRET), false);
  assert.equal(JSON.stringify(status).includes('from-the-cli'), false);
});

test('test hands the saved key (decrypted) to the check and answers only the check result', async () => {
  const { service: keys, checker } = keyService();
  await keys.set('anthropic', 'good');
  const answer = await keys.test('anthropic');
  assert.deepEqual(answer, { model: 'claude-sonnet-5-5', inputTokens: 11, outputTokens: 2 });
  assert.deepEqual(checker.checked, [['anthropic', 'good']]);
});

test('test reads the file key without a keychain; a refused key fails with the service message', async () => {
  const { service: keys } = keyService({ secure: false });
  await keys.set('openai', 'wrong');
  await assert.rejects(keys.test('openai'), { code: 'failed', message: /a chave foi recusada \(401\)/ });
});

test('test without a key, or for a service with no check yet, says so without calling anything', async () => {
  const { service: keys, checker } = keyService();
  await assert.rejects(keys.test('gemini'), { code: 'invalid-request', message: 'Nenhuma chave guardada para este serviço.' });
  await keys.set('fal', SECRET);
  await assert.rejects(keys.test('fal'), { code: 'unavailable' });
  assert.equal(checker.checked.length, 0);
});

test('the key is never logged and no answer carries it', async () => {
  const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
  const spies = methods.map((method) => mock.method(console, method, () => undefined));
  const { service: keys } = keyService();
  const answers = [await keys.set('gemini', SECRET), await keys.status(), await keys.remove('gemini')];
  assert.equal(spies.reduce((calls, spy) => calls + spy.mock.callCount(), 0), 0);
  assert.equal(JSON.stringify(answers).includes(SECRET), false);
  spies.forEach((spy) => spy.mock.restore());
});

test('two keys set at the same time both survive (the read-modify-write runs one at a time)', async () => {
  const { service: keys, vault } = keyService({ vault: new InMemoryVault(5) });
  await Promise.all([keys.set('openai', 'a-key'), keys.set('anthropic', 'b-key'), keys.set('gemini', 'c-key')]);
  assert.deepEqual(Object.keys(vault.keys).sort(), ['anthropic', 'gemini', 'openai']);
  await Promise.all([keys.remove('openai'), keys.remove('gemini')]);
  assert.deepEqual(Object.keys(vault.keys), ['anthropic']);
});

test('a failed write does not block the next call', async () => {
  const { service: keys, vault } = keyService();
  vault.failNextWrite = true;
  await assert.rejects(keys.set('openai', 'a-key'));
  assert.equal(await keys.set('openai', 'a-key'), 'keychain');
});

test("with the keychain in use, remove forgets the Studio's key but never deletes a CLI key file it did not write", async () => {
  const { service: keys, vault, files } = keyService();
  files.files.set('openai', 'from-the-cli');
  await keys.set('openai', SECRET);
  assert.equal((await keys.status()).keys.openai, 'keychain');
  assert.equal(await keys.remove('openai'), true);
  assert.deepEqual(vault.keys, {});
  assert.equal(files.files.get('openai'), 'from-the-cli');
  assert.equal((await keys.status()).keys.openai, 'file', 'the CLI key is still there for the gizzy command');
  assert.equal(await keys.remove('openai'), false, 'a CLI file is not the Studio\'s to remove while it has a keychain');
  assert.equal(files.files.get('openai'), 'from-the-cli');
});

// A vault copied from giz Estúdio (before the rename): on macOS and Linux the keychain item is named after the app,
// so Gizzycera may not be able to open it. Such a key counts as missing (the CLI file, if any, still serves).
test('a sealed key this app cannot open (sealed under the old name) counts as missing; a CLI file key still serves', async () => {
  const vault = new InMemoryVault();
  vault.keys = { anthropic: 'not-sealed-here', openai: 'not-sealed-here' };
  const { service: keys, files } = keyService({ vault });
  files.files.set('openai', 'from-the-file');
  assert.equal(await keys.keyOf('anthropic'), undefined);
  assert.equal(await keys.keyOf('openai'), 'from-the-file');
  await assert.rejects(keys.test('anthropic'), { code: 'invalid-request' });
  assert.equal(await keys.set('anthropic', SECRET), 'keychain', 'setting it again replaces the unreadable one');
  assert.equal(await keys.keyOf('anthropic'), SECRET);
});
