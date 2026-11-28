import type { SharedConfigStore, SharedSettings } from '../../ports/SettingsStores.ts';
import type { SetupTools } from '../../ports/SetupTools.ts';

type Restart = () => void;

// What the voice worker reads once per process (core's install config): a change to these needs a new worker.
const VOICE_KEYS: ReadonlyArray<keyof SharedSettings> = ['model', 'device', 'modelsDir'];

/** The setup tools; a task that finished (a model downloaded, the GPU installed) closes the voice worker. */
export function restartingAfterSetup(tools: SetupTools, restart: Restart): SetupTools {
  return {
    gpu: (modelsDir) => tools.gpu(modelsDir),
    models: (modelsDir) => tools.models(modelsDir),
    run: async (task, job) => {
      await tools.run(task, job);
      restart();
    },
  };
}

/** gizzycera.config.json; a write of what the voices read (model, device, models folder) closes the voice worker. */
export function restartingAfterConfig(store: SharedConfigStore, restart: Restart): SharedConfigStore {
  return {
    read: () => store.read(),
    defaults: () => store.defaults(),
    write: async (patch) => {
      const written = await store.write(patch);
      if (VOICE_KEYS.some((key) => key in patch)) restart();
      return written;
    },
  };
}
