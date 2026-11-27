type Steps = Readonly<{ register: () => void; openWindow: () => void }>;

/**
 * The app start: the IPC channels are registered once (a second `ipcMain.handle` of a channel throws), a window opens
 * on every call (macOS `activate` calls it again after the last window closed).
 */
export function launcher({ register, openWindow }: Steps): () => void {
  let registered = false;
  return () => {
    if (!registered) register();
    registered = true;
    openWindow();
  };
}
