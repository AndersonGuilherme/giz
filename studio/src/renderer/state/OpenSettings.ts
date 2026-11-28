import { createContext, useContext } from 'react';

/** Opens Settings from anywhere in the Studio (a failure that only Settings can fix offers it); absent outside the Studio. */
export const OpenSettingsContext = createContext<(() => void) | undefined>(undefined);

export const useOpenSettings = (): (() => void) | undefined => useContext(OpenSettingsContext);
