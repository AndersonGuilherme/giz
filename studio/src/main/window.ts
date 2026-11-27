import { join } from 'node:path';
import { BrowserWindow } from 'electron';

// The window runs only the renderer bundle: no Node in it, an isolated preload world, the Chromium sandbox on.
const WEB_PREFERENCES = { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } as const;

function load(window: BrowserWindow): Promise<void> {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) return window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  return window.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
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
