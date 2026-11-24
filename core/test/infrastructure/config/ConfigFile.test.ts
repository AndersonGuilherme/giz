import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG_PATH, ConfigFile } from '../../../src/infrastructure/config/ConfigFile.ts';
import { defaultConfig } from '../../../src/infrastructure/config/GizConfig.ts';

const folder = () => mkdtempSync(join(tmpdir(), 'giz-config-'));
const quiet = { env: {}, home: '/home/test', warn: () => undefined };

test('the file is giz.config.json at the repository root, the same one the motor used', () => {
  assert.equal(CONFIG_PATH, fileURLToPath(new URL('../../../../giz.config.json', import.meta.url)));
});

test('without the file the defaults apply (CPU, ~/.cache/giz, 0.6b) and a warning says how to configure', () => {
  const warnings: string[] = [];
  const config = new ConfigFile(join(folder(), 'giz.config.json'), { ...quiet, warn: (message) => warnings.push(message) }).load();
  assert.deepEqual(config, defaultConfig('/home/test'));
  assert.equal(config.device, 'cpu');
  assert.equal(config.modelsDir, '/home/test/.cache/giz');
  assert.match(warnings.join(), /giz setup/);
});

test('GIZ_QUIET silences the missing file warning', () => {
  const warnings: string[] = [];
  new ConfigFile(join(folder(), 'giz.config.json'), { env: { GIZ_QUIET: '1' }, home: '/h', warn: (message) => warnings.push(message) }).load();
  assert.deepEqual(warnings, []);
});

test('the file keys override the defaults, and the nested objects are merged key by key', () => {
  const path = join(folder(), 'giz.config.json');
  writeFileSync(path, JSON.stringify({ device: 'cuda', model: '1.7b', voices: { lia: 'serena' }, render: {} }));
  const config = new ConfigFile(path, quiet).load();
  assert.equal(config.device, 'cuda');
  assert.equal(config.model, '1.7b');
  assert.deepEqual(config.voices, { lia: 'serena', teo: 'dylan' });
  assert.deepEqual(config.render, { concurrency: null });
});

test('GIZ_MODELS_DIR and GIZ_DEVICE win over the file; an unknown device is ignored', () => {
  const path = join(folder(), 'giz.config.json');
  writeFileSync(path, JSON.stringify({ device: 'cuda', modelsDir: '/models' }));
  const config = new ConfigFile(path, { ...quiet, env: { GIZ_MODELS_DIR: '/elsewhere', GIZ_DEVICE: 'cpu' } }).load();
  assert.deepEqual([config.modelsDir, config.device], ['/elsewhere', 'cpu']);
  const unknown = new ConfigFile(path, { ...quiet, env: { GIZ_DEVICE: 'tpu' } }).load();
  assert.equal(unknown.device, 'cuda');
});

test('save writes indented JSON with a final newline, and keeps every key', () => {
  const path = join(folder(), 'giz.config.json');
  const file = new ConfigFile(path, quiet);
  const config = { ...defaultConfig('/h'), brand: 'meu canal' };
  file.save(config);
  assert.equal(readFileSync(path, 'utf8'), `${JSON.stringify(config, null, 2)}\n`);
  assert.equal(file.exists(), true);
  assert.deepEqual(file.load(), config);
});

test('a file that is not JSON gives a readable error with the path', () => {
  const path = join(folder(), 'giz.config.json');
  writeFileSync(path, '{ quebrado');
  assert.throws(() => new ConfigFile(path, quiet).load(), (error: Error) => error.message.includes(path));
});
