import { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import type { Project } from '../../../domain/project/Project.ts';
import { freshnessOf, StageItems, type StageItem } from '../../../domain/stages/StageItems.ts';
import type { ImageProvider } from '../../ports/ImageProvider.ts';
import type { ScenarioImageStore } from '../../ports/ScenarioImageStore.ts';
import type { VoiceProvider } from '../../ports/VoiceProvider.ts';
import type { VoiceStore } from '../../ports/VoiceStore.ts';
import { imageJobs, type ImageJob } from '../images/scenarioImageJobs.ts';
import { currentVoice } from '../voiceHash.ts';

/** The adapters of one project: its voice and image providers (only their hashes and estimates are used) and stores. */
export type StatusTools = Readonly<{ voice: VoiceProvider; voices: VoiceStore; images: ImageProvider; scenarioImages: ScenarioImageStore }>;
/** A stage's items and what each pending one (missing or stale) costs to make. */
export type ItemsAndCosts = Readonly<{ items: StageItems; costs: readonly CostEstimate[] }>;

type Priced = Readonly<{ item: StageItem; cost: () => CostEstimate }>;

const free = () => CostEstimate.ZERO;

function itemsAndCosts(priced: readonly Priced[]): ItemsAndCosts {
  const pending = priced.filter(({ item }) => item.freshness !== 'current');
  return { items: StageItems.of(priced.map(({ item }) => item)), costs: pending.map(({ cost }) => cost()) };
}

/** Every line's voice: missing without a saved one, stale when the saved hash is not what the line would make now. */
export async function voiceItems(project: Project, tools: StatusTools): Promise<ItemsAndCosts> {
  const lines = project.script().lines();
  const priced = await Promise.all(lines.each().map(async (line): Promise<Priced> => {
    const { request, hash } = await currentVoice(project, line, tools.voice);
    const item = { id: line.id(), freshness: freshnessOf(tools.voices.savedHash(line.id()), hash) };
    const estimate = tools.voice.estimate?.bind(tools.voice);
    return { item, cost: estimate ? () => estimate(request) : free };
  }));
  return itemsAndCosts(priced);
}

// A scene pointing to the person's own image has nothing for giz to make: it counts as current.
function imageItem(job: ImageJob, store: ScenarioImageStore): StageItem {
  if (job.status !== 'pending') return { id: job.lineId, freshness: 'current' };
  return { id: job.lineId, freshness: store.savedHash(job.lineId) === undefined ? 'missing' : 'stale' };
}

/** Every scene with `background.generate`: its image missing, stale (prompt, style, aspect or model changed) or current. */
export async function imageItems(project: Project, tools: StatusTools): Promise<ItemsAndCosts> {
  const { images, scenarioImages: store } = tools;
  const jobs = await imageJobs(project, { images, store }, {});
  return itemsAndCosts(jobs.map((job) => ({ item: imageItem(job, store), cost: () => images.estimate(job.request) })));
}
