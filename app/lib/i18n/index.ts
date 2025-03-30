import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';
import esTranslation from './locales/es.json';
import frTranslation from './locales/fr.json';
import deTranslation from './locales/de.json';
import itTranslation from './locales/it.json';
import ptTranslation from './locales/pt.json';
import ruTranslation from './locales/ru.json';
import jaTranslation from './locales/ja.json';
import koTranslation from './locales/ko.json';

// Check if running in Electron environment
const isElectron = typeof window !== 'undefined' && 'electronI18n' in window;

// Create custom detector for Electron environment
const electronDetector = {
  name: 'electronDetector',
  lookup: async () => {
    if (isElectron) {
      try {
        // First try to get language setting from storage
        const storedLanguage = await window.electronI18n?.getLanguage();

        if (storedLanguage) {
          console.log('Using stored language from Electron:', storedLanguage);
          return storedLanguage;
        }

        // If no stored language setting, use system language
        const systemLocale = await window.electronI18n?.getSystemLocale();
        console.log('Using system locale from Electron:', systemLocale);

        // Convert system locale (e.g. zh-CN) to language code (e.g. zh)
        if (systemLocale) {
          const languageCode = systemLocale.split('-')[0];
          return languageCode;
        }
      } catch (error) {
        console.error('Error getting language from Electron:', error);
      }
    }

    return undefined;
  },
  cacheUserLanguage: async (lng: string) => {
    if (isElectron && lng) {
      try {
        await window.electronI18n?.setLanguage(lng);
        console.log('Language saved to Electron store:', lng);
      } catch (error) {
        console.error('Error saving language to Electron:', error);
      }
    }
  },
};

// Initialize i18next
i18n
  .use(initReactI18next) // Pass i18n to react-i18next
  .use(LanguageDetector) // Auto detect user language
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      zh: {
        translation: zhTranslation,
      },
      es: {
        translation: esTranslation,
      },
      fr: {
        translation: frTranslation,
      },
      de: {
        translation: deTranslation,
      },
      it: {
        translation: itTranslation,
      },
      pt: {
        translation: ptTranslation,
      },
      ru: {
        translation: ruTranslation,
      },
      ja: {
        translation: jaTranslation,
      },
      ko: {
        translation: koTranslation,
      },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // Prevent XSS attacks
    },
    detection: {
      // Put custom detector first, so it takes priority in Electron environment
      order: isElectron ? ['electronDetector', 'localStorage', 'navigator'] : ['localStorage', 'navigator'],
      lookupLocalStorage: 'bolt_user_language',
      caches: ['localStorage'],
    },
  });

// Register custom detector if in Electron environment
if (isElectron) {
  i18n.services.languageDetector.addDetector(electronDetector);
}

// Sync language changes to Electron storage
i18n.on('languageChanged', (lng) => {
  if (isElectron && window.electronI18n) {
    window.electronI18n.setLanguage(lng).catch((error) => {
      console.error('Error syncing language change to Electron:', error);
    });
  }
});

export default i18n;
