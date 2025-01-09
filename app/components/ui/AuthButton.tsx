import { Form } from '@remix-run/react';
import { useState } from 'react';

interface AuthButtonProps {
  provider: string;
  icon: string;
}

export default function AuthButton({ provider, icon }: AuthButtonProps) {
  const [loading, setLoading] = useState(false);
  return (
    <Form action={`/auth/${provider}`} method="post" className="w-full">
      <button
        className={`flex border border-accent-600 items-center gap-2 p-[13px] text-sm text-bolt-elements-textPrimary rounded-md w-full  justify-center relative ${loading ? ' border-bolt-elements-borderColor dark:bg-[#292d32] bg-bolt-elements-prompt-background' : 'bg-accent-600'}`}
        disabled={loading}
        onClick={() => {
          setTimeout(() => {
            setLoading(true);
          }, 0);
        }}
      >
        {loading ? (
          <span className="i-svg-spinners:90-ring-with-bg size-6"></span>
        ) : (
          <img src={`/icons/${icon}.svg`} alt={provider} className="w-6 h-6" />
        )}
        <span className="text-sm font-bold">
          Continue with <span className="capitalize">{provider}</span>
        </span>
      </button>
    </Form>
  );
}
