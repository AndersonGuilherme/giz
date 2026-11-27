import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertLessonFolder, type ConversionSetup } from '../../../src/infrastructure/v1/lessonFolder.ts';
import { checkProject, projectRepository } from '../../../src/presentation/cli/composition.ts';

const CORE = fileURLToPath(new URL('../../../', import.meta.url));
const SETUP: ConversionSetup = {
  castFolder: join(CORE, 'casts/example'),
  voice: { voices: { lia: 'vivian', teo: 'dylan' }, styles: { lia: 'Fale calorosa', teo: 'Fale curioso' }, model: '1.7b' },
};

function courseCopy(): string {
  const folder = mkdtempSync(join(tmpdir(), 'giz-v1-'));
  cpSync(join(CORE, 'test/fixtures/v1-course'), folder, { recursive: true });
  return folder;
}

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

test('convert writes a v2 project (project, script, cast, the course dictionaries) that passes the check', async () => {
  const course = courseCopy();
  const output = join(course, 'converted');
  const report = await convertLessonFolder({ lesson: join(course, 'lessons/01-exemplo'), output }, SETUP);
  assert.deepEqual(readdirSync(output).sort(), ['cast', 'project.json', 'pronunciation.elevenlabs.json', 'pronunciation.json', 'script.json']);
  assert.equal(report.files.length, 6);
  assert.deepEqual(readJson(join(output, 'pronunciation.json')), { checkout: 'chéc-áuti' });
  assert.deepEqual(readJson(join(output, 'cast/teo.json')).voice, { id: 'dylan', style: 'Fale curioso' });
  const script = readJson(join(output, 'script.json'));
  assert.deepEqual(script.lines[2].scene.added, [0, 1, 2]);
  assert.equal(script.lines[3].text, '[E] o total volta a bater.');
  assert.ok(existsSync(join(course, 'lessons/01-exemplo/roteiro.ts')), 'another output folder leaves the v1 lesson alone');
  const { errors, warnings } = checkProject().run(await projectRepository().load(output));
  assert.deepEqual([errors, warnings], [[], []]);
});

test('--in-place: the v2 files go into the lesson folder and roteiro.ts is removed; a second run refuses', async () => {
  const course = courseCopy();
  const lesson = join(course, 'lessons/01-exemplo');
  await convertLessonFolder({ lesson, output: lesson }, SETUP);
  assert.deepEqual(readdirSync(lesson).sort(), ['cast', 'examples', 'project.json', 'pronunciation.elevenlabs.json', 'pronunciation.json', 'script.json']);
  await assert.rejects(convertLessonFolder({ lesson, output: lesson }, SETUP), /script.json já existe/);
});
