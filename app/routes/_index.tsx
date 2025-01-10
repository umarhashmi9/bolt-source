import { json, type MetaFunction } from '@remix-run/cloudflare';
import { useEffect } from 'react';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt' }, { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }];
};

export const loader = () => json({});

export default function Index() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('userId');
    const userfromlocalstorage = localStorage.getItem('userId');
    if (userfromlocalstorage) {
      setUserId(userfromlocalstorage);
    } else if (userIdFromUrl) {
      setUserId(userIdFromUrl);
      localStorage.setItem('userId', userIdFromUrl);
    }
    if (!window.location.href.includes('api.checkout')) {
      window.history.pushState(null, '', '/');
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
