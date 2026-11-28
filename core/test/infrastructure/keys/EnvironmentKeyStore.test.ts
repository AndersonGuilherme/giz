import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EnvironmentKeyStore } from '../../../src/infrastructure/keys/EnvironmentKeyStore.ts';
import { requiredKey } from '../../../src/infrastructure/keys/requiredKey.ts';

function home(files: Record<string, string> = {}): string {
  const folder = mkdtempSync(join(tmpdir(), 'gizzy-keys-'));
  mkdirSync(join(folder, '.config', 'gizzycera'), { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(folder, '.config', 'gizzycera', name), content);
  return folder;
}

test('the key comes from the environment variable first, then from ~/.config/gizzycera/<service>.key, trimmed', () => {
  const folder = home({ 'openai.key': '  sk-do-arquivo\n' });
  assert.equal(new EnvironmentKeyStore({ env: {}, home: folder }).get('openai'), 'sk-do-arquivo');
  assert.equal(new EnvironmentKeyStore({ env: { OPENAI_API_KEY: 'sk-da-env' }, home: folder }).get('openai'), 'sk-da-env');
  assert.equal(new EnvironmentKeyStore({ env: { ANTHROPIC_API_KEY: ' a ' }, home: folder }).get('anthropic'), 'a');
  assert.equal(new EnvironmentKeyStore({ env: { GEMINI_API_KEY: 'g' }, home: folder }).get('gemini'), 'g');
});

test('a missing, empty or unreadable key is undefined, never an exception', () => {
  const folder = home({ 'gemini.key': ' \n' });
  mkdirSync(join(folder, '.config', 'gizzycera', 'fish.key')); // a folder where the file should be: unreadable
  const store = new EnvironmentKeyStore({ env: { ANTHROPIC_API_KEY: '   ' }, home: folder });
  assert.equal(store.get('anthropic'), undefined);
  assert.equal(store.get('gemini'), undefined);
  assert.equal(store.get('fish'), undefined);
  assert.equal(store.get('elevenlabs'), undefined);
});

test('the hint says where to put the key, and a required missing key fails with it', () => {
  const folder = home();
  const store = new EnvironmentKeyStore({ env: {}, home: folder });
  assert.match(store.hint('anthropic'), /defina ANTHROPIC_API_KEY ou crie .*\.config\/gizzycera\/anthropic\.key/);
  assert.throws(() => requiredKey(store, 'anthropic'), /chave da anthropic não encontrada: defina ANTHROPIC_API_KEY/);
  assert.equal(requiredKey(new EnvironmentKeyStore({ env: { FISH_API_KEY: 'f' }, home: folder }), 'fish'), 'f');
});
