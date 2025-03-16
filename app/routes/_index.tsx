import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { useTranslation } from 'react-i18next';

export const handle = {
  i18n: ['common'],
};

export const meta: MetaFunction = () => {
  /*
   * Note: We can't use the useTranslation hook here because it's outside of a component
   * In a real app, you'd use the loader data to get translations for meta
   */
  return [{ title: 'Bolt - AI Agent' }, { name: 'description', content: 'An AI Agent built with Remix' }];
};

export const loader = () => json({});

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  const { t, ready } = useTranslation('common');

  if (!ready) {
    return (
      <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1 items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <div className="absolute top-16 left-0 right-0 flex justify-center z-10">
        <div className="bg-white rounded-lg p-4 shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">{t('welcome')}</h1>
          <p className="text-gray-600 mb-4">{t('description')}</p>
        </div>
      </div>
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
