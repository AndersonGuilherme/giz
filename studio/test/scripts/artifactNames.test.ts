import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { asciiArtifactName, renameArtifacts } from '../../scripts/artifactNames.ts';

test('the installers get lowercase ASCII names: gizzycera-…, no space (the Squirrel feed files keep theirs)', () => {
  assert.equal(asciiArtifactName('Gizzycera-0.1.0-x64.AppImage'), 'gizzycera-0.1.0-x64.AppImage');
  assert.equal(asciiArtifactName('Gizzycera-linux-x64-0.1.0.zip'), 'gizzycera-linux-x64-0.1.0.zip');
  assert.equal(asciiArtifactName('Gizzycera-darwin-arm64-0.1.0.zip'), 'gizzycera-darwin-arm64-0.1.0.zip');
  assert.equal(asciiArtifactName('Gizzycera-0.1.0-arm64.dmg'), 'gizzycera-0.1.0-arm64.dmg');
  assert.equal(asciiArtifactName('Gizzycera-0.1.0 Setup.exe'), 'gizzycera-0.1.0-Setup.exe');
  assert.equal(asciiArtifactName('gizzycera_0.1.0_amd64.deb'), 'gizzycera_0.1.0_amd64.deb');
  assert.equal(asciiArtifactName('gizzycera-0.1.0-full.nupkg'), 'gizzycera-0.1.0-full.nupkg');
  assert.equal(asciiArtifactName('RELEASES'), 'RELEASES');
});

test('the make results are renamed on disk and point at the new names', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'gizzy-make-'));
  mkdirSync(join(folder, 'zip'));
  const zip = join(folder, 'zip', 'Gizzycera-linux-x64-0.1.0.zip');
  writeFileSync(zip, 'z');
  const results = await renameArtifacts([{ artifacts: [zip], platform: 'linux', arch: 'x64' }]);
  assert.deepEqual(results[0].artifacts, [join(folder, 'zip', 'gizzycera-linux-x64-0.1.0.zip')]);
  assert.deepEqual(readdirSync(join(folder, 'zip')), ['gizzycera-linux-x64-0.1.0.zip']);
});
