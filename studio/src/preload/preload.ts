import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { RENDER_PROGRESS_EVENT, type ChannelName, type RequestOf, type ResponseOf, type Result } from '../shared/contract.ts';
import type { GizApi } from '../shared/GizApi.ts';
import { SETUP_PROGRESS_EVENT } from '../shared/setup.ts';

// Only invokes the named channels; the main process validates every payload with zod before using it.
const call = <Name extends ChannelName>(name: Name, request: RequestOf<Name>) => ipcRenderer.invoke(name, request) as Promise<Result<ResponseOf<Name>>>;

// A listener of one pushed event; the returned function stops listening.
function listen<Payload>(event: string) {
  return (listener: (payload: Payload) => void): (() => void) => {
    const relay = (_event: IpcRendererEvent, payload: Payload) => listener(payload);
    ipcRenderer.on(event, relay);
    return () => ipcRenderer.removeListener(event, relay);
  };
}

const giz: GizApi = {
  projects: {
    pick: () => call('projects.pick', {}),
    launched: () => call('projects.launched', {}),
    open: (folder) => call('projects.open', { folder }),
    check: (folder) => call('projects.check', { folder }),
  },
  video: {
    render: (folder, aspect) => call('video.render', { folder, aspect }),
    cancel: () => call('video.cancel', {}),
    onProgress: listen(RENDER_PROGRESS_EVENT),
  },
  keys: {
    set: (provider, key) => call('keys.set', { provider, key }),
    has: (provider) => call('keys.has', { provider }),
    remove: (provider) => call('keys.remove', { provider }),
    status: () => call('keys.status', {}),
    test: (provider) => call('keys.test', { provider }),
  },
  settings: {
    get: () => call('settings.get', {}),
    update: (patch) => call('settings.update', patch),
    projectsFolder: (source) => call('settings.projectsFolder', { source }),
    modelsFolder: (source) => call('settings.modelsFolder', { source }),
    finish: () => call('settings.finish', {}),
  },
  setup: {
    gpu: () => call('gpu.status', {}),
    models: () => call('models.status', {}),
    run: (task) => call('setup.run', { task }),
    stop: (task) => call('setup.stop', { task }),
    onProgress: listen(SETUP_PROGRESS_EVENT),
  },
};

contextBridge.exposeInMainWorld('giz', giz);
