import React from 'react';
import { useI18n } from '../hooks/useI18n';
import { Button } from './ui/Button'; // Assuming a Button component exists

export const LanguageSelector: React.FC = () => {
  const { locale, setLocale } = useI18n();

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
      <Button
        onClick={() => setLocale('en')}
        disabled={locale === 'en'}
        variant={locale === 'en' ? 'default' : 'outline'}
        size="sm"
      >
        English
      </Button>
      <Button
        onClick={() => setLocale('es')}
        disabled={locale === 'es'}
        variant={locale === 'es' ? 'default' : 'outline'}
        size="sm"
        style={{ marginLeft: '5px' }}
      >
        Español
      </Button>
    </div>
  );
};
