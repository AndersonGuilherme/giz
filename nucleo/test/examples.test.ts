import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { CheckProject } from '../src/application/use-cases/CheckProject.ts';
import { CAPTION_LAYOUTS } from '../src/domain/caption/captionLayouts.ts';
import { createLayoutRegistry } from '../src/domain/layout/defaultLayoutRegistry.ts';
import { DiskProjectRepository } from '../src/infrastructure/disk/DiskProjectRepository.ts';
import { RigCatalogFromRegistry } from '../src/presentation/rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../src/presentation/rigs/rigRegistry.ts';

const EXAMPLES = ['internet-story/pt-BR', 'internet-story/en', 'coupon-lesson/pt-BR', 'coupon-lesson/en'];

const folderOf = (example: string) => fileURLToPath(new URL(`../examples/${example}`, import.meta.url));

test('the 4 examples load and pass the check without errors', async () => {
  const repository = new DiskProjectRepository({ catalog: new RigCatalogFromRegistry(rigRegistry) });
  const check = new CheckProject({ layouts: createLayoutRegistry(), captions: CAPTION_LAYOUTS });
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
