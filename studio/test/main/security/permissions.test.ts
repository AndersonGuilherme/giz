import { test } from 'node:test';
import assert from 'node:assert/strict';
import { denyAllPermissions, type PermissionSession } from '../../../src/main/security/permissions.ts';

test('every permission request and check is denied by default', () => {
  let request: ((...args: unknown[]) => void) | undefined;
  let check: ((...args: unknown[]) => boolean) | undefined;
  const session = {
    setPermissionRequestHandler: (handler: (...args: unknown[]) => void) => void (request = handler),
    setPermissionCheckHandler: (handler: (...args: unknown[]) => boolean) => void (check = handler),
  } as unknown as PermissionSession;
  denyAllPermissions(session);
  const answers: boolean[] = [];
  for (const permission of ['media', 'geolocation', 'notifications', 'clipboard-read', 'openExternal']) {
    request?.({}, permission, (granted: boolean) => answers.push(granted), {});
    answers.push(check?.({}, permission, 'http://localhost:5173', {}) ?? true);
  }
  assert.equal(answers.length, 10);
  assert.ok(answers.every((granted) => granted === false));
});
