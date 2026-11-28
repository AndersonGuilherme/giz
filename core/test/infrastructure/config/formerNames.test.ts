import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { formerEnvironment, migrateFormerSetup } from '../../../src/infrastructure/config/formerNames.ts';
import { defaultConfig } from '../../../src/infrastructure/config/GizzyConfig.ts';

const scratch = () => mkdtempSync(join(tmpdir(), 'gizzy-former-'));

test('a GIZ_* variable from before the rename gives its GIZZY_* name when that one is not set', () => {
  const env = { GIZ_CONFIG: '/old.json', GIZ_QUIET: '1', GIZZY_DEVICE: 'cuda', GIZ_DEVICE: 'cpu', GIZ_: 'x', PATH: '/bin' };
  assert.deepEqual(formerEnvironment(env), { GIZZY_CONFIG: '/old.json', GIZZY_QUIET: '1' });
  assert.deepEqual(formerEnvironment({ PATH: '/bin' }), {});
});

function oldSetup(home: string): string {
  const old = join(home, '.config', 'giz');
  mkdirSync(join(old, 'youtube'), { recursive: true, mode: 0o700 });
  writeFileSync(join(old, 'giz.config.json'), JSON.stringify({ brand: 'canal', modelsDir: join(home, '.cache', 'giz') }));
  writeFileSync(join(old, 'anthropic.key'), 'sk-ant-1', { mode: 0o600 });
  chmodSync(join(old, 'anthropic.key'), 0o600);
  writeFileSync(join(home, 'fish-secret'), 'fish-1', { mode: 0o600 });
  symlinkSync(join(home, 'fish-secret'), join(old, 'fish.key'));
  writeFileSync(join(old, 'youtube', 'client_secret.json'), '{}');
  return old;
}

test('first run after the rename: ~/.config/giz is COPIED to ~/.config/gizzycera (config renamed, keys mode 600, links kept); the old one stays', () => {
  const home = scratch();
  const old = oldSetup(home);
  const repository = join(home, 'repo');
  mkdirSync(repository);
  const copied = migrateFormerSetup({ home, repository });
  const now = join(home, '.config', 'gizzycera');
  assert.deepEqual(copied, [`${old} → ${now}`]);
  assert.equal(JSON.parse(readFileSync(join(now, 'gizzycera.config.json'), 'utf8')).brand, 'canal');
  assert.equal(existsSync(join(now, 'giz.config.json')), false, 'the copy holds only the new name');
  assert.equal(readFileSync(join(now, 'anthropic.key'), 'utf8'), 'sk-ant-1');
  assert.equal(statSync(join(now, 'anthropic.key')).mode & 0o777, 0o600);
  assert.ok(lstatSync(join(now, 'fish.key')).isSymbolicLink(), 'a linked key stays a link to the same file');
  assert.equal(readlinkSync(join(now, 'fish.key')), join(home, 'fish-secret'));
  assert.equal(readFileSync(join(now, 'youtube', 'client_secret.json'), 'utf8'), '{}');
  assert.equal(statSync(now).mode & 0o777, 0o700);
  assert.ok(existsSync(join(old, 'giz.config.json')) && existsSync(join(old, 'anthropic.key')), 'the old folder is never deleted');
});

test('on Linux the app data folder IS ~/.config/gizzycera: an existing folder gets the old files it lacks, never overwriting one', () => {
  const home = scratch();
  oldSetup(home);
  const now = join(home, '.config', 'gizzycera');
  mkdirSync(join(now, 'Cache'), { recursive: true });
  writeFileSync(join(now, 'studio.json'), '{}');
  writeFileSync(join(now, 'anthropic.key'), 'sk-ant-novo', { mode: 0o600 });
  const copied = migrateFormerSetup({ home, repository: join(home, 'repo') });
  assert.equal(copied.length, 1);
  assert.equal(readFileSync(join(now, 'anthropic.key'), 'utf8'), 'sk-ant-novo', 'a key set since stays');
  assert.equal(JSON.parse(readFileSync(join(now, 'gizzycera.config.json'), 'utf8')).brand, 'canal');
  assert.ok(lstatSync(join(now, 'fish.key')).isSymbolicLink());
  assert.equal(readFileSync(join(now, 'studio.json'), 'utf8'), '{}');
});

test('the copy from ~/.config/giz happens once: a file deleted since is not brought back; nothing old means nothing to do', () => {
  const home = scratch();
  oldSetup(home);
  const now = join(home, '.config', 'gizzycera');
  assert.equal(migrateFormerSetup({ home, repository: join(home, 'repo') }).length, 1);
  rmSync(join(now, 'anthropic.key'));
  assert.deepEqual(migrateFormerSetup({ home, repository: join(home, 'repo') }), []);
  assert.equal(existsSync(join(now, 'anthropic.key')), false);
  assert.deepEqual(migrateFormerSetup({ home: scratch(), repository: scratch() }), []);
});

test("the repository's giz.config.json is copied to gizzycera.config.json when only the old one exists", () => {
  const home = scratch();
  const repository = scratch();
  writeFileSync(join(repository, 'giz.config.json'), '{"brand":"t"}');
  const copied = migrateFormerSetup({ home, repository });
  assert.deepEqual(copied, [`${join(repository, 'giz.config.json')} → ${join(repository, 'gizzycera.config.json')}`]);
  assert.equal(readFileSync(join(repository, 'gizzycera.config.json'), 'utf8'), '{"brand":"t"}');
  assert.ok(existsSync(join(repository, 'giz.config.json')));
  writeFileSync(join(repository, 'gizzycera.config.json'), '{"brand":"novo"}');
  assert.deepEqual(migrateFormerSetup({ home, repository }), [], 'an existing new file is kept');
  assert.equal(readFileSync(join(repository, 'gizzycera.config.json'), 'utf8'), '{"brand":"novo"}');
});

test('the default models folder is ~/.cache/gizzycera, or the old ~/.cache/giz when only that one exists (no download again)', () => {
  const home = scratch();
  assert.equal(defaultConfig(home).modelsDir, join(home, '.cache', 'gizzycera'));
  mkdirSync(join(home, '.cache', 'giz'), { recursive: true });
  assert.equal(defaultConfig(home).modelsDir, join(home, '.cache', 'giz'));
  mkdirSync(join(home, '.cache', 'gizzycera'));
  assert.equal(defaultConfig(home).modelsDir, join(home, '.cache', 'gizzycera'));
});
