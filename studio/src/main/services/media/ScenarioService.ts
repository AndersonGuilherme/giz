import { IMAGE_STYLES, SCENE_IMAGE_PROVIDERS, type ImageCrop, type ImageEstimate, type ImageProgress, type ImageStyle, type ScenariosDocument, type SceneImageProvider } from '../../../shared/scenarios.ts';
import type { MediaCore, MediaFiles } from '../../ports/MediaCore.ts';
import type { ProjectDisk } from '../../ports/ProjectDisk.ts';
import { translate } from '../../text.ts';
import type { FolderGrants } from '../FolderGrants.ts';
import type { FolderQueue } from '../FolderQueue.ts';
import { StudioError } from '../StudioError.ts';
import { keepPrompt, keptPromptsOf } from './keptPrompts.ts';
import { OneJob } from './OneJob.ts';
import { savedOwnPicture } from './ownPictures.ts';
import { projectOf, scriptOf, type Json } from './projectJson.ts';
import { cardOf, croppedBackground, fileViewOf, generatedFile, scenarioLines, scenarioOf, withBackground, without, type ScenarioLine } from './sceneCards.ts';

/** `saves`: each folder's writes in turn (shared with the script editor); `provider`: the Settings image AI; `keyOf` reads its key in main. */
type Dependencies = Readonly<{
  core: MediaCore;
  disk: ProjectDisk;
  files: MediaFiles;
  grants: FolderGrants;
  saves: FolderQueue;
  vectors: () => Promise<readonly string[]>;
  provider: () => Promise<SceneImageProvider>;
  keyOf: (provider: SceneImageProvider) => Promise<string | undefined>;
  needsKey: boolean;
  progress: (progress: ImageProgress) => void;
}>;

const ASPECTS = ['9:16', '16:9'] as const;
const aspectOf = (project: Json) => (project.aspect === '16:9' ? ASPECTS[1] : ASPECTS[0]);
const choiceOf = <Value extends string>(options: readonly Value[], value: unknown): Value | undefined => (options as readonly unknown[]).includes(value) ? (value as Value) : undefined;

/** The Scenarios stage: each scene's background, from a vector, from the person's picture or from the image AI. */
export class ScenarioService {
  readonly #dependencies: Dependencies;
  readonly #job = new OneJob();

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async read(folder: string): Promise<ScenariosDocument> {
    const { disk, core, grants, vectors } = this.#dependencies;
    const path = grants.require(folder);
    const [project, script, items, kept] = await Promise.all([projectOf(disk, path), scriptOf(disk, path), core.items(path), keptPromptsOf(disk, path)]);
    const view = fileViewOf(this.#dependencies, path, { aspect: aspectOf(project), kept });
    const cards = await Promise.all(scenarioLines(script.lines).map((scene) => cardOf(scene, items.scenarios, view)));
    const style = choiceOf(IMAGE_STYLES, project.style) ?? 'painted-2d';
    return { folder: path, aspect: aspectOf(project), style, provider: await this.#providerOf(project), vectors: await vectors(), cards, stages: items.stages };
  }

  /** The image AI no longer makes the scene; its prompt is kept (scenes/prompts.json) to start from later. */
  async vector(folder: string, lineId: string, vector: string): Promise<ScenariosDocument> {
    if (!(await this.#dependencies.vectors()).includes(vector)) throw new StudioError('invalid-request', translate('scenarios.noSuchVector', { vector }));
    return this.#change(folder, lineId, async (path, scene) => {
      await keepPrompt(this.#dependencies.disk, path, { lineId, background: scene.background });
      return { ...without(scene.background, 'image', 'generate', 'vector', 'crop'), vector };
    });
  }

  /** The picture is copied into scenes/own/ (checked by its first bytes, never by its name) and wins over a generated one. */
  upload(folder: string, lineId: string, bytes: Uint8Array): Promise<ScenariosDocument> {
    return this.#change(folder, lineId, async (path, scene) => {
      const image = await savedOwnPicture(this.#dependencies, { folder: path, lineId, bytes });
      return { ...without(scene.background, 'crop'), image };
    });
  }

  prompt(folder: string, lineId: string, request: Readonly<{ prompt: string; style?: ImageStyle }>): Promise<ScenariosDocument> {
    const generate = { prompt: request.prompt.trim(), ...(request.style ? { style: request.style } : {}) };
    return this.#change(folder, lineId, async (_path, { background }) => ({ ...background, generate }));
  }

  async estimate(folder: string, lineId: string, force: boolean): Promise<ImageEstimate> {
    const path = this.#dependencies.grants.require(folder);
    const provider = await this.#providerOf(await projectOf(this.#dependencies.disk, path));
    const { model, pending, dollars } = await this.#dependencies.core.imageCost(path, { lineId, force, provider });
    return { provider, model, pending, dollars };
  }

  /** One image at a time; the project keeps the image AI it was made with (so its stage stays right). */
  generate(folder: string, lineId: string, force: boolean): Promise<ScenariosDocument> {
    const path = this.#dependencies.grants.require(folder);
    return this.#job.run(async (signal) => {
      const provider = await this.#dependencies.saves.run(path, () => this.#keepProvider(path));
      const key = await this.#key(provider);
      const onCall = () => this.#dependencies.progress({ lineId, phase: 'calling' });
      const queued = (write: () => Promise<void>) => this.#dependencies.saves.run(path, write);
      await this.#dependencies.core.generateImage(path, { lineId, force, provider, key, signal, onCall, queued });
      this.#dependencies.progress({ lineId, phase: 'done' });
      return this.read(path);
    });
  }

