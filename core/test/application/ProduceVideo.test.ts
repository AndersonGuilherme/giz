import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CaptionWriter } from '../../src/application/ports/CaptionWriter.ts';
import type { CheckReport } from '../../src/application/use-cases/CheckProject.ts';
import { ProduceVideo, type ProduceDependencies } from '../../src/application/use-cases/ProduceVideo.ts';
import { RenderVideo } from '../../src/application/use-cases/RenderVideo.ts';
import { Cast } from '../../src/domain/cast/Cast.ts';
import { Project } from '../../src/domain/project/Project.ts';
import { Lines } from '../../src/domain/script/Lines.ts';
import { Script } from '../../src/domain/script/Script.ts';
import type { VideoProps } from '../../src/domain/timeline/VideoProps.ts';
import { AspectRatio } from '../../src/domain/values/AspectRatio.ts';
import { Language } from '../../src/domain/values/Language.ts';
import { FakeRenderer } from '../doubles/FakeRenderer.ts';

const PROJECT = Project.of(
  { title: 'T', format: 'story', language: Language.PORTUGUESE, aspect: AspectRatio.VERTICAL, voice: { provider: 'qwen' } },
  { cast: Cast.of([]), script: Script.of(['Abertura'], Lines.of([])), warnings: [] },
);
const PROPS = { title: 'T', totalFrames: 30, segments: [] } as unknown as VideoProps;
const clean: CheckReport = { errors: [], warnings: [] };
const withError: CheckReport = { errors: [{ line: '1', message: 'título não cabe na caixa nem com a letra a 60%' }], warnings: [] };

type Options = Readonly<{ report?: CheckReport; log?: string[]; renderer?: FakeRenderer; captions?: string[] }>;

function dependencies({ report = clean, log = [], renderer = new FakeRenderer(log), captions = [] }: Options = {}): ProduceDependencies {
  const writer: CaptionWriter = {
    write: async (_props, file) => {
      log.push('captions');
      captions.push(file);
    },
  };
  const build = { run: async () => (log.push('build'), PROPS) };
  return {
    repository: { load: async () => (log.push('load'), PROJECT) },
    check: { run: () => (log.push('check'), report) },
    voices: () => ({ run: async () => (log.push('voices'), { generated: [], skipped: [] }) }),
    render: new RenderVideo({ build, renderer, captions: writer }),
  };
}

test('produce stops at a check error: no voice is generated (paid credits) and nothing is rendered', async () => {
  const log: string[] = [];
  const renderer = new FakeRenderer(log);
  await assert.rejects(new ProduceVideo(dependencies({ log, renderer, report: withError })).run('x'), /fala 1: título não cabe/);
  assert.deepEqual(log, ['load', 'check']);
  assert.equal(renderer.calls, 0);
});
test('produce runs the steps in order: load, check, voices, build, render, captions', async () => {
  const log: string[] = [];
  await new ProduceVideo(dependencies({ log })).run('x');
  assert.deepEqual(log, ['load', 'check', 'voices', 'build', 'render', 'captions']);
});
test('produce writes output/video.mp4 and output/captions.srt inside the project folder', async () => {
  const renderer = new FakeRenderer();
  const captions: string[] = [];
  const result = await new ProduceVideo(dependencies({ renderer, captions })).run('/projetos/ana');
  assert.deepEqual(result, { video: '/projetos/ana/output/video.mp4', captions: '/projetos/ana/output/captions.srt' });
  assert.deepEqual(renderer.outputs, ['/projetos/ana/output/video.mp4']);
  assert.deepEqual(captions, ['/projetos/ana/output/captions.srt']);
  assert.deepEqual(renderer.rendered, [PROPS]);
});
test('check warnings do not stop the video; they and the progress reach the observer', async () => {
  const warned: string[] = [];
  const fractions: number[] = [];
  const report: CheckReport = { errors: [], warnings: [{ line: '', message: 'fundo.png não encontrada' }] };
  await new ProduceVideo(dependencies({ report })).run('x', { onWarning: (problem) => warned.push(problem.message), onRender: (fraction) => fractions.push(fraction) });
  assert.deepEqual(warned, ['fundo.png não encontrada']);
  assert.deepEqual(fractions, [0.5, 1]);
});
test('render alone builds and renders a project already loaded, without checking nor generating voices', async () => {
  const log: string[] = [];
  const { render } = dependencies({ log });
  const result = await render.run('/p', PROJECT);
  assert.deepEqual(log, ['build', 'render', 'captions']);
  assert.equal(result.video, '/p/output/video.mp4');
});
