import { classNames } from '~/utils/classNames';

interface WelcomeMessageProps {
  className?: string;
  showDecorativeElements?: boolean;
}

export function WelcomeMessage({ className, showDecorativeElements = true }: WelcomeMessageProps) {
  return (
    <div className={classNames('text-center space-y-6 p-8', className)}>
      {/* Main Title with Handwritten Font */}
      <div className="relative">
        <h1 className="title-handwritten text-accent-500 mb-2 text-4xl md:text-5xl">
          Welcome to Bolt!
        </h1>
        {showDecorativeElements && (
          <div className="decorative-text text-accent-300 text-sm absolute -top-2 -right-4 opacity-70">
            ✨ magical
          </div>
        )}
      </div>

      {/* Subtitle */}
      <p className="subtitle-handwritten text-bolt-elements-textSecondary max-w-2xl mx-auto">
        Let's create something amazing together!
      </p>

      {/* Decorative Labels */}
      {showDecorativeElements && (
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <span className="label-handwritten bg-accent-50 text-accent-700 px-3 py-1 rounded-full transform -rotate-1">
            AI-powered
          </span>
          <span className="label-handwritten bg-green-50 text-green-700 px-3 py-1 rounded-full transform rotate-1">
            Creative
          </span>
          <span className="label-handwritten bg-blue-50 text-blue-700 px-3 py-1 rounded-full transform -rotate-0.5">
            Intuitive
          </span>
        </div>
      )}

      {/* Handwritten Note */}
      <div className="mt-8 relative">
        <div className="decorative-text text-bolt-elements-textTertiary text-base max-w-md mx-auto leading-relaxed">
          Just start a conversation and I'll help you develop your ideas...
        </div>
        {showDecorativeElements && (
          <div className="absolute -bottom-2 right-1/4 text-accent-400 text-lg transform rotate-12">
            →
          </div>
        )}
      </div>
    </div>
  );
}

// Smaller variant for compact spaces
export function CompactWelcome({ className }: { className?: string }) {
  return (
    <div className={classNames('text-center space-y-3', className)}>
      <h2 className="heading-handwritten text-accent-500">
        Hello! 👋
      </h2>
      <p className="text-handwritten text-bolt-elements-textSecondary text-sm">
        How can I help you today?
      </p>
    </div>
  );
}

// Decorative accent component
export function HandwrittenAccent({ 
  children, 
  className,
  color = 'accent' 
}: { 
  children: React.ReactNode;
  className?: string;
  color?: 'accent' | 'green' | 'blue' | 'purple';
}) {
  const colorClasses = {
    accent: 'text-accent-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
  };

  return (
    <span className={classNames(
      'text-handwritten font-normal tracking-wide',
      colorClasses[color],
      className
    )}>
      {children}
    </span>
  );
}
