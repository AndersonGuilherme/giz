import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { RENDER_PROGRESS_EVENT, type ChannelName, type RenderProgress, type RequestOf, type ResponseOf, type Result } from '../shared/contract.ts';
import type { GizApi } from '../shared/GizApi.ts';

// Only invokes the named channels; the main process validates every payload with zod before using it.
const call = <Name extends ChannelName>(name: Name, request: RequestOf<Name>) => ipcRenderer.invoke(name, request) as Promise<Result<ResponseOf<Name>>>;

function onProgress(listener: (progress: RenderProgress) => void): () => void {
  const relay = (_event: IpcRendererEvent, progress: RenderProgress) => listener(progress);
  ipcRenderer.on(RENDER_PROGRESS_EVENT, relay);
  return () => ipcRenderer.removeListener(RENDER_PROGRESS_EVENT, relay);
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
    onProgress,
  },
  keys: {
    set: (provider, key) => call('keys.set', { provider, key }),
    has: (provider) => call('keys.has', { provider }),
    remove: (provider) => call('keys.remove', { provider }),
  },
};

contextBridge.exposeInMainWorld('giz', giz);
