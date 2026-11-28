import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { plainRelativePath, refuseAnotherFile, sha256Of } from '../../../src/infrastructure/download/verifiedFile.ts';

const fileWith = (text: string) => {
  const path = join(mkdtempSync(join(tmpdir(), 'gizzy-verified-')), 'file.bin');
  writeFileSync(path, text);
  return path;
};
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

test('sha256Of streams the file and gives its hex digest', async () => {
  assert.equal(await sha256Of(fileWith('conteudo')), sha256('conteudo'));
});

test('a file with the expected sha256 stays; another one is deleted with a readable error', async () => {
  const good = fileWith('conteudo');
  await refuseAnotherFile(good, sha256('conteudo'), 'model.onnx');
  assert.equal(existsSync(good), true);
  const bad = fileWith('outro');
  await assert.rejects(refuseAnotherFile(bad, sha256('conteudo'), 'model.onnx'), /model\.onnx baixado não confere/);
  assert.equal(existsSync(bad), false, 'the wrong file is removed, so the next run downloads it again');
});

test('a hash comparison ignores the case of the hex digits', async () => {
  await refuseAnotherFile(fileWith('x'), sha256('x').toUpperCase(), 'x');
});

test('plainRelativePath accepts plain nested paths and refuses .., absolute, backslashes and empty segments', () => {
  assert.equal(plainRelativePath('onnx/talker.onnx', 'modelo'), 'onnx/talker.onnx');
  assert.equal(plainRelativePath('config.json', 'modelo'), 'config.json');
  for (const bad of ['../x', 'a/../../x', '/etc/passwd', 'a\\b', 'C:x', '', 'a//b', './a', 'a/.', undefined]) {
    assert.throws(() => plainRelativePath(bad as string, 'modelo'), /caminho inválido/, String(bad));
  }
});

test('a file kept in git itself is checked by its git blob id', async () => {
  const oid = createHash('sha1').update('blob 4\0abcd').digest('hex');
  await refuseAnotherFile(fileWith('abcd'), { gitOid: oid }, 'config.json');
  const bad = fileWith('abce');
  await assert.rejects(refuseAnotherFile(bad, { gitOid: oid }, 'config.json'), /config\.json baixado não confere/);
  assert.equal(existsSync(bad), false);
});
