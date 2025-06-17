import { useContext } from 'react';
import { I18nContext, I18nContextType } from '../context/i18n';

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
