import React from 'react';

export default function PricingCard() {
  return (
    <div className="border rounded-lg bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor">
      <div className="flex flex-col gap-2.5 p-5.5 min-h-[132px] relative">
        <h1 className="text-3xl text-bolt-elements-textPrimary">Pro</h1>
        <div>
          <div className="flex items-center text-base">
            <div className="font-semibold flex items-center gap-1">
              <img src="/bolt.png" alt="Bolt" className="w-6 h-6" />
              <p className="text-bolt-elements-textPrimary text-base font-regular">10M tokens</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-bolt-elements-textSecondary">
            Ideal for hobbyists and casual users for light, exploratory use.
          </p>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center gap-2 border-t border-bolt-elements-borderColor min-h-[120px]">
        <div className="relative leading-none pl-5 text-bolt-elements-textPrimary">
          <span className="absolute left-1 top-0.5 text-base ">$</span>
          <span className="text-4xl">20</span>
          <span className="text-sm">/ month</span>
        </div>
        <div className="text-sm text-bolt-elements-textSecondary">Billed monthly</div>
      </div>
    </div>
  );
}
