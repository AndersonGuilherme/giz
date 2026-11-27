import { join } from 'node:path';
import { BrowserWindow, nativeImage } from 'electron';
import iconDataUrl from '../../assets/icon/icon-256.png?inline';
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

// What goes wrong in the page is written to the main process output (the terminal, the smoke test's log): a preload
// that failed, a renderer that died, a page that did not load, and the page's own warnings and errors.
const PAGE_LOG = 'giz page:';
function logPageProblems(window: BrowserWindow): void {
  const contents = window.webContents;
  contents.on('preload-error', (_event, path, error) => console.error(PAGE_LOG, 'preload-error', path, error.message));
  contents.on('render-process-gone', (_event, details) => console.error(PAGE_LOG, 'render-process-gone', details.reason, details.exitCode));
  contents.on('did-fail-load', (...[, code, description, url]) => console.error(PAGE_LOG, 'did-fail-load', code, description, url));
  contents.on('console-message', ({ level, message, sourceId, lineNumber }) => {
    if (level === 'warning' || level === 'error') console.error(PAGE_LOG, `console-${level}`, message, `${sourceId}:${lineNumber}`);
  });
}

/** The Studio window, with the slate background already painted while the page loads and the giz icon. */
export function createMainWindow(title: string): BrowserWindow {
  const preload = join(__dirname, 'preload.cjs');
  // The window icon (taskbar, title bar) on Linux and Windows; macOS takes the app bundle's icon.icns instead.
  const icon = nativeImage.createFromDataURL(iconDataUrl);
  const window = new BrowserWindow({ width: 1100, height: 760, minWidth: 720, minHeight: 520, title, icon, backgroundColor: '#26302d', webPreferences: { ...WEB_PREFERENCES, preload } });
  lockNavigation(window);
  logPageProblems(window);
  void load(window);
  return window;
}
