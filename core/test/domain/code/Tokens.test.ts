import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CodeLanguage, Tokens } from '../../../src/domain/code/Tokens.ts';

const kinds = (line: string, language = CodeLanguage.TYPESCRIPT) => Tokens.of(line, language).map((token) => token.kind);
const texts = (line: string, language = CodeLanguage.TYPESCRIPT) => Tokens.of(line, language).map((token) => token.text);

test('TypeScript keywords are highlighted', () => {
  assert.deepEqual(kinds('export const x'), ['keyword', 'space', 'keyword', 'space', 'identifier']);
});

test('the tokens put the line back together, character by character', () => {
  const line = "  const total = calcular(pedido, 'BRL') + 1_000; // soma";
  assert.equal(texts(line).join(''), line);
});

test('strings, numbers, comments, types and calls get their own kinds', () => {
  const tokens = Tokens.of("return new Pedido(total, 'BRL', 42); // fim", CodeLanguage.TYPESCRIPT);
  const kindOf = (text: string) => tokens.find((token) => token.text === text)?.kind;
  assert.equal(kindOf('return'), 'keyword');
  assert.equal(kindOf('Pedido'), 'type');
  assert.equal(kindOf("'BRL'"), 'string');
  assert.equal(kindOf('42'), 'number');
  assert.equal(kindOf('// fim'), 'comment');
  assert.equal(kindOf('('), 'punctuation');
  assert.equal(kindOf('total'), 'identifier');
});

test('a name followed by "(" is a function call', () => {
  assert.equal(Tokens.of('calcular (x)', CodeLanguage.TYPESCRIPT)[0].kind, 'function');
});

test('the keywords depend on the language', () => {
  assert.deepEqual(kinds('def soma(a):', CodeLanguage.PYTHON).slice(0, 3), ['keyword', 'space', 'function']);
  assert.equal(kinds('def soma', CodeLanguage.TYPESCRIPT)[0], 'identifier');
  assert.equal(Tokens.of('# nota', CodeLanguage.PYTHON)[0].kind, 'comment');
  assert.equal(Tokens.of('public void run', CodeLanguage.JAVA)[0].kind, 'keyword');
});

test('the language comes from the file name in the code title; TypeScript when unknown', () => {
  assert.equal(CodeLanguage.fromFileName('pedido.py'), CodeLanguage.PYTHON);
  assert.equal(CodeLanguage.fromFileName('src/Pedido.java'), CodeLanguage.JAVA);
  assert.equal(CodeLanguage.fromFileName('checkout.ts'), CodeLanguage.TYPESCRIPT);
  assert.equal(CodeLanguage.fromFileName('Checkout'), CodeLanguage.TYPESCRIPT);
});
