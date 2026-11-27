import type { Project } from '../../../domain/project/Project.ts';
import type { BackgroundRequest } from '../../../domain/script/Scene.ts';
import { ScenarioImageFrame } from '../../../domain/scenario/ScenarioImageFrame.ts';
import { scenarioImagePrompt } from '../../../domain/scenario/ScenarioImagePrompt.ts';
import type { ImageProvider, ImageRequest } from '../../ports/ImageProvider.ts';
import type { ScenarioImageStore } from '../../ports/ScenarioImageStore.ts';

/** Which scenes to make: all of them, `only` one (kept when current) or `force` one (made again even when current). */
export type ImageSelection = Readonly<{ only?: string; force?: string }>;
/** One scene's image: the request to send, its cache hash and whether the saved image is already that one. */
export type ImageJob = Readonly<{ lineId: string; request: ImageRequest; hash: string; current: boolean }>;
export type ImageDependencies = Readonly<{ images: ImageProvider; store: ScenarioImageStore }>;

type SceneRequest = Readonly<{ lineId: string; generate: BackgroundRequest }>;

// Only a scene's background asks for a generated image (a beat switching backgrounds uses images that exist).
function sceneRequests(project: Project): SceneRequest[] {
  const lines = project.script().lines();
  return lines.each().flatMap((line) => {
    const scene = line.scene();
    const generate = scene?.type === 'scenario' ? scene.background.generate : undefined;
    return generate ? [{ lineId: line.id(), generate }] : [];
  });
}

function selected(requests: readonly SceneRequest[], selection: ImageSelection): readonly SceneRequest[] {
  const wanted = selection.force ?? selection.only;
  if (wanted === undefined) return requests;
  const found = requests.filter((request) => request.lineId === wanted);
  if (found.length === 0) throw new Error(`a fala "${wanted}" não tem cenário a gerar (falta background.generate na cena dela)`);
  return found;
}

// Web Crypto (a Node and browser global): the application does not import node:crypto.
async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// The cache key holds what the person chose (prompt, style, aspect, service, model), not the composed prompt: a new
// wording of the presets in giz does not pay for every image again.
async function jobOf(project: Project, scene: SceneRequest, dependencies: ImageDependencies): Promise<Omit<ImageJob, 'current'>> {
  const { provider, model } = dependencies.images.identity();
  const [aspect, style] = [project.aspect(), scene.generate.style ?? project.imageStyle()];
  const prompt = scene.generate.prompt.trim();
  const hash = await sha256([prompt, style, aspect.text(), provider, model].join('|'));
  const request = { prompt: scenarioImagePrompt({ prompt, style, aspect }), size: ScenarioImageFrame.sizeFor(aspect) };
  return { lineId: scene.lineId, request, hash };
}

/** The image of every selected scene with `background.generate`, in script order, each marked current or not. */
export async function imageJobs(project: Project, dependencies: ImageDependencies, selection: ImageSelection): Promise<ImageJob[]> {
  const scenes = selected(sceneRequests(project), selection);
  const jobs = await Promise.all(scenes.map((scene) => jobOf(project, scene, dependencies)));
  return jobs.map((job) => {
    const forced = selection.force === job.lineId;
    return { ...job, current: !forced && dependencies.store.savedHash(job.lineId) === job.hash };
  });
}
