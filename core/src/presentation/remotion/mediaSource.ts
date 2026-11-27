import { createContext, useContext } from 'react';
import { staticFile } from 'remotion';

/**
 * Where the video loads a file it asks for by its path in the project (`voice/1.wav`, `scenes/2.png`, `sounds/pop.wav`):
 * the render's public folder (`staticFile`) by default; the Studio's window gives the URLs it serves them at.
 */
export const MediaSource = createContext<(path: string) => string>(staticFile);

export const useMediaSource = (): ((path: string) => string) => useContext(MediaSource);
