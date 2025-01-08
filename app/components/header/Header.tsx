import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { Link } from '@remix-run/react';
import { useGetUser } from '~/lib/hooks/useGetUser';

export function Header() {
  const chat = useStore(chatStore);
  const { user, loading } = useGetUser();

  return (
    <header
      className={classNames('flex items-center justify-between p-5 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
        {user && <div className="i-ph:sidebar-simple-duotone text-xl" />}
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          {/* <span className="i-bolt:logo-text?mask w-[46px] inline-block" /> */}
          <img src="/logo-light-styled.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="mr-1">
                <HeaderActionButtons />
              </div>
            )}
          </ClientOnly>
        </>
      )}
      {!user && !loading && (
        <div className="flex gap-2">
          <Link
            to="/sign-in"
            className="text-bolt-elements-textPrimary px-[16px] py-[6px] rounded-md text-xs bg-[#3B3B3B]"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="text-bolt-elements-textPrimary px-[16px] py-[6px] rounded-md text-xs bg-[#9E0DE1]"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
