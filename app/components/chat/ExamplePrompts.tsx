import React from 'react';

const EXAMPLE_PROMPTS = [
  {
    text: 'AI Travel',
    icon: "icons/start-nft-project-icon.svg",
  },
  {
    text: 'Crypto Dashboard',
    icon: "icons/create-tocken-icon.svg",
  },
  {
    text: 'Build Meme Site',
    icon: "/icons/build-meme-site-icon.svg",
  },
  {
    text: 'NFT Dashboard',
    icon: "/icons/start-blog-icon.svg",
  },
  {
    text: 'DAO Platform',
    icon: "/icons/dao-platform-icon.svg",
  },
  {
    text: 'Cyber city',
    icon: "/icons/cyber-city-icon.svg",
  },
];

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  return (
    <div id="examples" className="relative flex flex-col gap-9 w-full max-w-3xl mx-auto flex justify-center mt-6">
      <div
        className="flex flex-wrap justify-center gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {EXAMPLE_PROMPTS.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className="border border-bolt-elements-borderColor rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary px-3 py-1 text-xs transition-theme flex items-center gap-2">
                <img src={examplePrompt.icon} alt={examplePrompt.text} className="w-4 h-4" />
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
