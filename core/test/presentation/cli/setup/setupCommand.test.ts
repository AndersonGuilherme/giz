import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configFile } from '../../../../src/presentation/cli/composition/install.ts';
import { setupCommand } from '../../../../src/presentation/cli/setup/setupCommand.ts';

async function quietly<T>(run: () => Promise<T>): Promise<{ result: T; printed: string; warned: string }> {
  const [log, warn] = [console.log, console.warn];
  const printed: string[] = [];
  const warned: string[] = [];
  console.log = (...parts: unknown[]) => void printed.push(parts.join(' '));
  console.warn = (...parts: unknown[]) => void warned.push(parts.join(' '));
  try {
    return { result: await run(), printed: printed.join('\n'), warned: warned.join('\n') };
  } finally {
    [console.log, console.warn] = [log, warn];
  }
}

test('setup --dry-run asks with the defaults, shows the result and writes nothing (no config, no folders)', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'gizzy-setup-'));
  const path = join(folder, 'gizzycera.config.json');
  const { printed } = await quietly(() => setupCommand(['--dry-run'], path));
  assert.equal(existsSync(path), false);
  assert.deepEqual(readdirSync(folder), []);
  assert.match(printed, /\[7\/7\][\s\S]*\(simulação\) gizzycera\.config\.json ficaria assim:/);
  assert.doesNotMatch(printed, /NaN/);
});

test('the missing configuration warning goes to stderr (console.warn), not to the command output', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'gizzy-config-')), 'gizzycera.config.json');
  const { printed, warned } = await quietly(async () => configFile(path).load());
  assert.equal(printed, '');
  assert.match(warned, /AVISO: gizzycera\.config\.json não encontrado/);
});
