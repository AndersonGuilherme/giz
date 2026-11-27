import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProjectStages, type StageFacts } from '../../../src/domain/stages/ProjectStages.ts';
import { freshnessOf, StageItems } from '../../../src/domain/stages/StageItems.ts';

const current = (id: string) => ({ id, freshness: 'current' as const });
const DONE: StageFacts = {
  idea: true,
  script: { present: true, problems: [] },
  made: {
    voices: StageItems.of([current('1'), current('2')]),
    scenarios: StageItems.of([current('1')]),
    video: { made: true, olderThanInputs: false },
  },
};

const stateOf = (facts: StageFacts) => Object.fromEntries(ProjectStages.from(facts).each().map((report) => [report.stage, report.state]));

test('the stages come in order: idea, script, cast, scenarios, voices, video', () => {
  assert.deepEqual(ProjectStages.from(DONE).each().map((report) => report.stage), ['idea', 'script', 'cast', 'scenarios', 'voices', 'video']);
});

test('an empty folder: every stage is empty', () => {
  const facts: StageFacts = { idea: false, script: { present: false, problems: [] } };
  assert.deepEqual(stateOf(facts), { idea: 'empty', script: 'empty', cast: 'empty', scenarios: 'empty', voices: 'empty', video: 'empty' });
});

test('only the idea: the idea is done and the script is ready to be written', () => {
  const facts: StageFacts = { idea: true, script: { present: false, problems: [] } };
  assert.deepEqual(stateOf(facts), { idea: 'done', script: 'ready', cast: 'empty', scenarios: 'empty', voices: 'empty', video: 'empty' });
});

test('everything made and current: every stage is done', () => {
  assert.deepEqual(stateOf(DONE), { idea: 'done', script: 'done', cast: 'done', scenarios: 'done', voices: 'done', video: 'done' });
});

test('a script written by hand without idea.json: the idea stays empty, the rest is not affected', () => {
  assert.equal(stateOf({ ...DONE, idea: false }).idea, 'empty');
  assert.equal(stateOf({ ...DONE, idea: false }).script, 'done');
});

test('a script with check errors (or that does not load) is stale and carries the problems', () => {
  const stages = ProjectStages.from({ ...DONE, script: { present: true, problems: ['fala 2: texto fora da área segura'] } });
  assert.equal(stages.of('script').state, 'stale');
  assert.deepEqual(stages.of('script').problems, ['fala 2: texto fora da área segura']);
  const unloaded = ProjectStages.from({ idea: true, script: { present: true, problems: ['project.json: arquivo não encontrado'] } });
  assert.deepEqual(stateOf({ idea: true, script: { present: true, problems: ['x'] } }), { idea: 'done', script: 'stale', cast: 'empty', scenarios: 'empty', voices: 'empty', video: 'empty' });
  assert.equal(unloaded.of('cast').state, 'empty');
});

test('voices: none made yet is ready; some made and none outdated is ready; one outdated is stale; all current is done', () => {
  const withVoices = (voices: StageItems) => ProjectStages.from({ ...DONE, made: { ...DONE.made!, voices } }).of('voices');
  assert.equal(withVoices(StageItems.of([{ id: '1', freshness: 'missing' }, { id: '2', freshness: 'missing' }])).state, 'ready');
  const partly = withVoices(StageItems.of([current('1'), { id: '2', freshness: 'missing' }]));
  assert.deepEqual([partly.state, partly.missing, partly.stale], ['ready', ['2'], []]);
  const outdated = withVoices(StageItems.of([{ id: '1', freshness: 'stale' }, current('2'), { id: '3', freshness: 'missing' }]));
  assert.deepEqual([outdated.state, outdated.stale, outdated.missing], ['stale', ['1'], ['3']]);
  assert.equal(withVoices(StageItems.of([current('1')])).state, 'done');
});

test('scenarios: no scene to generate is done; a missing image is ready; a changed prompt is stale', () => {
  const withScenes = (scenarios: StageItems) => ProjectStages.from({ ...DONE, made: { ...DONE.made!, scenarios } }).of('scenarios');
  assert.equal(withScenes(StageItems.NONE).state, 'done');
  assert.equal(withScenes(StageItems.of([{ id: '4', freshness: 'missing' }])).state, 'ready');
  assert.deepEqual(withScenes(StageItems.of([{ id: '4', freshness: 'stale' }, current('5')])).stale, ['4']);
});

test('video: none yet is ready; older than its inputs is stale; a pending voice or image also makes it stale', () => {
  const withVideo = (video: { made: boolean; olderThanInputs: boolean }) => ProjectStages.from({ ...DONE, made: { ...DONE.made!, video } }).of('video').state;
  assert.equal(withVideo({ made: false, olderThanInputs: false }), 'ready');
  assert.equal(withVideo({ made: true, olderThanInputs: true }), 'stale');
  const staleVoice = { ...DONE.made!, voices: StageItems.of([{ id: '1', freshness: 'stale' as const }]) };
  assert.equal(ProjectStages.from({ ...DONE, made: staleVoice }).of('video').state, 'stale');
  const missingScene = { ...DONE.made!, scenarios: StageItems.of([{ id: '3', freshness: 'missing' as const }]) };
  assert.equal(ProjectStages.from({ ...DONE, made: missingScene }).of('video').state, 'stale');
});

test('freshness: no saved hash is missing, another hash is stale, the same hash is current', () => {
  assert.equal(freshnessOf(undefined, 'abc'), 'missing');
  assert.equal(freshnessOf('abd', 'abc'), 'stale');
  assert.equal(freshnessOf('abc', 'abc'), 'current');
});

test('only the item whose hash changed goes stale', () => {
  const saved: Record<string, string> = { 1: 'h1', 2: 'h2', 3: 'h3' };
  const now: Record<string, string> = { 1: 'h1', 2: 'h2-new', 3: 'h3' };
  const items = StageItems.of(Object.keys(now).map((id) => ({ id, freshness: freshnessOf(saved[id], now[id]!) })));
  assert.deepEqual(items.stale(), ['2']);
  assert.deepEqual(items.missing(), []);
  assert.equal(items.state(), 'stale');
});
