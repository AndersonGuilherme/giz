import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RenderVideo } from '../../src/application/use-cases/RenderVideo.ts';
import type { Project } from '../../src/domain/project/Project.ts';
import type { VideoProps } from '../../src/domain/timeline/VideoProps.ts';

const PROPS = { totalFrames: 30, segments: [] } as unknown as VideoProps;

function recording(variant?: string) {
  const written: string[] = [];
  const build = { run: async () => PROPS };
  const renderer = { render: async (_props: VideoProps, output: string) => void written.push(output) };
  const captions = { write: async (_props: VideoProps, output: string) => void written.push(output) };
  const useCase = new RenderVideo({ build, renderer, captions, ...(variant ? { variant } : {}) });
  return { written, useCase };
}

test('the video and its captions go to output/video.mp4 and output/captions.srt', async () => {
  const { written, useCase } = recording();
  const files = await useCase.run('/projects/coupon/', {} as Project);
  assert.deepEqual(files, { video: '/projects/coupon/output/video.mp4', captions: '/projects/coupon/output/captions.srt' });
  assert.deepEqual(written, [files.video, files.captions]);
});

test('a variant (the other aspect) gets its own files, so the video of the project aspect stays', async () => {
  const { written, useCase } = recording('9x16');
  const files = await useCase.run('/projects/coupon', {} as Project);
  assert.deepEqual(files, { video: '/projects/coupon/output/video-9x16.mp4', captions: '/projects/coupon/output/captions-9x16.srt' });
  assert.deepEqual(written, [files.video, files.captions]);
});

test('the output names of a variant come from one place (the Studio lists them before any render)', async () => {
  const { outputFilesOf } = await import('../../src/application/use-cases/RenderVideo.ts');
  assert.deepEqual(outputFilesOf(undefined), { video: 'output/video.mp4', captions: 'output/captions.srt' });
  assert.deepEqual(outputFilesOf('9x16'), { video: 'output/video-9x16.mp4', captions: 'output/captions-9x16.srt' });
});

test('with a check, the render checks the very project it renders: an error stops it before anything is built or written', async () => {
  const { CheckFailed } = await import('../../src/application/use-cases/ProduceVideo.ts');
  const written: string[] = [];
  let built = 0;
  const build = { run: async () => (built++, PROPS) };
  const renderer = { render: async (_props: VideoProps, output: string) => void written.push(output) };
  const captions = { write: async (_props: VideoProps, output: string) => void written.push(output) };
  const failing = { run: () => ({ errors: [{ line: '3', message: 'texto não cabe' }], warnings: [] }) };
  const refused = new RenderVideo({ build, renderer, captions, check: failing });
  await assert.rejects(refused.run('/p', {} as Project), (error: unknown) => error instanceof CheckFailed && /texto não cabe/.test(error.message));
  assert.deepEqual([built, written], [0, []]);
  const passing = { run: () => ({ errors: [], warnings: [{ line: '1', message: 'aviso' }] }) };
  await new RenderVideo({ build, renderer, captions, check: passing }).run('/p', {} as Project);
  assert.equal(written.length, 2, 'warnings do not stop it');
});
