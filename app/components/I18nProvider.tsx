import React, { useState, useCallback } from 'react';
import { I18nContext, I18nContextType } from '../context/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

// Basic translations (replace with a proper i18n library later)
const translations: Record<string, Record<string, string>> = {
  en: {
    greeting: 'Hello',
    welcome: 'Welcome to our application!',
    'Loading repositories...': 'Loading repositories...',
    'This may take a moment': 'This may take a moment',
    'No repositories found': 'No repositories found',
    'Connect your GitHub account or create a new repository to get started': 'Connect your GitHub account or create a new repository to get started',
    'Connect GitHub Account': 'Connect GitHub Account',
    'Try searching with different keywords or filters': 'Try searching with different keywords or filters',
  },
  es: {
    greeting: 'Hola',
    welcome: '¡Bienvenido a nuestra aplicación!',
    'Loading repositories...': 'Cargando repositorios...',
    'This may take a moment': 'Esto puede tomar un momento',
    'No repositories found': 'No se encontraron repositorios',
    'Connect your GitHub account or create a new repository to get started': 'Conecta tu cuenta de GitHub o crea un nuevo repositorio para comenzar',
    'Connect GitHub Account': 'Conectar cuenta de GitHub',
    'Try searching with different keywords or filters': 'Intenta buscar con diferentes palabras clave o filtros',
  },
};

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [locale, setLocale] = useState<string>('en');

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] || key;
    },
    [locale]
  );

  const contextValue: I18nContextType = {
    locale,
    setLocale,
    t,
  };

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
};
