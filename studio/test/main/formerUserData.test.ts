import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { formerUserDataIn, migrateFormerUserData } from '../../src/main/formerUserData.ts';

const scratch = () => mkdtempSync(join(tmpdir(), 'gizzy-userdata-'));

test("the old userData is giz-estudio (or the first builds' giz Estúdio); none: undefined", () => {
  const appData = scratch();
  assert.equal(formerUserDataIn(appData), undefined);
  mkdirSync(join(appData, 'giz Estúdio'));
  assert.equal(formerUserDataIn(appData), join(appData, 'giz Estúdio'));
  mkdirSync(join(appData, 'giz-estudio'));
  assert.equal(formerUserDataIn(appData), join(appData, 'giz-estudio'), 'the newer one first');
});

function oldUserData(appData: string): string {
  const former = join(appData, 'giz-estudio');
  mkdirSync(join(former, 'portraits'), { recursive: true });
  mkdirSync(join(former, 'whisper', 'big'), { recursive: true });
  mkdirSync(join(former, 'Cache'), { recursive: true });
  writeFileSync(join(former, 'studio.json'), '{"projectsFolder":"/home/ana/giz/projetos","firstRunDone":true}');
  writeFileSync(join(former, 'keys.json'), '{"anthropic":"c2VsYWRh"}', { mode: 0o600 });
  writeFileSync(join(former, 'projects.json'), '["/home/ana/outro"]');
  writeFileSync(join(former, 'Local State'), '{"os_crypt":{}}', { mode: 0o600 });
  writeFileSync(join(former, 'portraits', 'bia.png'), 'png');
  writeFileSync(join(former, 'whisper', 'big', 'model.onnx'), 'x');
  return former;
}

test('first run of Gizzycera: the settings, sealed keys, opened projects and portraits are COPIED; the caches are not; the old folder stays', () => {
  const appData = scratch();
  const former = oldUserData(appData);
  const now = join(appData, 'gizzycera');
  assert.deepEqual(migrateFormerUserData({ former, now }), [`${former} → ${now}`]);
  assert.equal(readFileSync(join(now, 'studio.json'), 'utf8'), '{"projectsFolder":"/home/ana/giz/projetos","firstRunDone":true}', 'the projects folder stays where it was');
  assert.equal(readFileSync(join(now, 'keys.json'), 'utf8'), '{"anthropic":"c2VsYWRh"}');
  assert.equal(statSync(join(now, 'keys.json')).mode & 0o777, 0o600);
  assert.equal(readFileSync(join(now, 'projects.json'), 'utf8'), '["/home/ana/outro"]');
  assert.ok(existsSync(join(now, 'Local State')), "the keychain key's wrapper on Windows goes with the keys");
  assert.equal(readFileSync(join(now, 'portraits', 'bia.png'), 'utf8'), 'png');
  assert.equal(existsSync(join(now, 'whisper')), false, 'Whisper is read from the old folder instead (see coreEnvironmentOf)');
  assert.equal(existsSync(join(now, 'Cache')), false);
  assert.ok(existsSync(join(former, 'studio.json')) && existsSync(join(former, 'keys.json')), 'nothing old is deleted');
});

test('the copy happens once: an existing new userData is never touched; without an old one there is nothing to do', () => {
  const appData = scratch();
  const former = oldUserData(appData);
  const now = join(appData, 'gizzycera');
  mkdirSync(now);
  writeFileSync(join(now, 'studio.json'), '{"firstRunDone":false}');
  assert.deepEqual(migrateFormerUserData({ former, now }), []);
  assert.equal(readFileSync(join(now, 'studio.json'), 'utf8'), '{"firstRunDone":false}');
  assert.deepEqual(migrateFormerUserData({ former: undefined, now: join(scratch(), 'gizzycera') }), []);
});
