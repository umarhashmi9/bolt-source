import React from 'react';
import { Dialog, DialogDescription, DialogRoot, DialogTitle } from '../ui/Dialog';

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
        className="max-w-[90vw] p-10 gap-10 bg-bolt-elements-background-depth-1"
      >
        <div className="flex flex-col gap-5 items-center max-w-[580px] mx-auto">
          <h1 className="text-bolt-elements-textPrimary text-5xl font-semibold">Pricing</h1>
          <p className="text-bolt-elements-textSecondary text-center">
            Start with a free account to speed up your workflow on public projects or boost your entire team with
            instantly-opening production environments.
          </p>
        </div>
        <div className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg p-4">
          <div className="flex justify-between items-center">
            <p className="text-bolt-elements-textPrimary text-lg font-semibold">Free</p>
            <p className="text-bolt-elements-textSecondary text-lg font-semibold">$0</p>
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
}

export default PricingWindow;
