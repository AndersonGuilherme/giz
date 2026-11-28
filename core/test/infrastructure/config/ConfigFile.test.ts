import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG_PATH, ConfigFile, configPath } from '../../../src/infrastructure/config/ConfigFile.ts';
import { defaultConfig } from '../../../src/infrastructure/config/GizzyConfig.ts';

const folder = () => mkdtempSync(join(tmpdir(), 'gizzy-config-'));
const quiet = { env: {}, home: '/home/test', warn: () => undefined };

test('the file is gizzycera.config.json at the repository root, where the motor kept its giz.config.json', () => {
  assert.equal(CONFIG_PATH, fileURLToPath(new URL('../../../../gizzycera.config.json', import.meta.url)));
});

test('GIZZY_CONFIG names another file (the installed Studio keeps it in ~/.config/gizzycera); blank or absent: the repository one', () => {
  const none = { exists: () => false, home: '/home/x' };
  assert.equal(configPath({ GIZZY_CONFIG: '/home/x/.config/gizzycera/gizzycera.config.json' }, none), '/home/x/.config/gizzycera/gizzycera.config.json');
  assert.equal(configPath({ GIZZY_CONFIG: '  ' }, none), CONFIG_PATH);
  assert.equal(configPath({}, none), CONFIG_PATH);
});

test("without a repository file, the CLI reads the installed Studio's (~/.config/gizzycera/gizzycera.config.json): one configuration for both", () => {
  const studioFile = join('/home/x', '.config', 'gizzycera', 'gizzycera.config.json');
  assert.equal(configPath({}, { exists: (path) => path === studioFile, home: '/home/x' }), studioFile);
  assert.equal(configPath({}, { exists: () => true, home: '/home/x' }), CONFIG_PATH, 'the repository file wins when there is one');
});

test('without the file the defaults apply (CPU, ~/.cache/gizzycera, 0.6b) and a warning says how to configure', () => {
  const warnings: string[] = [];
  const config = new ConfigFile(join(folder(), 'gizzycera.config.json'), { ...quiet, warn: (message) => warnings.push(message) }).load();
  assert.deepEqual(config, defaultConfig('/home/test'));
  assert.equal(config.device, 'cpu');
  assert.equal(config.modelsDir, '/home/test/.cache/gizzycera');
  assert.match(warnings.join(), /gizzy setup/);
});

test('GIZZY_QUIET silences the missing file warning', () => {
  const warnings: string[] = [];
  new ConfigFile(join(folder(), 'gizzycera.config.json'), { env: { GIZZY_QUIET: '1' }, home: '/h', warn: (message) => warnings.push(message) }).load();
  assert.deepEqual(warnings, []);
});

test('the file keys override the defaults, and the nested objects are merged key by key', () => {
  const path = join(folder(), 'gizzycera.config.json');
  writeFileSync(path, JSON.stringify({ device: 'cuda', model: '1.7b', voices: { lia: 'serena' }, render: {} }));
  const config = new ConfigFile(path, quiet).load();
  assert.equal(config.device, 'cuda');
  assert.equal(config.model, '1.7b');
  assert.deepEqual(config.voices, { lia: 'serena', teo: 'dylan' });
  assert.deepEqual(config.render, { concurrency: null });
});

test('GIZZY_MODELS_DIR and GIZZY_DEVICE win over the file; an unknown device is ignored', () => {
  const path = join(folder(), 'gizzycera.config.json');
  writeFileSync(path, JSON.stringify({ device: 'cuda', modelsDir: '/models' }));
  const config = new ConfigFile(path, { ...quiet, env: { GIZZY_MODELS_DIR: '/elsewhere', GIZZY_DEVICE: 'cpu' } }).load();
  assert.deepEqual([config.modelsDir, config.device], ['/elsewhere', 'cpu']);
  const unknown = new ConfigFile(path, { ...quiet, env: { GIZZY_DEVICE: 'tpu' } }).load();
  assert.equal(unknown.device, 'cuda');
});

test('save writes indented JSON with a final newline, and keeps every key', () => {
  const path = join(folder(), 'gizzycera.config.json');
  const file = new ConfigFile(path, quiet);
  const config = { ...defaultConfig('/h'), brand: 'meu canal' };
  file.save(config);
  assert.equal(readFileSync(path, 'utf8'), `${JSON.stringify(config, null, 2)}\n`);
  assert.equal(file.exists(), true);
  assert.deepEqual(file.load(), config);
});

test('save replaces the file whole through a temp file and a rename (a read-only old file is replaced, nothing else is left)', { skip: process.platform === 'win32' }, async () => {
  const { chmodSync, readdirSync, writeFileSync } = await import('node:fs');
  const where = folder();
  const path = join(where, 'gizzycera.config.json');
  writeFileSync(path, '{"model":"0.6b"}');
  chmodSync(path, 0o444);
  new ConfigFile(path, quiet).save({ ...defaultConfig('/h'), model: '1.7b' });
  assert.equal(new ConfigFile(path, quiet).load().model, '1.7b');
  assert.deepEqual(readdirSync(where), ['gizzycera.config.json']);
});

test('a file that is not JSON gives a readable error with the path', () => {
  const path = join(folder(), 'gizzycera.config.json');
  writeFileSync(path, '{ quebrado');
  assert.throws(() => new ConfigFile(path, quiet).load(), (error: Error) => error.message.includes(path));
});

test('saving creates the folder of the file (~/.config/gizzycera may not exist yet on a new machine)', () => {
  const path = join(folder(), 'new', 'gizzy', 'gizzycera.config.json');
  new ConfigFile(path, quiet).save(defaultConfig('/home/test'));
  assert.equal(JSON.parse(readFileSync(path, 'utf8')).device, 'cpu');
  if (process.platform !== 'win32') assert.equal(statSync(join(path, '..')).mode & 0o777, 0o700, 'a new folder only its owner reads (it sits beside the key files)');
});
