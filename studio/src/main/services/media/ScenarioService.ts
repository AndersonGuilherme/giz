import { join } from 'node:path';
import { IMAGE_STYLES, MAXIMUM_IMAGE_BYTES, SCENE_IMAGE_PROVIDERS, type ImageEstimate, type ImageProgress, type ImageStyle, type ScenariosDocument, type SceneImageProvider } from '../../../shared/scenarios.ts';
import type { MediaCore, MediaFiles } from '../../ports/MediaCore.ts';
import type { ProjectDisk } from '../../ports/ProjectDisk.ts';
import { translate } from '../../text.ts';
import type { FolderGrants } from '../FolderGrants.ts';
import { StudioError } from '../StudioError.ts';
import { mediaUrlOf } from './mediaUrls.ts';
import { OneJob } from './OneJob.ts';
import { lineIn, projectOf, scriptOf, type Json } from './projectJson.ts';
import { cardOf, generatedFile, scenarioLines, withBackground, without, type FileView } from './sceneCards.ts';

/** `provider`: the image AI chosen in Settings; `keyOf` reads its key in main; `needsKey` false in rehearsal mode. */
type Dependencies = Readonly<{
  core: MediaCore;
  disk: ProjectDisk;
  files: MediaFiles;
  grants: FolderGrants;
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
    const [project, script, items] = await Promise.all([projectOf(disk, path), scriptOf(disk, path), core.items(path)]);
    const view = this.#view(path, aspectOf(project));
    const cards = await Promise.all(scenarioLines(script.lines).map((scene) => cardOf(scene, items.scenarios, view)));
    const style = choiceOf(IMAGE_STYLES, project.style) ?? 'painted-2d';
    return { folder: path, aspect: aspectOf(project), style, provider: await this.#providerOf(project), vectors: await vectors(), cards, stages: items.stages };
  }

  async vector(folder: string, lineId: string, vector: string): Promise<ScenariosDocument> {
    if (!(await this.#dependencies.vectors()).includes(vector)) throw new StudioError('invalid-request', translate('scenarios.noSuchVector', { vector }));
    return this.#change(folder, lineId, (background) => ({ ...without(background, 'image', 'generate', 'vector'), vector }));
  }

  /** The picture is copied into scenes/ (checked by its first bytes, never by its name) and wins over a generated one. */
  async upload(folder: string, lineId: string, bytes: Uint8Array): Promise<ScenariosDocument> {
    const path = this.#dependencies.grants.require(folder);
    lineIn((await scriptOf(this.#dependencies.disk, path)).lines, lineId);
    if (bytes.byteLength > MAXIMUM_IMAGE_BYTES) throw new StudioError('invalid-request', translate('scenarios.tooBig', { most: MAXIMUM_IMAGE_BYTES / 1024 / 1024 }));
    const format = await this.#dependencies.core.imageFormat(bytes);
    if (!format) throw new StudioError('invalid-request', translate('scenarios.notAPicture'));
    const file = `scenes/${lineId}-own.${format === 'jpeg' ? 'jpg' : format}`;
    await this.#dependencies.files.write(path, file, bytes);
    return this.#change(path, lineId, (background) => ({ ...background, image: file }));
  }

  prompt(folder: string, lineId: string, request: Readonly<{ prompt: string; style?: ImageStyle }>): Promise<ScenariosDocument> {
    const generate = { prompt: request.prompt.trim(), ...(request.style ? { style: request.style } : {}) };
    return this.#change(folder, lineId, (background) => ({ ...background, generate }));
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
      const provider = await this.#keepProvider(path);
      const key = await this.#key(provider);
      const onCall = () => this.#dependencies.progress({ lineId, phase: 'calling' });
      await this.#dependencies.core.generateImage(path, { lineId, force, provider, key, signal, onCall });
      this.#dependencies.progress({ lineId, phase: 'done' });
      return this.read(path);
    });
  }

  cancel(): boolean {
    return this.#job.cancel();
  }

  /** "Usar a gerada": back to scenes/<id>.png when giz made it; otherwise no picture, so the image AI makes it. */
  async useGenerated(folder: string, lineId: string): Promise<ScenariosDocument> {
    const path = this.#dependencies.grants.require(folder);
    const made = await this.#dependencies.files.exists(path, generatedFile(lineId));
    return this.#change(path, lineId, (background) => (made ? { ...background, image: generatedFile(lineId) } : without(background, 'image')));
  }

  async settings(folder: string, settings: Readonly<{ style?: ImageStyle; provider?: SceneImageProvider }>): Promise<ScenariosDocument> {
    const path = this.#dependencies.grants.require(folder);
    const project = await projectOf(this.#dependencies.disk, path);
    const style = settings.style ? { style: settings.style } : {};
    const provider = settings.provider ? { imageProvider: settings.provider } : {};
    await this.#dependencies.disk.writeJson(path, 'project.json', { ...project, ...style, ...provider });
    return this.read(path);
  }

  async #change(folder: string, lineId: string, change: (background: Json) => Json): Promise<ScenariosDocument> {
    const { disk, grants } = this.#dependencies;
    const path = grants.require(folder);
    const script = await scriptOf(disk, path);
    const scene = scenarioLines(script.lines).find(({ line }) => line.id === lineIn(script.lines, lineId).id);
    if (!scene) throw new StudioError('invalid-request', translate('scenarios.notAScenario', { line: lineId }));
    await disk.writeJson(path, 'script.json', withBackground(script, lineId, change));
    return this.read(path);
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

  #view(folder: string, aspect: '9:16' | '16:9'): FileView {
    const { files, core } = this.#dependencies;
    const url = async (file: string) => {
      const version = await files.modified(folder, file);
      return version === undefined ? null : mediaUrlOf(join(folder, file), version);
    };
    const aspectWarning = async (file: string) => {
      const shape = await core.imageShape(join(folder, file), aspect);
      return shape && !shape.matches ? translate('scenarios.otherShape', { width: shape.width, height: shape.height, aspect }) : undefined;
    };
    return { url, aspectWarning };
  }
}
