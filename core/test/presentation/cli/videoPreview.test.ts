import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectInAspect, videoPreview } from '../../../src/presentation/cli/composition/video.ts';
import { renderVideo } from '../../../src/presentation/cli/composition.ts';
import { GenerateVoices } from '../../../src/application/use-cases/GenerateVoices.ts';
import { DiskVoiceStore } from '../../../src/infrastructure/disk/DiskVoiceStore.ts';
import { EnvelopeAligner } from '../../../src/infrastructure/alignment/EnvelopeAligner.ts';
import { FakeVoice } from '../../doubles/FakeVoice.ts';
import { FakePhonemizer } from '../../doubles/FakePhonemizer.ts';

const FIXTURE = fileURLToPath(new URL('../../fixtures/minimal-project', import.meta.url));

async function withVoicedCopy(use: (folder: string) => Promise<void>): Promise<void> {
  const folder = await mkdtemp(join(tmpdir(), 'gizzy-video-preview-'));
  try {
    await cp(FIXTURE, folder, { recursive: true });
    const script = JSON.parse(await readFile(join(folder, 'script.json'), 'utf8'));
    script.lines[1].sfx = 'pop';
    await writeFile(join(folder, 'script.json'), JSON.stringify(script));
    const project = await projectInAspect(folder);
    await new GenerateVoices({ voice: new FakeVoice(), phonemizer: new FakePhonemizer(), store: new DiskVoiceStore(folder), aligner: new EnvelopeAligner() }).run(project, () => undefined);
    await use(folder);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}

test('a project can be seen in the other aspect: the props have its size, the project file stays', async () => {
  await withVoicedCopy(async (folder) => {
    const own = await projectInAspect(folder);
    const other = own.aspect().text() === '9:16' ? '16:9' : '9:16';
    const { props } = await videoPreview(folder, await projectInAspect(folder, other));
    assert.equal(`${props.width}x${props.height}`, other === '9:16' ? '1080x1920' : '1920x1080');
    assert.equal((await projectInAspect(folder)).aspect().text(), own.aspect().text());
  });
});

test('the preview lists every file the video asks for, each on disk: the voices, the sound effects and the bundled fonts', async () => {
  await withVoicedCopy(async (folder) => {
    const { props, files } = await videoPreview(folder, await projectInAspect(folder));
    const voices = props.segments.map(({ audio }) => audio);
    for (const voice of voices) assert.ok(files.some(({ at }) => at === voice), `${voice} is listed`);
    assert.equal(props.soundEffects.length, 1);
    for (const sound of props.soundEffects) assert.ok(files.some(({ at }) => at === `sounds/${sound.sound}.wav`));
    for (const font of ['fonts/Nunito.ttf', 'fonts/JetBrainsMono.ttf']) assert.ok(files.some(({ at }) => at === font), `${font} is listed`);
    for (const { from } of files) assert.ok(existsSync(from), `${from} exists`);
  });
});

test('renderVideo takes the Studio output options (the variant names the files) without changing the CLI default', () => {
  assert.ok(renderVideo('/projects/coupon'));
  assert.ok(renderVideo('/projects/coupon', undefined, { variant: '9x16', frames: 30 }));
});

test("the Studio names the outputs with core's own rule", async () => {
  const { outputFilesOf } = await import('../../../src/presentation/cli/composition/video.ts');
  assert.equal(outputFilesOf('16x9').video, 'output/video-16x9.mp4');
});
