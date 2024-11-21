import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { Login } from '~/components/ui/Login';

export const meta: MetaFunction = () => {
  return [{ title: 'Gizmo Coder (Bolt)' }, { name: 'description', content: 'Talk with Gizmo, an AI assistant from LabVantage (powered by Bolt)' }];
};

export const loader = () => json({});

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full">
      <Login>{( logout: MetaFunction)=><><Header onLogout={logout} /><ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly></>}</Login>
    </div>
  );
}
