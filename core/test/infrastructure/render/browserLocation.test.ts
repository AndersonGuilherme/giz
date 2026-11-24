import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { headlessShellIn } from '../../../src/infrastructure/render/browserLocation.ts';

const PACKAGE = '/opt/giz/core';
const shells = (platform: string) => join(PACKAGE, 'node_modules', '.remotion', 'chrome-headless-shell', platform, `chrome-headless-shell-${platform}`);

test('the Chrome Headless Shell is looked up in the package folder, not in the working directory', () => {
  const expected = join(shells('linux64'), 'chrome-headless-shell');
  const found = headlessShellIn(PACKAGE, { platform: 'linux', arch: 'x64', exists: (path) => path === expected });
  assert.equal(found, expected);
});
test('each platform uses the folder Remotion downloads to; a Remotion-patched headless_shell wins', () => {
  const all = () => true;
  assert.equal(headlessShellIn(PACKAGE, { platform: 'darwin', arch: 'arm64', exists: all }), join(shells('mac-arm64'), 'headless_shell'));
  const exe = join(shells('win64'), 'chrome-headless-shell.exe');
  assert.equal(headlessShellIn(PACKAGE, { platform: 'win32', arch: 'x64', exists: (path) => path === exe }), exe);
  const arm = join(shells('linux-arm64'), 'chrome-headless-shell');
  assert.equal(headlessShellIn(PACKAGE, { platform: 'linux', arch: 'arm64', exists: (path) => path === arm }), arm);
});
test('without a downloaded shell (or on an unknown platform) there is no path: Remotion downloads it as usual', () => {
  assert.equal(headlessShellIn(PACKAGE, { platform: 'linux', arch: 'x64', exists: () => false }), undefined);
  assert.equal(headlessShellIn(PACKAGE, { platform: 'aix', arch: 'ppc64', exists: () => true }), undefined);
});
