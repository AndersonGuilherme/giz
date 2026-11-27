import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertLessonFolder } from '../../../src/infrastructure/v1/lessonFolder.ts';
import { checkProject, projectRepository } from '../../../src/presentation/cli/composition.ts';

const CORE = fileURLToPath(new URL('../../../', import.meta.url));
const LESSONS = join(CORE, '../courses/solid/lessons');
const SETUP = {
  castFolder: join(CORE, 'casts/example'),
  voice: { voices: { lia: 'vivian', teo: 'dylan' }, styles: { lia: 'calorosa', teo: 'curioso' }, model: '1.7b' as const },
};

// A lesson still in the v1 format (roteiro.ts) is converted into a temporary folder first; a converted one is checked as it is.
async function projectFolder(lesson: string): Promise<string> {
  if (!existsSync(join(lesson, 'roteiro.ts'))) return lesson;
  const output = mkdtempSync(join(tmpdir(), 'giz-solid-'));
  await convertLessonFolder({ lesson, output }, SETUP);
  return output;
}

test('every SOLID lesson is a v2 project (or converts to one) with 0 check errors', async () => {
  const lessons = readdirSync(LESSONS).sort();
  assert.equal(lessons.length, 24);
  for (const name of lessons) {
    const project = await projectRepository().load(await projectFolder(join(LESSONS, name)));
    const { errors } = checkProject().run(project);
    assert.deepEqual(errors, [], name);
  }
});
