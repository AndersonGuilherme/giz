import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowOnlyOurMicrophone, type PermissionSession } from '../../../src/main/security/permissions.ts';

// Electron's handler signatures (four arguments each).
type Request = (...args: [contents: unknown, permission: string, callback: (granted: boolean) => void, details: unknown]) => void;
type Check = (...args: [contents: unknown, permission: string, origin: string, details: unknown]) => boolean;

const PAGE = 'http://localhost:5173/';
const ourContents = { id: 1 };

function policy() {
  let request: Request | undefined;
  let check: Check | undefined;
  const session = {
    setPermissionRequestHandler: (handler: Request) => void (request = handler),
    setPermissionCheckHandler: (handler: Check) => void (check = handler),
  } as unknown as PermissionSession;
  allowOnlyOurMicrophone(session, { contents: () => ourContents, isAppUrl: (url) => url.startsWith('http://localhost:5173/') });
  const asked = (contents: unknown, permission: string, details: unknown) => {
    let answer: boolean | undefined;
    request!(contents, permission, (granted) => void (answer = granted), details);
    return answer;
  };
  return { asked, checked: (contents: unknown, permission: string, details: unknown) => check!(contents, permission, PAGE, details) };
}

test('our window asking for the microphone alone is allowed (request and check)', () => {
  const { asked, checked } = policy();
  assert.equal(asked(ourContents, 'media', { mediaTypes: ['audio'], requestingUrl: PAGE }), true);
  assert.equal(checked(ourContents, 'media', { mediaType: 'audio', requestingUrl: PAGE }), true);
});

test('the camera, or the camera with the microphone, or media with no type, is refused', () => {
  const { asked, checked } = policy();
  assert.equal(asked(ourContents, 'media', { mediaTypes: ['video'], requestingUrl: PAGE }), false);
  assert.equal(asked(ourContents, 'media', { mediaTypes: ['audio', 'video'], requestingUrl: PAGE }), false);
  assert.equal(asked(ourContents, 'media', { mediaTypes: [], requestingUrl: PAGE }), false);
  assert.equal(asked(ourContents, 'media', {}), false);
  assert.equal(checked(ourContents, 'media', { mediaType: 'video', requestingUrl: PAGE }), false);
});

test('another webContents, or another page in our window, never gets the microphone', () => {
  const { asked, checked } = policy();
  assert.equal(asked({ id: 2 }, 'media', { mediaTypes: ['audio'], requestingUrl: PAGE }), false);
  assert.equal(asked(ourContents, 'media', { mediaTypes: ['audio'], requestingUrl: 'https://evil.example.com/' }), false);
  assert.equal(asked(null, 'media', { mediaTypes: ['audio'], requestingUrl: PAGE }), false);
  assert.equal(checked({ id: 2 }, 'media', { mediaType: 'audio', requestingUrl: PAGE }), false);
});

test('every other permission stays denied, even for our window', () => {
  const { asked, checked } = policy();
  for (const permission of ['geolocation', 'notifications', 'clipboard-read', 'openExternal', 'fullscreen', 'midi']) {
    assert.equal(asked(ourContents, permission, { requestingUrl: PAGE }), false, permission);
    assert.equal(checked(ourContents, permission, { requestingUrl: PAGE }), false, permission);
  }
});
