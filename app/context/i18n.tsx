import { createContext } from 'react';

export interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);
