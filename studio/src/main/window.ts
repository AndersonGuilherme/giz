import { join } from 'node:path';
import { BrowserWindow } from 'electron';
import type { AppOrigin } from './ipc/senderTrust.ts';

// The window runs only the renderer bundle: no Node in it, an isolated preload world, the Chromium sandbox on.
const WEB_PREFERENCES = { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } as const;

/** Where our page comes from: the Vite dev server while developing, our own index.html once packaged. */
export function appOrigin(): AppOrigin {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) return { devServer: MAIN_WINDOW_VITE_DEV_SERVER_URL };
  return { indexFile: join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`) };
}

function load(window: BrowserWindow): Promise<void> {
  const { devServer, indexFile } = appOrigin();
  if (devServer) return window.loadURL(devServer);
  return window.loadFile(indexFile ?? '');
}

// The window never navigates away from the app nor opens other windows.
function lockNavigation(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
}

/** The Studio window, with the slate background already painted while the page loads. */
export function createMainWindow(title: string): BrowserWindow {
  const preload = join(__dirname, 'preload.cjs');
  const window = new BrowserWindow({ width: 1100, height: 760, minWidth: 720, minHeight: 520, title, backgroundColor: '#26302d', webPreferences: { ...WEB_PREFERENCES, preload } });
  lockNavigation(window);
  void load(window);
  return window;
}
