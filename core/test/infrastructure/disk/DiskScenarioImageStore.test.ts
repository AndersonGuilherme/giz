import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ProjectError } from '../../../src/application/ports/ProjectError.ts';
import { ScenarioImageError } from '../../../src/application/use-cases/images/ScenarioImageError.ts';
import { GenerateScenarioImages } from '../../../src/application/use-cases/images/GenerateScenarioImages.ts';
import { DiskProjectRepository } from '../../../src/infrastructure/disk/DiskProjectRepository.ts';
import { DiskScenarioImageStore } from '../../../src/infrastructure/disk/DiskScenarioImageStore.ts';
import { imageSize } from '../../../src/infrastructure/disk/imageSize.ts';
import { FakeImageProvider, pngOfSize } from '../../doubles/FakeImageProvider.ts';
import { FakeRigCatalog } from '../../doubles/FakeRigCatalog.ts';

type Json = Record<string, unknown>;
const FIXTURE = fileURLToPath(new URL('../../fixtures/minimal-project', import.meta.url));
const tempFolders: string[] = [];
after(() => Promise.all(tempFolders.map((folder) => rm(folder, { recursive: true, force: true }))));

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8')) as Json;
const repository = () => new DiskProjectRepository({ catalog: new FakeRigCatalog() });

// The minimal project on the test rig, its first scene asking for a generated image (and `change` applied to project.json).
async function projectFolder(background: Json = { generate: { prompt: 'uma praça' } }, project: Json = {}): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'giz-scenes-'));
  tempFolders.push(folder);
  await cp(FIXTURE, folder, { recursive: true });
  const ana = await readJson(join(folder, 'cast/ana.json'));
  await writeFile(join(folder, 'cast/ana.json'), JSON.stringify({ ...ana, rig: 'test', parameters: { skin: '#f0c8a0' } }));
  const script = await readJson(join(folder, 'script.json'));
  const [first, ...rest] = script.lines as Json[];
  const scene = { type: 'scenario', background, characters: [{ character: 'ana', position: 'center' }] };
  await writeFile(join(folder, 'script.json'), JSON.stringify({ ...script, lines: [{ ...first, scene }, ...rest] }));
  await writeFile(join(folder, 'project.json'), JSON.stringify({ ...(await readJson(join(folder, 'project.json'))), ...project }));
  return folder;
}

const image = { bytes: pngOfSize(1216, 2160), mime: 'image/png' };
const madeBy = { provider: 'fal' as const, model: 'fake-flux' };

test('save writes scenes/<id>.png and scenes/<id>.json; savedHash needs both', async () => {
  const folder = await projectFolder();
  const store = new DiskScenarioImageStore(folder);
  assert.equal(store.savedHash('1'), undefined);
  await store.save({ lineId: '1', image, hash: 'abc', madeBy });
  assert.deepEqual(await imageSize(join(folder, 'scenes/1.png')), { width: 1216, height: 2160 });
  const fileHash = createHash('sha256').update(image.bytes).digest('hex');
  assert.deepEqual(await readJson(join(folder, 'scenes/1.json')), { file: 'scenes/1.png', hash: 'abc', fileHash, provider: 'fal', model: 'fake-flux' });
  assert.equal(await store.foreignFile('1'), false);
  assert.equal(store.savedHash('1'), 'abc');
  await rm(join(folder, 'scenes/1.png'));
  assert.equal(store.savedHash('1'), undefined);
});

test('link sets background.image to the generated file, keeping the rest of the scene; unchanged script is not rewritten', async () => {
  const folder = await projectFolder({ generate: { prompt: 'uma praça' }, vector: 'room' });
  const store = new DiskScenarioImageStore(folder);
  await store.link(['1', '2']);
  const script = await readJson(join(folder, 'script.json'));
  const [first, second] = script.lines as Json[];
  assert.deepEqual((first!.scene as Json).background, { generate: { prompt: 'uma praça' }, vector: 'room', image: 'scenes/1.png' });
  assert.equal(second!.scene, undefined);
  const before = (await stat(join(folder, 'script.json'))).mtimeMs;
  await new Promise((done) => setTimeout(done, 20));
  await store.link(['1']);
  assert.equal((await stat(join(folder, 'script.json'))).mtimeMs, before);
});

test('end to end: the "not generated" warning, then giz images, then a clean load with the image in place', async () => {
  const folder = await projectFolder({ generate: { prompt: 'uma praça' } }, { style: 'watercolor', imageProvider: 'fal' });
  const before = await repository().load(folder);
  assert.equal(before.warnings().length, 1);
  assert.match(before.warnings()[0]!, /lines\[0\]\.scene\.background\.generate: cenário ainda não gerado \(fala 1\).*giz images/);
  assert.equal(before.imageStyle(), 'watercolor');
  assert.equal(before.imageProvider(), 'fal');
  const images = new FakeImageProvider();
  const report = await new GenerateScenarioImages({ images, store: new DiskScenarioImageStore(folder) }).run(before);
  assert.deepEqual(report.generated, ['1']);
  const afterwards = await repository().load(folder);
  assert.deepEqual(afterwards.warnings(), []);
  const scene = afterwards.script().lines().each()[0]!.scene();
  assert.equal(scene?.type === 'scenario' ? scene.background.image : undefined, 'scenes/1.png');
  const again = await new GenerateScenarioImages({ images, store: new DiskScenarioImageStore(folder) }).run(afterwards);
  assert.deepEqual(again, { generated: [], kept: ['1'], own: [] });
});

