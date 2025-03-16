import { useTranslation } from 'react-i18next';
import { useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  // Always call hooks at the top level, regardless of conditions
  const { lngs } = useLoaderData<any>();
  const { i18n, t } = useTranslation('common', { useSuspense: false });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Render a loading state if not on client yet
  if (!isClient) {
    return <div className="flex items-center space-x-2">...</div>;
  }

  return (
    <div className="flex items-center space-x-2" title={t('languageSwitcher') || 'Change language'}>
      {Object.keys(lngs).map((lng) => (
        <a
          key={lng}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            i18n.resolvedLanguage === lng
              ? 'font-bold bg-white text-gray-800 border border-gray-200'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
          href={`?lng=${lng}`}
          aria-label={`Switch language to ${lngs[lng as keyof typeof lngs].nativeName}`}
        >
          {lngs[lng as keyof typeof lngs].nativeName}
        </a>
      ))}
    </div>
  );
}
