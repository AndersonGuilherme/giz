import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { RENDER_PROGRESS_EVENT, type ChannelName, type RequestOf, type ResponseOf, type Result } from '../shared/contract.ts';
import type { GizApi } from '../shared/GizApi.ts';
import { SCRIPT_PROGRESS_EVENT } from '../shared/projects.ts';
import { SETUP_PROGRESS_EVENT } from '../shared/setup.ts';
import { mediaBridge } from './mediaBridge.ts';

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
  ...mediaBridge(call, listen),
  projects: {
    pick: () => call('projects.pick', {}),
    launched: () => call('projects.launched', {}),
    open: (folder) => call('projects.open', { folder }),
    check: (folder) => call('projects.check', { folder }),
    list: () => call('projects.list', {}),
    create: (idea) => call('projects.create', { idea }),
    duplicate: (folder) => call('projects.duplicate', { folder }),
    trash: (folder) => call('projects.trash', { folder }),
    forget: (folder) => call('projects.forget', { folder }),
    stages: (folder) => call('projects.stages', { folder }),
  },
  ideas: {
    presets: () => call('ideas.presets', {}),
    portraits: () => call('ideas.portraits', {}),
  },
  script: {
    estimate: (idea) => call('script.estimate', { idea }),
    generate: (idea) => call('script.generate', { idea }),
    cancel: () => call('script.cancel', {}),
    onProgress: listen(SCRIPT_PROGRESS_EVENT),
    read: (folder) => call('script.read', { folder }),
    save: (folder, script) => call('script.save', { folder, script }),
    check: (folder) => call('script.check', { folder }),
    vocabulary: () => call('script.vocabulary', {}),
    checkScene: (scene) => call('script.checkScene', { scene }),
  },
  video: {
    render: (folder, aspect) => call('video.render', { folder, aspect }),
    cancel: (folder) => call('video.cancel', { folder }),
    status: () => call('video.status', {}),
    onProgress: listen(RENDER_PROGRESS_EVENT),
    preview: (folder, aspect) => call('video.preview', { folder, ...(aspect ? { aspect } : {}) }),
    openFolder: (folder) => call('video.openFolder', { folder }),
    copyCaptions: (folder, aspect) => call('video.copyCaptions', { folder, aspect }),
    exportCaptions: (folder, aspect) => call('video.exportCaptions', { folder, aspect }),
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
