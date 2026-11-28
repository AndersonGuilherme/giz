import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CheckProject } from '../src/application/use-cases/CheckProject.ts';
import { CAPTION_LAYOUTS } from '../src/domain/caption/captionLayouts.ts';
import { createLayoutRegistry } from '../src/domain/layout/defaultLayoutRegistry.ts';
import { DiskProjectRepository } from '../src/infrastructure/disk/DiskProjectRepository.ts';
import { RigCatalogFromRegistry } from '../src/presentation/rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../src/presentation/rigs/rigRegistry.ts';

const EXAMPLES = [
  'internet-story/pt-BR',
  'internet-story/en',
  'sneeze-kite/pt-BR',
  'sneeze-kite/en',
  'coupon-lesson/pt-BR',
  'coupon-lesson/en',
];

const folderOf = (example: string) => fileURLToPath(new URL(`../examples/${example}`, import.meta.url));

test('the examples load and pass the check without errors', async () => {
  const rigs = new RigCatalogFromRegistry(rigRegistry);
  const repository = new DiskProjectRepository({ catalog: rigs });
  const check = new CheckProject({ layouts: createLayoutRegistry(), captions: CAPTION_LAYOUTS, rigs });
  for (const example of EXAMPLES) {
    const project = await repository.load(folderOf(example));
    const { errors, warnings } = check.run(project);
    assert.deepEqual(errors, [], `${example}: ${JSON.stringify(errors)}`);
    assert.deepEqual(warnings, [], `${example}: ${JSON.stringify(warnings)}`);
  }
});

test('each example speaks its own language and keeps the format of its kind', async () => {
  const repository = new DiskProjectRepository({ catalog: new RigCatalogFromRegistry(rigRegistry) });
  const expected = [
    { example: 'internet-story/pt-BR', language: 'pt-BR', aspect: '9:16', format: 'story', captionStyle: 'words' },
    { example: 'internet-story/en', language: 'en', aspect: '9:16', format: 'story', captionStyle: 'words' },
    { example: 'sneeze-kite/pt-BR', language: 'pt-BR', aspect: '16:9', format: 'story', captionStyle: 'words' },
    { example: 'sneeze-kite/en', language: 'en', aspect: '16:9', format: 'story', captionStyle: 'words' },
    { example: 'coupon-lesson/pt-BR', language: 'pt-BR', aspect: '16:9', format: 'lesson', captionStyle: 'blocks' },
    { example: 'coupon-lesson/en', language: 'en', aspect: '16:9', format: 'lesson', captionStyle: 'blocks' },
  ];
  for (const { example, ...profile } of expected) {
    const project = await repository.load(folderOf(example));
    const actual = {
      language: project.language().code(),
      aspect: project.aspect().text(),
      format: project.format(),
      captionStyle: project.captionStyle(),
    };
    assert.deepEqual(actual, profile, example);
  }
});

const readJson = async (example: string, file: string) =>
  JSON.parse(await readFile(fileURLToPath(new URL(`../examples/${example}/${file}`, import.meta.url)), 'utf8'));

const withoutBrackets = (text: string) => text.replace(/[[\]]/g, '');

test('no example repeats its text in pronunciation only to drop the brackets', async () => {
  for (const example of EXAMPLES) {
    const { lines } = await readJson(example, 'script.json');
    const redundant = lines.filter(
      (line: { text: string; pronunciation?: string }) => line.pronunciation === withoutBrackets(line.text),
    );
    assert.deepEqual(redundant.map((line: { id: string }) => line.id), [], example);
  }
});

test('the stories cast Gizzy characters on at least 4 different backgrounds', async () => {
  for (const example of ['internet-story/pt-BR', 'internet-story/en', 'sneeze-kite/pt-BR', 'sneeze-kite/en']) {
    const project = await readJson(example, 'project.json');
    const characters = await Promise.all(project.cast.map((id: string) => readJson(example, `cast/${id}.json`)));
    const rigs = new Set(characters.flatMap((character: { rig?: string }) => character.rig ?? []));
    assert.deepEqual([...rigs], ['gizzy'], example);
    const { lines } = await readJson(example, 'script.json');
    const backgrounds = new Set(
      lines.flatMap((line: { scene?: { background?: { vector?: string } } }) => line.scene?.background?.vector ?? []),
    );
    assert.ok(backgrounds.size >= 4, `${example}: ${[...backgrounds].join(', ')}`);
  }
});
