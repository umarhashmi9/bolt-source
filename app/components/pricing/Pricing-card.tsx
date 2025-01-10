import { useState } from 'react';
import { useGetUser } from '~/lib/hooks/useGetUser';

interface CheckoutResponse {
  url?: string;
  error?: string;
}

export default function PricingCard({ pricing, yearly }: { pricing: Pricing; yearly: boolean }) {
  const { user } = useGetUser();
  const [loading, setLoading] = useState(false);
  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId: user?.id }),
    });

    const data: CheckoutResponse = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error(data.error);
    }
  };

  return (
    <div className="border rounded-lg bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor">
      <div className="flex flex-col gap-2.5 p-5.5 min-h-[132px] relative">
        <h1 className="text-2xl md:text-3xl text-bolt-elements-textPrimary">
          Pro
          <span className="font-bold"> {pricing.price}</span>
        </h1>
        <div>
          <p className="mt-4 text-xs md:text-sm text-bolt-elements-textSecondary">{pricing.description}</p>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center gap-2 border-t border-bolt-elements-borderColor min-h-[120px]">
        <div className="relative leading-none pl-5 text-bolt-elements-textPrimary">
          <span className="absolute left-1 top-0.5 text-base ">$</span>
          <span className="text-3xl md:text-4xl">{yearly ? pricing.annual / 12 : pricing.price}</span>
          <span className="text-sm md:text-base">/ month</span>
        </div>
        <div className="text-xs md:text-sm text-bolt-elements-textSecondary">
          Billed {yearly ? 'yearly' : 'monthly'}
        </div>
      </div>
      <div className="border-t border-bolt-elements-borderColor text-sm">
        <div className="flex justify-center p-6">
          <button
            className={`px-3 py-2 rounded-lg mt-auto text-center text-xs transition-theme flex-1 self-stretch text-bolt-elements-button-primary-text enabled:hover:bg-accent-700 ${loading ? 'dark:bg-gray-800 bg-gray-200' : 'bg-bolt-elements-button-primary-background '}`}
            onClick={() => handleSubscribe(pricing.priceId)}
            disabled={loading}
          >
            <span className="relative">
              {loading && <span className="absolute -left-6 h-full  i-svg-spinners:90-ring-with-bg size-4"></span>}
              Upgrade to Pro {pricing.price}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