  cancel(): boolean {
    return this.#job.cancel();
  }

  /** "Usar a gerada": back to scenes/<id>.png when giz made it; otherwise no picture, so the image AI makes it. */
  useGenerated(folder: string, lineId: string): Promise<ScenariosDocument> {
    return this.#change(folder, lineId, async (path, { background }) => {
      const made = await this.#dependencies.files.exists(path, generatedFile(lineId));
      return made ? { ...without(background, 'crop'), image: generatedFile(lineId) } : without(background, 'image', 'crop');
    });
  }

  /** The part of the scene's picture shown (null: all of it); only a scene with a picture can be cropped. */
  crop(folder: string, lineId: string, crop: ImageCrop | null): Promise<ScenariosDocument> {
    return this.#change(folder, lineId, async (_path, { background }) => croppedBackground(background, crop));
  }

  settings(folder: string, settings: Readonly<{ style?: ImageStyle; provider?: SceneImageProvider }>): Promise<ScenariosDocument> {
    const path = this.#dependencies.grants.require(folder);
    return this.#dependencies.saves.run(path, async () => {
      const project = await projectOf(this.#dependencies.disk, path);
      const style = settings.style ? { style: settings.style } : {};
      const provider = settings.provider ? { imageProvider: settings.provider } : {};
      await this.#dependencies.disk.writeJson(path, 'project.json', { ...project, ...style, ...provider });
      return this.read(path);
    });
  }

  // One scene's background changed in the folder's queue: the scene is checked before anything is written.
  #change(folder: string, lineId: string, change: (path: string, scene: ScenarioLine) => Promise<Json>): Promise<ScenariosDocument> {
    const { disk, grants } = this.#dependencies;
    const path = grants.require(folder);
    return this.#dependencies.saves.run(path, async () => {
      const script = await scriptOf(disk, path);
      const background = await change(path, scenarioOf(script, lineId));
      await disk.writeJson(path, 'script.json', withBackground(script, lineId, () => background));
      return this.read(path);
    });
  }

  async #providerOf(project: Json): Promise<SceneImageProvider> {
    return choiceOf(SCENE_IMAGE_PROVIDERS, project.imageProvider) ?? (await this.#dependencies.provider());
  }

  async #keepProvider(folder: string): Promise<SceneImageProvider> {
    const project = await projectOf(this.#dependencies.disk, folder);
    const provider = await this.#providerOf(project);
    if (project.imageProvider !== provider) await this.#dependencies.disk.writeJson(folder, 'project.json', { ...project, imageProvider: provider });
    return provider;
  }

  async #key(provider: SceneImageProvider): Promise<string | undefined> {
    const key = await this.#dependencies.keyOf(provider);
    if (this.#dependencies.needsKey && key === undefined) throw new StudioError('invalid-request', translate('scenarios.noKey', { provider }));
    return key;
  }
}