test('a generated image that went missing warns with the giz images hint', async () => {
  const folder = await projectFolder({ generate: { prompt: 'uma praça' }, image: 'scenes/1.png' });
  const [warning] = (await repository().load(folder)).warnings();
  assert.match(warning!, /scenes\/1\.png não encontrada \(fala 1\); o render usa o fundo vetorial padrão \(rode giz images/);
});

async function problems(folder: string): Promise<string[]> {
  try {
    await repository().load(folder);
  } catch (error) {
    assert.ok(error instanceof ProjectError);
    return error.problems.map((problem) => `${problem.file} ${problem.path}: ${problem.message}`);
  }
  return assert.fail('expected ProjectError');
}

test('project.json style and imageProvider, and background.generate, are validated with readable errors', async () => {
  const wrongProject = await projectFolder(undefined, { style: 'oleo', imageProvider: 'midjourney' });
  assert.deepEqual(await problems(wrongProject), [
    'project.json style: "oleo" inválido (use painted-2d, flat-vector, watercolor, chalk)',
    'project.json imageProvider: "midjourney" inválido (use openai, gemini, fal)',
  ]);
  const wrongScene = await projectFolder({ generate: { prompt: '', style: 'pastel', size: 3 } });
  const found = await problems(wrongScene);
  assert.ok(found.includes('script.json lines[0].scene.background.generate.prompt: não pode ser vazio'), found.join('\n'));
  assert.ok(found.includes('script.json lines[0].scene.background.generate.style: "pastel" inválido (use painted-2d, flat-vector, watercolor, chalk)'), found.join('\n'));
  assert.ok(found.some((line) => /generate.*size/.test(line)), found.join('\n'));
});

test('save never overwrites a scenes/<id>.png it did not write: no record, or bytes changed since', async () => {
  const folder = await projectFolder();
  const store = new DiskScenarioImageStore(folder);
  await mkdir(join(folder, 'scenes'));
  const mine = Buffer.from(pngOfSize(800, 600));
  await writeFile(join(folder, 'scenes/1.png'), mine);
  assert.equal(await store.foreignFile('1'), true);
  await assert.rejects(store.save({ lineId: '1', image, hash: 'abc', madeBy }), (error: Error) =>
    error instanceof ScenarioImageError && /scenes\/1\.png já existe e não foi feito pelo giz images: o arquivo não foi sobrescrito/.test(error.message));
  assert.deepEqual(await readFile(join(folder, 'scenes/1.png')), mine);
  await rm(join(folder, 'scenes/1.png'));
  await store.save({ lineId: '1', image, hash: 'abc', madeBy });
  assert.equal(await store.foreignFile('1'), false);
  await writeFile(join(folder, 'scenes/1.png'), mine);
  assert.equal(await store.foreignFile('1'), true);
});

test('end to end: an edited generated image is refused readably when the prompt changes, before any call', async () => {
  const folder = await projectFolder({ generate: { prompt: 'uma praça' } });
  const images = new FakeImageProvider();
  await new GenerateScenarioImages({ images, store: new DiskScenarioImageStore(folder) }).run(await repository().load(folder));
  await writeFile(join(folder, 'scenes/1.png'), Buffer.concat([pngOfSize(1216, 2160), Buffer.from('retocada')]));
  const script = await readJson(join(folder, 'script.json'));
  const [first, ...rest] = script.lines as Json[];
  const scene = first!.scene as Json;
  const changed = { ...first, scene: { ...scene, background: { ...(scene.background as Json), generate: { prompt: 'uma praça à noite' } } } };
  await writeFile(join(folder, 'script.json'), JSON.stringify({ ...script, lines: [changed, ...rest] }));
  const project = await repository().load(folder);
  await assert.rejects(new GenerateScenarioImages({ images, store: new DiskScenarioImageStore(folder) }).run(project), /scenes\/1\.png já existe/);
  assert.equal(images.requests.length, 1);
});

test('link rewrites script.json through a temp file, and never through a link that leads out of the project', async () => {
  const { readdir, symlink } = await import('node:fs/promises');
  const folder = await projectFolder();
  const store = new DiskScenarioImageStore(folder);
  await store.save({ lineId: '1', image, hash: 'abc', madeBy });
  await store.link(['1']);
  assert.deepEqual((await readdir(join(folder, 'scenes'))).sort(), ['1.json', '1.png'], 'no temp file left');
  const outside = await mkdtemp(join(tmpdir(), 'giz-outside-'));
  tempFolders.push(outside);
  const script = await readJson(join(folder, 'script.json'));
  ((script.lines as Json[])[0]!.scene as Json).background = { generate: { prompt: 'outra' } };
  await writeFile(join(outside, 'script.json'), JSON.stringify(script));
  await rm(join(folder, 'script.json'));
  await symlink(join(outside, 'script.json'), join(folder, 'script.json'));
  await assert.rejects(store.link(['1']), /fora da pasta do projeto/);
  assert.equal(JSON.stringify(await readJson(join(outside, 'script.json'))), JSON.stringify(script), 'the file outside is untouched');
});
