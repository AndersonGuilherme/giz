import type { Project } from '../../../domain/project/Project.ts';
import type { Background } from '../../../domain/script/Scene.ts';
import { ScenarioImageFrame } from '../../../domain/scenario/ScenarioImageFrame.ts';
import { scenarioImagePrompt } from '../../../domain/scenario/ScenarioImagePrompt.ts';
import type { ImageProvider, ImageRequest } from '../../ports/ImageProvider.ts';
import { scenarioImageFile, type ScenarioImageStore } from '../../ports/ScenarioImageStore.ts';
import { hexDigest } from '../hexDigest.ts';
import { ScenarioImageError } from './ScenarioImageError.ts';

/** Which scenes to make: all of them, `only` one (kept when current) or `force` one (made again even when current). */
export type ImageSelection = Readonly<{ only?: string; force?: string }>;
/** `pending`: to make; `current`: the saved image is this one; `own`: the scene points to the person's own image. */
export type ImageStatus = 'pending' | 'current' | 'own';
/** One scene's image: the request to send, its cache hash and its status. */
export type ImageJob = Readonly<{ lineId: string; request: ImageRequest; hash: string; status: ImageStatus }>;
export type ImageDependencies = Readonly<{ images: ImageProvider; store: ScenarioImageStore }>;

type SceneRequest = Readonly<{ lineId: string; background: Background & { generate: NonNullable<Background['generate']> } }>;

// Only a scene's background asks for a generated image (a beat switching backgrounds uses images that exist).
function sceneRequests(project: Project): SceneRequest[] {
  const lines = project.script().lines();
  return lines.each().flatMap((line) => {
    const scene = line.scene();
    const background = scene?.type === 'scenario' ? scene.background : undefined;
    return background?.generate ? [{ lineId: line.id(), background: { ...background, generate: background.generate } }] : [];
  });
}

function selected(requests: readonly SceneRequest[], selection: ImageSelection): readonly SceneRequest[] {
  const wanted = selection.force ?? selection.only;
  if (wanted === undefined) return requests;
  const found = requests.filter((request) => request.lineId === wanted);
  if (found.length === 0) throw new ScenarioImageError(`a fala "${wanted}" não tem cenário a gerar (falta background.generate na cena dela)`);
  return found;
}

// The cache key holds what the person chose (prompt, style, aspect, service, model), not the composed prompt: a new
// wording of the presets in giz does not pay for every image again.
async function jobOf(project: Project, scene: SceneRequest, dependencies: ImageDependencies): Promise<Omit<ImageJob, 'status'>> {
  const { provider, model } = dependencies.images.identity();
  const [aspect, style] = [project.aspect(), scene.background.generate.style ?? project.imageStyle()];
  const prompt = scene.background.generate.prompt.trim();
  const hash = await hexDigest('SHA-256', [prompt, style, aspect.text(), provider, model].join('|'));
  const caption = { format: project.format(), style: project.captionStyle() };
  const request = { prompt: scenarioImagePrompt({ prompt, style, aspect, caption }), size: ScenarioImageFrame.sizeFor(aspect) };
  return { lineId: scene.lineId, request, hash };
}

// An image of the person's own (any path but scenes/<id>.png) wins: the scene is left alone, even with --force.
function statusOf(scene: SceneRequest, job: Omit<ImageJob, 'status'>, context: Readonly<{ store: ScenarioImageStore; selection: ImageSelection }>): ImageStatus {
  const { image } = scene.background;
  if (image !== undefined && image !== scenarioImageFile(scene.lineId)) return 'own';
  if (context.selection.force === scene.lineId) return 'pending';
  return context.store.savedHash(scene.lineId) === job.hash ? 'current' : 'pending';
}

// Checked before any paid call: an image to make whose file the person put there (or changed) is never overwritten.
async function rejectForeignFiles(jobs: readonly ImageJob[], store: ScenarioImageStore): Promise<void> {
  const pending = jobs.filter((job) => job.status === 'pending');
  const foreign = await Promise.all(pending.map((job) => store.foreignFile(job.lineId)));
  const lineIds = pending.filter((_job, index) => foreign[index]).map((job) => job.lineId);
  if (lineIds.length === 0) return;
  const files = lineIds.map(scenarioImageFile).join(', ');
  throw new ScenarioImageError(`${files} já existe(m) e não foi(ram) feito(s) pelo giz images (ou mudou/mudaram depois): `
    + 'para usar o arquivo, aponte background.image para ele; para gerar de novo, mova ou apague o arquivo');
}

/** The image of every selected scene with `background.generate`, in script order, each with its status. */
export async function imageJobs(project: Project, dependencies: ImageDependencies, selection: ImageSelection): Promise<ImageJob[]> {
  const scenes = selected(sceneRequests(project), selection);
  const context = { store: dependencies.store, selection };
  const jobs = await Promise.all(scenes.map(async (scene) => {
    const job = await jobOf(project, scene, dependencies);
    return { ...job, status: statusOf(scene, job, context) };
  }));
  await rejectForeignFiles(jobs, dependencies.store);
  return jobs;
}
