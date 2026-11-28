import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProjectService } from '../../../src/main/services/ProjectService.ts';
import { grantsFor } from '../../doubles/fakes.ts';

const picker = (folder: string | null) => ({ pickFolder: async () => folder });

test('the picked folder is granted; a cancelled pick grants nothing; launched gives the command-line folder', async () => {
  const grants = grantsFor();
  const service = new ProjectService({ picker: picker('/escolhida'), grants, launchFolder: '/linha' });
  assert.equal(await service.pick(), '/escolhida');
  assert.equal(grants.require('/escolhida'), '/escolhida');
  assert.equal(service.launched(), '/linha');
  const cancelled = new ProjectService({ picker: picker(null), grants: grantsFor(), launchFolder: null });
  assert.equal(await cancelled.pick(), null);
  assert.equal(cancelled.launched(), null);
});

test('a second launch with --project grants that folder and makes it the launched one', () => {
  const grants = grantsFor();
  const service = new ProjectService({ picker: picker(null), grants, launchFolder: '/linha' });
  assert.throws(() => grants.require('/outra/cupom'), { code: 'invalid-request' });
  assert.equal(service.relaunched('/outra/cupom'), '/outra/cupom');
  assert.equal(grants.require('/outra/cupom'), '/outra/cupom');
  assert.equal(service.launched(), '/outra/cupom');
});
