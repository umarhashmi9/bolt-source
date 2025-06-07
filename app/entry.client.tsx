import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getInitialNamespaces } from 'remix-i18next/client';

async function hydrate() {
  await i18next
    .use(initReactI18next) // passes i18n down to react-i18next
    .use(LanguageDetector) // detects user language
    .init({
      supportedLngs: ['en', 'tr'], // ensure this matches middleware
      fallbackLng: 'en',
      react: { useSuspense: false }, // Optional: useSuspense
      ns: getInitialNamespaces(), // gets the namespaces used on the server
      detection: {
        // order and from where user language should be detected
        order: ['htmlTag', 'cookie', 'localStorage', 'path', 'subdomain'],
        caches: ['cookie'], // cache found language in cookie
        cookieSameSite: 'strict',
      },
      // resources will be passed from the server via remix-i18next/react's useChangeLanguage and root loader
      // No need for backend if resources are fully passed.
    });

  startTransition(() => {
    hydrateRoot(
      document, // Use document instead of document.getElementById('root')! for full page hydration
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      </I18nextProvider>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1);
}
