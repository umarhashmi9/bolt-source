// app/components/chat/ChatSkeleton.tsx
export function ChatSkeleton() {
  return (
    <div className="flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full items-center justify-center p-4">
      <div className="animate-pulse w-full max-w-chat mx-auto">
        <div className="text-center mb-8">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-md w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-md w-1/2 mx-auto"></div>
        </div>
        {/* Placeholder for a few messages */}
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex items-start space-x-3 mb-6 ${i % 2 === 0 ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className="rounded-full bg-gray-300 dark:bg-gray-700 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-md w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-md w-5/6"></div>
            </div>
          </div>
        ))}
        {/* Placeholder for chat input box */}
        <div className="mt-8">
          <div className="h-16 bg-gray-300 dark:bg-gray-700 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  );
}
