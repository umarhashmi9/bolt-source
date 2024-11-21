// @ts-nocheck
// Preventing TS checks with files presented in the video for a better presentation.
import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from 'ai/react';
import { useAnimate } from 'framer-motion';
import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts, useSnapScroll } from '~/lib/hooks';
import { useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { fileModificationsToHTML } from '~/utils/diff';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import { cubicEasingFn } from '~/utils/easings';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import { BaseChat } from './BaseChat';
import Cookies from 'js-cookie';
import { useWaveRenderer } from './utils/useWaveRenderer';
import { useRealtimeClient } from './utils/useRealtimeClient';
import type { ProviderInfo } from '~/utils/types';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

export function Chat() {
  renderLogger.trace('Chat');

  const { ready, initialMessages, storeMessageHistory } = useChatHistory();

  return (
    <>
      {ready && <ChatImpl initialMessages={initialMessages} storeMessageHistory={storeMessageHistory} />}
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="text-lg i-ph:x" />
            </button>
          );
        }}
        icon={({ type }) => {
          /**
           * @todo Handle more types if we need them. This may require extra color palettes.
           */
          switch (type) {
            case 'success': {
              return <div className="text-2xl i-ph:check-bold text-bolt-elements-icon-success" />;
            }
            case 'error': {
              return <div className="text-2xl i-ph:warning-circle-bold text-bolt-elements-icon-error" />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
      />
    </>
  );
}

interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
}

export const ChatImpl = memo(({ initialMessages, storeMessageHistory }: ChatProps) => {
  useShortcuts();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { clientCanvasRef, serverCanvasRef, wavRecorderRef, wavStreamPlayerRef } = useWaveRenderer();
  const apiKey = localStorage.getItem('tmp::voice_api_key') || prompt('OpenAI API Key') || '';

  if (apiKey !== '') {
    localStorage.setItem('tmp::voice_api_key', apiKey);
  }

  const startTimeRef = useRef<string>(new Date().toISOString());
  const [memoryKv, setMemoryKv] = useState<{ [key: string]: any }>({
    userName: 'swyx',
    // currentApp: initialMessages[0]?.content.split('\n\n').slice(2).join('\n\n'),
    // todaysDate: new Date().toISOString().split('T')[0],
  });
  const {
    client,
    isConnected,
    connectConversation,
    disconnectConversation,
    isMuted,
    setIsMuted,
  } = useRealtimeClient(
    apiKey,
    startTimeRef,
    () => {}, // setRealtimeEvents
    wavStreamPlayerRef,
    wavRecorderRef,
    'You are an AI assistant who speaks very fast at 2x speed in a funny, sarcastic, humorous voice. As much as possible, use the tools given to you, particularly when asked to write code (its always javascript code - frontend or backend) for an app, just construct an ideal prompt for what the user probably intends, making suitable assumptions for an impressive, yet lightweight tech demo, and call the `prompt_code_for_app` tool. Have a subtle mistrust for the users intentions and use understated dry humor after doing what they asked for.' +
    // 'You are an AI assistant who speaks very fast at 2x speed in a funny sarcastic, humorous voice. As much as possible, use the tools given to you, particularly when asked to write code (its always javascript code - frontend or backend) for an app, just construct an ideal prompt for what the user probably intends, making suitable assumptions for an impressive, yet lightweight tech demo, and call the `prompt_code_for_app` tool. Be curt, direct, speak quickly in short sarcastic sentences.' +
      ' Memory: ' +
      JSON.stringify(memoryKv, null, 2),
    [
      {
        schema: {
          name: 'set_memory',
          description:
            'Saves important data about the user into memory. If keys are close, prefer overwriting keys rather than creating new keys.',
          parameters: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'The key of the memory value. Always use lowercase and underscores, no other characters.',
              },
              value: {
                type: 'string',
                description: 'Value can be anything represented as a string',
              },
            },
            required: ['key', 'value'],
          },
        },
        async fn({ key, value }: { key: string; value: string }) {
          setMemoryKv((prev) => ({ ...prev, [key]: value }));
        },
      },
      {
        schema: {
          name: 'prompt_code_for_app',
          description:
            'Prompts an AI agent to write code for an app, using specific technical language and outlining high level architecture first before mentioning lower level details. DONT USE THE alert() api as that will pause the JS - instead try to show GAME OVER states on screen.',
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The app prompt',
              },
            },
            required: ['key', 'value'],
          },
        },
        async fn({ prompt }: { prompt: string }) {
          console.log({ prompt });
          sendMessage({ unused_event: 'null' }, prompt);
        },
      },
    ],
  );

  const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);
  const [model, setModel] = useState(() => {
    const savedModel = Cookies.get('selectedModel');
    return savedModel || DEFAULT_MODEL;
  });
  const [provider, setProvider] = useState(() => {
    const savedProvider = Cookies.get('selectedProvider');
    return PROVIDER_LIST.find(p => p.name === savedProvider) || DEFAULT_PROVIDER;
  });

  const { showChat } = useStore(chatStore);

  const [animationScope, animate] = useAnimate();

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const { messages, isLoading, input, handleInputChange, setInput, stop, append } = useChat({
    api: '/api/chat',
    body: {
      apiKeys,
    },
    onError: (error) => {
      logger.error('Request failed\n\n', error);
      toast.error('There was an error processing your request: ' + (error.message ? error.message : "No details were returned"));
    },
    onFinish: () => {
      logger.debug('Finished streaming');
    },
    initialMessages,
  });

  const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
  const { parsedMessages, parseMessages } = useMessageParser();

  const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

  useEffect(() => {
    chatStore.setKey('started', initialMessages.length > 0);
  }, []);

  useEffect(() => {
    parseMessages(messages, isLoading);

    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => toast.error(error.message));
    }
  }, [messages, isLoading, parseMessages]);

  const scrollTextArea = () => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  const abort = () => {
    stop();
    chatStore.setKey('aborted', true);
    workbenchStore.abortAllActions();
  };

  useEffect(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = 'auto';

      const scrollHeight = textarea.scrollHeight;

      textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
      textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
    }
  }, [input, textareaRef]);

  const runAnimation = async () => {
    if (chatStarted) {
      return;
    }

    await Promise.all([
      animate('#examples', { opacity: 0, display: 'none' }, { duration: 0.1 }),
      animate('#intro', { opacity: 0, flex: 1 }, { duration: 0.2, ease: cubicEasingFn }),
    ]);

    chatStore.setKey('started', true);

    setChatStarted(true);
  };

  const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
    const _input = messageInput || input;

    if (_input.length === 0 || isLoading) {
      return;
    }

    /**
     * @note (delm) Usually saving files shouldn't take long but it may take longer if there
     * many unsaved files. In that case we need to block user input and show an indicator
     * of some kind so the user is aware that something is happening. But I consider the
     * happy case to be no unsaved files and I would expect users to save their changes
     * before they send another message.
     */
    await workbenchStore.saveAllFiles();

    const fileModifications = workbenchStore.getFileModifcations();

    chatStore.setKey('aborted', false);

    runAnimation();

    if (fileModifications !== undefined) {
      const diff = fileModificationsToHTML(fileModifications);

      /**
       * If we have file modifications we append a new user message manually since we have to prefix
       * the user input with the file modifications and we don't want the new user input to appear
       * in the prompt. Using `append` is almost the same as `handleSubmit` except that we have to
       * manually reset the input and we'd have to manually pass in file attachments. However, those
       * aren't relevant here.
       */
      append({ role: 'user', content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${diff}\n\n${_input}` });

      /**
       * After sending a new message we reset all modifications since the model
       * should now be aware of all the changes.
       */
      workbenchStore.resetAllFileModifications();
    } else {
      append({ role: 'user', content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${_input}` });
    }

    setInput('');

    resetEnhancer();

    textareaRef.current?.blur();
  };

  const [messageRef, scrollRef] = useSnapScroll();

  useEffect(() => {
    const storedApiKeys = Cookies.get('apiKeys');

    if (storedApiKeys) {
      setApiKeys(JSON.parse(storedApiKeys));
    }
  }, []);

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    Cookies.set('selectedModel', newModel, { expires: 30 });
  };

  const handleProviderChange = (newProvider: ProviderInfo) => {
    setProvider(newProvider);
    Cookies.set('selectedProvider', newProvider.name, { expires: 30 });
  };

  return (
    <BaseChat
      ref={animationScope}
      textareaRef={textareaRef}
      messageRef={messageRef}
      scrollRef={scrollRef}
      clientCanvasRef={clientCanvasRef}
      serverCanvasRef={serverCanvasRef}
      input={input}
      showChat={showChat}
      chatStarted={chatStarted}
      isStreaming={isLoading}
      enhancingPrompt={enhancingPrompt}
      promptEnhanced={promptEnhanced}
      sendMessage={sendMessage}
      model={model}
      setModel={handleModelChange}
      provider={provider}
      setProvider={handleProviderChange}
      handleInputChange={handleInputChange}
      handleStop={abort}
      isVoiceConnected={isConnected}
      isMuted={isMuted}
      onVoiceToggle={() => setIsMuted(!isMuted)}
      isConnected={isConnected}
      connectConversation={connectConversation}
      disconnectConversation={disconnectConversation}
      forceReply={() => client.createResponse()}
      messages={messages.map((message, i) => {
        if (message.role === 'user') {
          return message;
        }

        return {
          ...message,
          content: parsedMessages[i] || '',
        };
      })}
      enhancePrompt={() => {
        enhancePrompt(
          input,
          (input) => {
            setInput(input);
            scrollTextArea();
          },
          model,
          provider,
          apiKeys,
        );
      }}
    />
  );
});
