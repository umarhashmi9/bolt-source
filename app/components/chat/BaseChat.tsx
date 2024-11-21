// @ts-nocheck
// Preventing TS checks with files presented in the video for a better presentation.
import type { Message } from 'ai';
import React, { type RefCallback, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { MODEL_LIST, DEFAULT_PROVIDER, PROVIDER_LIST, initializeModelList } from '~/utils/constants';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { useState } from 'react';
import { APIKeyManager } from './APIKeyManager';
import Cookies from 'js-cookie';

import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/utils/types';

const EXAMPLE_PROMPTS = [
  { text: 'Build a todo app in React using Tailwind' },
  { text: 'Build a simple blog using Astro' },
  { text: 'Create a cookie consent form using Material UI' },
  { text: 'Make a space invaders game' },
  { text: 'How do I center a div?' },
];

const providerList = PROVIDER_LIST;

const ModelSelector = ({ model, setModel, provider, setProvider, modelList, providerList }) => {
  return (
    <div className="mb-2 flex gap-2">
      <select
        value={provider?.name}
        onChange={(e) => {
          setProvider(providerList.find((p) => p.name === e.target.value));
          const firstModel = [...modelList].find((m) => m.provider == e.target.value);
          setModel(firstModel ? firstModel.name : '');
        }}
        className="flex-1 p-2 rounded-lg border transition-all border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
      >
        {providerList.map((provider) => (
          <option key={provider.name} value={provider.name}>
            {provider.name}
          </option>
        ))}
      </select>
      <select
        key={provider?.name}
        value={model}
        onChange={(e) => setModel(e.target.value)}
        style={{ maxWidth: '70%' }}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
      >
        {[...modelList]
          .filter((e) => e.provider == provider?.name && e.name)
          .map((modelOption) => (
            <option key={modelOption.name} value={modelOption.name}>
              {modelOption.label}
            </option>
          ))}
      </select>
    </div>
  );
};

const TEXTAREA_MIN_HEIGHT = 76;

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  messageRef?: RefCallback<HTMLDivElement>;
  scrollRef?: RefCallback<HTMLDivElement>;
  clientCanvasRef?: React.RefObject<HTMLCanvasElement>;
  serverCanvasRef?: React.RefObject<HTMLCanvasElement>;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  isVoiceConnected?: boolean;
  isMuted?: boolean;
  onVoiceToggle?: () => void;
  disconnectConversation?: () => void;
  connectConversation?: () => void;
  isConnected?: boolean;
  forceReply?: () => void;
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      clientCanvasRef,
      serverCanvasRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      model,
      setModel,
      provider,
      setProvider,
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
      isVoiceConnected,
      isMuted,
      onVoiceToggle,
      disconnectConversation,
      connectConversation,
      isConnected,
      forceReply,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [modelList, setModelList] = useState(MODEL_LIST);

    useEffect(() => {
      // Load API keys from cookies on component mount
      try {
        const storedApiKeys = Cookies.get('apiKeys');
        if (storedApiKeys) {
          const parsedKeys = JSON.parse(storedApiKeys);
          if (typeof parsedKeys === 'object' && parsedKeys !== null) {
            setApiKeys(parsedKeys);
          }
        }
      } catch (error) {
        console.error('Error loading API keys from cookies:', error);
        // Clear invalid cookie data
        Cookies.remove('apiKeys');
      }

      initializeModelList().then((modelList) => {
        setModelList(modelList);
      });
    }, []);

    const updateApiKey = (provider: string, key: string) => {
      try {
        const updatedApiKeys = { ...apiKeys, [provider]: key };
        setApiKeys(updatedApiKeys);
        // Save updated API keys to cookies with 30 day expiry and secure settings
        Cookies.set('apiKeys', JSON.stringify(updatedApiKeys), {
          expires: 30, // 30 days
          secure: true, // Only send over HTTPS
          sameSite: 'strict', // Protect against CSRF
          path: '/', // Accessible across the site
        });
      } catch (error) {
        console.error('Error saving API keys to cookies:', error);
      }
    };

    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full overflow-hidden bg-bolt-elements-background-depth-1',
        )}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex overflow-y-auto w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div id="intro" className="mt-[26vh] max-w-chat mx-auto text-center">
                <h1 className="mb-4 text-6xl font-bold text-bolt-elements-textPrimary animate-fade-in">
                  Where ideas begin
                </h1>
                <p className="mb-8 text-xl text-bolt-elements-textSecondary animate-fade-in animation-delay-200">
                  Bring ideas to life in seconds or get help on existing projects.
                </p>
              </div>
            )}
            <div
              className={classNames('px-6 pt-6', {
                'flex flex-col h-full': chatStarted,
              })}
            >
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className="flex flex-col flex-1 px-4 pb-6 mx-auto w-full max-w-chat z-1"
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames(
                  'bg-bolt-elements-background-depth-2 border-y border-bolt-elements-borderColor relative w-full max-w-chat mx-auto z-prompt',
                  {
                    'sticky bottom-0': chatStarted,
                  })}
              >
                <ModelSelector
                  key={provider?.name + ':' + modelList.length}
                  model={model}
                  setModel={setModel}
                  modelList={modelList}
                  provider={provider}
                  setProvider={setProvider}
                  providerList={PROVIDER_LIST}
                />
                {provider && (
                  <APIKeyManager
                    provider={provider}
                    apiKey={apiKeys[provider.name] || ''}
                    setApiKey={(key) => updateApiKey(provider.name, key)}
                  />
                )}
                <div
                  className={classNames(
                    'overflow-hidden rounded-lg border shadow-lg backdrop-filter transition-all border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-blur-[8px]',
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    className={`pt-4 pr-16 pl-4 w-full bg-transparent transition-all resize-none focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary`}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) {
                          return;
                        }

                        event.preventDefault();

                        sendMessage?.(event);
                      }
                    }}
                    value={input}
                    onChange={(event) => {
                      handleInputChange?.(event);
                    }}
                    style={{
                      minHeight: TEXTAREA_MIN_HEIGHT,
                      maxHeight: TEXTAREA_MAX_HEIGHT,
                    }}
                    placeholder="How can Bolt help you today?"
                    translate="no"
                  />
                  <ClientOnly>
                    {() => (
                      <SendButton
                        show={input.length > 0 || isStreaming}
                        isStreaming={isStreaming}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          sendMessage?.(event);
                        }}
                      />
                    )}
                  </ClientOnly>
                  <div className="flex justify-between items-center p-4 pt-2 text-sm">
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-bolt-elements-textSecondary">
                          {isConnected ? 'On' : 'Off'}
                        </span>
                      </div>
                      <button
                        onClick={isConnected ? disconnectConversation : connectConversation}
                        className="px-3 py-1 text-sm rounded-md border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-2 transition-colors"
                      >
                        {isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                      {isConnected && (
                        <IconButton
                          title="Force reply"
                          onClick={forceReply}
                          className={classNames('transition-all hover:bg-bolt-elements-background-depth-2')}
                        >
                          <div className="text-xl i-ph:chat-circle-dots"></div>
                        </IconButton>
                      )}
                      <IconButton
                        title={isVoiceConnected ? (isMuted ? 'Unmute voice chat' : 'Mute voice chat') : 'Start voice chat'}
                        onClick={onVoiceToggle}
                        className={classNames('transition-all', {
                          'text-bolt-elements-icon-success': isVoiceConnected && !isMuted,
                          'text-red-600': isVoiceConnected && isMuted,
                          'hover:bg-bolt-elements-background-depth-2': !isVoiceConnected,
                        })}
                      >
                        <div
                          className={classNames('text-xl', {
                            'i-ph:microphone-slash': isVoiceConnected && isMuted,
                            'i-ph:microphone-fill': isVoiceConnected && !isMuted,
                            'i-ph:microphone': !isVoiceConnected,
                          })}
                        />
                      </IconButton>
                      <div className="flex justify-between w-32 h-8">
                        <canvas ref={clientCanvasRef} className="bottom-0 left-0 w-full h-8 bg-transparent" />
                        <canvas ref={serverCanvasRef} className="left-0 bottom-16 w-full h-8 bg-transparent" />
                      </div>
                    </div>
                    {input.length > 3 ? (
                      <div className="text-xs text-bolt-elements-textTertiary">
                        Use <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Shift</kbd> +{' '}
                        <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Return</kbd> for
                        a new line
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="pb-6 bg-bolt-elements-background-depth-1">{/* Ghost Element */}</div>
              </div>
            </div>
            {!chatStarted && (
              <div id="examples" className="flex relative justify-center mx-auto mt-8 w-full max-w-xl">
                <div className="flex flex-col space-y-2 [mask-image:linear-gradient(to_bottom,black_0%,transparent_180%)] hover:[mask-image:none]">
                  {EXAMPLE_PROMPTS.map((examplePrompt, index) => {
                    return (
                      <button
                        key={index}
                        onClick={(event) => {
                          sendMessage?.(event, examplePrompt.text);
                        }}
                        className="flex gap-2 justify-center items-center w-full bg-transparent group text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-theme"
                      >
                        {examplePrompt.text}
                        <div className="i-ph:arrow-bend-down-left" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );
  },
);
