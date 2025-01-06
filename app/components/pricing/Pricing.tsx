import React from 'react';
import { Dialog, DialogDescription, DialogRoot, DialogTitle } from '../ui/Dialog';
import PricingCard from './Pricing-card';

interface PricingProps {
  pricingDialog: boolean;
  setPricingDialog: (pricingDialog: boolean) => void;
}

function PricingWindow({ pricingDialog, setPricingDialog }: PricingProps) {
  const handleClose = () => {
    setPricingDialog(false);
  };
  return (
    <DialogRoot open={pricingDialog}>
      <Dialog
        onBackdrop={handleClose}
        onClose={handleClose}
        className="max-w-[90vw] p-10 gap-10 bg-bolt-elements-background-depth-1 overflow-y-auto"
      >
        <div className="flex flex-col gap-5 items-center max-w-[580px] mx-auto mb-14">
          <h1 className="text-bolt-elements-textPrimary text-5xl font-semibold">Pricing</h1>
          <p className="text-bolt-elements-textSecondary text-center">
            Start with a free account to speed up your workflow on public projects or boost your entire team with
            instantly-opening production environments.
          </p>
        </div>
        <div className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg p-4 mb-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 justify-center">
              <img src="/bolt.png" alt="Bolt" className="w-6 h-6" />
              <p className="text-bolt-elements-textPrimary text-base font-regular">
                <span className="font-bold">100K</span> tokens left.
              </p>
            </div>
            <div className="flex flex-col gap-1 justify-end items-end">
              <p className="text-bolt-elements-textPrimary text-sm font-bold">Need more tokens?</p>
              <p className="text-bolt-elements-textPrimary text-sm font-regular">Upgrade your plan below</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <PricingCard />
          <PricingCard />
          <PricingCard />
          <PricingCard />
        </div>
      </Dialog>
    </DialogRoot>
  );
}

export default PricingWindow;
