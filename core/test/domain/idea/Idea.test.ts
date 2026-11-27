import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Idea } from '../../../src/domain/idea/Idea.ts';
import { defaultVoiceStyle } from '../../../src/domain/cast/voiceStyles.ts';
import { grownOutputTokens, scriptOutputTokens, targetWords } from '../../../src/domain/idea/speechPace.ts';
import { Language } from '../../../src/domain/values/Language.ts';

const STORY = {
  format: 'story',
  aspect: '9:16',
  targetSeconds: 30,
  theme: 'E se os gatos falassem?',
  audience: 'jovens nas redes sociais',
  tone: 'engraçado',
  language: 'pt-BR',
};

test('a valid idea keeps its fields and gives the domain values', () => {
  const idea = Idea.fromJson({ ...STORY, cast: ['bia', 'caio'], scenes: ['street', 'castle-rain'] });
  assert.equal(idea.format(), 'story');
  assert.equal(idea.aspect().text(), '9:16');
  assert.ok(idea.language().equals(Language.PORTUGUESE));
  assert.equal(idea.targetSeconds(), 30);
  assert.deepEqual(idea.castIds(), ['bia', 'caio']);
  assert.deepEqual(idea.sceneNames(), ['street', 'castle-rain']);
  assert.deepEqual(idea.toJson(), { ...STORY, cast: ['bia', 'caio'], scenes: ['street', 'castle-rain'] });
});

test('the cast and the scenes are optional (empty: the AI chooses)', () => {
  const idea = Idea.fromJson(STORY);
  assert.deepEqual(idea.castIds(), []);
  assert.deepEqual(idea.sceneNames(), []);
  assert.deepEqual(idea.toJson(), STORY);
});

test('every problem of an idea comes out at once, field by field, in pt-BR', () => {
  const wrong = { format: 'podcast', aspect: '4:3', targetSeconds: 2.5, theme: '', audience: 3, language: 'es', cast: ['Bia', 'bia', 'bia'], extra: 1 };
  assert.throws(() => Idea.fromJson(wrong), (error: Error) => {
    assert.equal(error.name, 'DomainError');
    const lines = error.message.split('\n');
    assert.equal(lines[0], 'ideia inválida:');
    assert.deepEqual(lines.slice(1), [
      '- format: "podcast" inválido (use story, lesson)',
      '- aspect: proporção "4:3" não suportada (use 9:16 ou 16:9)',
      '- targetSeconds: use um número inteiro de segundos entre 10 e 900',
      '- theme: não pode ser vazio',
      '- audience: esperava texto',
      '- tone: obrigatório',
      '- language: idioma "es" não suportado (use pt-BR ou en)',
      '- cast[0]: id de personagem "Bia" inválido (use de 1 a 32 caracteres entre a-z, 0-9 e "-")',
      '- cast[2]: "bia" repetido',
      '- extra: campo desconhecido',
    ]);
    return true;
  });
});

test('an idea that is not an object, or lists that are not lists, are refused readably', () => {
  assert.throws(() => Idea.fromJson([]), { name: 'DomainError', message: /^ideia inválida: esperava um objeto JSON/ });
  assert.throws(() => Idea.fromJson(null), { name: 'DomainError', message: /esperava um objeto JSON/ });
  assert.throws(() => Idea.fromJson({ ...STORY, scenes: 'street' }), { message: /- scenes: esperava uma lista de textos/ });
  assert.throws(() => Idea.fromJson({ ...STORY, scenes: [''] }), { message: /- scenes\[0\]: não pode ser vazio/ });
  assert.throws(() => Idea.fromJson({ ...STORY, targetSeconds: 901 }), { message: /targetSeconds: use um número inteiro/ });
  assert.throws(() => Idea.fromJson({ ...STORY, theme: 'x'.repeat(601) }), { message: /- theme: no máximo 600 caracteres/ });
});

test('the words of speech for a duration: about 1.8 words/s in pt-BR (the Qwen voice) and 2.2 in English', () => {
  assert.equal(targetWords(Language.PORTUGUESE, 30), 54);
  assert.equal(targetWords(Language.PORTUGUESE, 60), 108);
  assert.equal(targetWords(Language.ENGLISH, 60), 132);
  assert.equal(Idea.fromJson(STORY).targetWords(), 54);
});

test('the output budget of a script grows with the duration, within the limits', () => {
  assert.equal(scriptOutputTokens(30), 11_000);
  assert.equal(scriptOutputTokens(60), 14_000);
  assert.equal(scriptOutputTokens(600), 32_000);
});

test('a repair after a cut answer gets 1.5 times the room, up to 48 000 tokens', () => {
  assert.equal(grownOutputTokens(11_000), 16_500);
  assert.equal(grownOutputTokens(37_125), 48_000);
  assert.equal(grownOutputTokens(48_000), 48_000);
});

test('the default voice style of each language starts as the examples do', () => {
  assert.equal(defaultVoiceStyle(Language.ENGLISH), 'Speak in natural American English');
  assert.match(defaultVoiceStyle(Language.PORTUGUESE), /^Fale em português do Brasil, com sotaque brasileiro/);
});
