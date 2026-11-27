import { createContext, useContext } from 'react';
import { translator, type Translate } from '../shared/i18n/translate.ts';

/** The window texts in the chosen interface language (pt-BR until the settings arrive). */
export const I18nContext = createContext<Translate>(translator());

export const useTranslate = (): Translate => useContext(I18nContext);
