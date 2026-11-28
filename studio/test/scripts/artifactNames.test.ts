import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { asciiArtifactName, renameArtifacts } from '../../scripts/artifactNames.ts';

test('the installers get ASCII names: giz-estudio-…, no space nor accent (the Squirrel feed files keep theirs)', () => {
  assert.equal(asciiArtifactName('giz Estúdio-0.1.0-x64.AppImage'), 'giz-estudio-0.1.0-x64.AppImage');
  assert.equal(asciiArtifactName('giz Estúdio-linux-x64-0.1.0.zip'), 'giz-estudio-linux-x64-0.1.0.zip');
  assert.equal(asciiArtifactName('giz Estúdio-0.1.0-arm64.dmg'), 'giz-estudio-0.1.0-arm64.dmg');
  assert.equal(asciiArtifactName('giz Estúdio-0.1.0 Setup.exe'), 'giz-estudio-0.1.0-Setup.exe');
  assert.equal(asciiArtifactName('giz-estudio_0.1.0_amd64.deb'), 'giz-estudio_0.1.0_amd64.deb');
  assert.equal(asciiArtifactName('giz_estudio-0.1.0-full.nupkg'), 'giz_estudio-0.1.0-full.nupkg');
  assert.equal(asciiArtifactName('RELEASES'), 'RELEASES');
});

test('the make results are renamed on disk and point at the new names', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-make-'));
  mkdirSync(join(folder, 'zip'));
  const zip = join(folder, 'zip', 'giz Estúdio-linux-x64-0.1.0.zip');
  writeFileSync(zip, 'z');
  const results = await renameArtifacts([{ artifacts: [zip], platform: 'linux', arch: 'x64' }]);
  assert.deepEqual(results[0].artifacts, [join(folder, 'zip', 'giz-estudio-linux-x64-0.1.0.zip')]);
  assert.deepEqual(readdirSync(join(folder, 'zip')), ['giz-estudio-linux-x64-0.1.0.zip']);
});
