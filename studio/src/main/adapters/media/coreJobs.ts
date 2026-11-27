import type { ImageCost, ImageJob, StageItems } from '../../ports/MediaCore.ts';
import { translate } from '../../text.ts';
import { coreCostEstimate, coreImages, coreMain, coreStages } from './mediaModules.ts';

type Project = Awaited<ReturnType<ReturnType<Awaited<ReturnType<typeof coreMain>>['projectRepository']>['load']>>;
type ImageProvider = Parameters<Awaited<ReturnType<typeof coreImages>>['scenarioImagesWith']>[1];
type VoiceProvider = NonNullable<Parameters<Awaited<ReturnType<typeof coreMain>>['generateVoicesWith']>[2]['voice']>;

/** The rehearsal voice and painter (no network, no model), when the Studio runs in rehearsal mode. */
export type StandIns = Readonly<{ painter: (real: ImageProvider) => ImageProvider; voice: VoiceProvider }>;

// Only the one key of this call (read by main from the Studio's key store); nothing from the CLI's files.
const keysWith = (service: string, key: string | undefined) => ({
  get: (name: string) => (name === service ? key : undefined),
  hint: () => translate('keys.hint'),
});

const loaded = async (folder: string): Promise<Project> => (await coreMain()).projectRepository().load(folder);

type Report = Readonly<{ stage: string; state: string; problems: readonly string[]; stale: readonly string[]; missing: readonly string[]; blocked: readonly string[] }>;
const NO_ITEMS: Report = { stage: '', state: 'empty', problems: [], stale: [], missing: [], blocked: [] };

const briefOf = ({ stage, state, problems, stale, missing, blocked }: Report) =>
  ({ stage, state, problems: problems.length + stale.length + missing.length + blocked.length }) as StageItems['stages'][number];

type Cost = Awaited<ReturnType<typeof coreCostEstimate>>['CostEstimate']['ZERO'];

async function dollarsOf(costs: readonly Cost[] | undefined): Promise<number | null> {
  if (!costs) return null;
  const { CostEstimate } = await coreCostEstimate();
  return costs.reduce((sum, cost) => sum.plus(cost), CostEstimate.ZERO).dollars() ?? null;
}

/** The stages, the voices and scenes out of date or missing, and what the pending voices cost. */
export async function stageItemsOf(folder: string): Promise<StageItems> {
  const { stages, pending } = await (await coreStages()).projectStages().run(folder);
  const reports: readonly Report[] = stages.each();
  const report = (stage: string) => reports.find((each) => each.stage === stage) ?? NO_ITEMS;
  const [voices, scenes] = [report('voices'), report('scenarios')];
  return {
    stages: reports.map(briefOf),
    voices: { stale: voices.stale, missing: voices.missing },
    scenarios: { stale: scenes.stale, missing: scenes.missing, blocked: scenes.blocked, problems: scenes.problems },
    voiceDollars: await dollarsOf(pending?.voices),
  };
}

async function imagesFor(folder: string, job: ImageJob, standIns: StandIns | undefined) {
  const images = await coreImages();
  if (!standIns) return images.scenarioImages(folder, job.provider, { keys: keysWith(job.provider, job.key) });
  const painter = standIns.painter(images.imageProviderOf(job.provider));
  return { generate: images.scenarioImagesWith(folder, painter), model: painter.identity().model };
}

const selectionOf = (job: ImageJob) => (job.force ? { force: job.lineId } : { only: job.lineId });

export async function imageCostOf(folder: string, job: ImageJob, standIns: StandIns | undefined): Promise<ImageCost> {
  const { generate, model } = await imagesFor(folder, job, standIns);
  const { pending, cost } = await generate.estimate(await loaded(folder), selectionOf(job));
  return { model, pending, dollars: cost.dollars() ?? null };
}

export async function generateImageIn(folder: string, job: ImageJob, standIns: StandIns | undefined): Promise<void> {
  const { generate } = await imagesFor(folder, job, standIns);
  const project = await loaded(folder);
  job.onCall?.();
  await generate.run(project, { ...selectionOf(job), signal: job.signal });
}

/** A paid voice's key (read by main) as core asks for it; without one, the message says where to add it. */
export const voiceKeys = (key: string | undefined) => (service: string): string => {
  if (key) return key;
  throw new Error(translate('media.noVoiceKey', { service }));
};
