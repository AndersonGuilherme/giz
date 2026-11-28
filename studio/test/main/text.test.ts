import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REQUEST_SCHEMAS } from '../../src/main/ipc/schemas.ts';
import { interfaceLanguage, setInterfaceLanguage, translate } from '../../src/main/text.ts';

test('the main process texts and zod messages follow the chosen interface language', () => {
  setInterfaceLanguage('en');
  try {
    assert.equal(interfaceLanguage(), 'en');
    assert.equal(translate('errors.failed'), 'The operation failed.');
    const issue = REQUEST_SCHEMAS['keys.remove'].safeParse({ provider: 'acme' }).error?.issues[0]?.message ?? '';
    assert.match(issue, /^Invalid option/);
    const empty = REQUEST_SCHEMAS['script.check'].safeParse({ folder: ' ' }).error?.issues[0]?.message;
    assert.equal(empty, 'enter the project folder');
  } finally {
    setInterfaceLanguage('pt-BR');
  }
  assert.equal(translate('errors.failed'), 'A operação falhou.');
});
