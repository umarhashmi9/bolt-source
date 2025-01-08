import { useState } from 'react';
import { Dialog, DialogRoot } from '../ui/Dialog';
import PricingCard from './Pricing-card';
import { Switch } from '../ui/Switch';
import { Link } from '@remix-run/react';

interface PricingProps {
  pricingDialog: boolean;
  setPricingDialog: (pricingDialog: boolean) => void;
}

const pricingData: Pricing[] = [
  {
    id: '1',
    price: 20,
    tokens: 10,
    description: 'Ideal for hobbyists and casual users for light, exploratory use.',
    annual: 216,
    priceId: 'price_1PbpgJKWfbR45IR7mYwUUMT9',
  },
  {
    id: '2',
    price: 50,
    tokens: 28,
    tokens_before: 25,
    annual: 540,
    description: 'Designed for professionals who need to use Bolt a few times per week.',
    priceId: 'price_1PbprLKWfbR45IR7HCZf44op',
  },
  {
    id: '3',
    price: 100,
    tokens: 55,
    tokens_before: 50,
    annual: 1080,
    description: 'Designed for professionals who need to use Bolt a few times per week.',
    priceId: 'price_1PbPqgKWfbR45IR7L4V0Y7RL',
  },
  {
    id: '4',
    price: 200,
    tokens: 125,
    tokens_before: 100,
    annual: 2160,
    description: 'Designed for professionals who need to use Bolt a few times per week.',
    priceId: 'price_1PbPqgKWfbR45IR7L4V0Y7RL',
  },
];

function PricingWindow({ pricingDialog, setPricingDialog }: PricingProps) {
  const [yearly, setYearly] = useState(false);
  const handleClose = () => {
    setPricingDialog(false);
    window.history.pushState(null, '', '/');
  };

  return (
    <DialogRoot open={pricingDialog}>
      <Dialog
        onBackdrop={handleClose}
        onClose={handleClose}
        className="max-w-[90vw] p-10 gap-10 dark:bg-black bg-white overflow-y-auto"
      >
        <div className="flex flex-col gap-5 items-center max-w-[580px] mx-auto mb-14">
          <h1 className="text-bolt-elements-textPrimary text-3xl md:text-5xl font-semibold">Pricing</h1>
          <p className="text-bolt-elements-textSecondary text-center text-sm md:text-base">
            Start with a free account to speed up your workflow on public projects or boost your entire team with
            instantly-opening production environments.
          </p>
        </div>
        <div className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center sm:flex-row flex-col gap-5">
            <div className="flex items-center gap-2 justify-center">
              <img src="/bolt.png" alt="Bolt" className="w-6 h-6" />
              <p className="text-bolt-elements-textPrimary text-sm md:text-base font-regular">
                <span className="font-bold">100K</span> tokens left.
              </p>
            </div>
            <div className="flex flex-col gap-1 sm:justify-end sm:items-end justify-center items-center">
              <p className="text-bolt-elements-textPrimary text-xs md:text-sm font-bold">Need more tokens?</p>
              <p className="text-bolt-elements-textPrimary text-xs md:text-sm font-regular">Upgrade your plan below</p>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-2 justify-center">
            <span className="text-bolt-elements-textSecondary text-sm md:text-base font-regular">Annual Billing</span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-5 mb-10">
          {pricingData.map((pricing) => (
            <PricingCard key={pricing.id} pricing={pricing} yearly={yearly} />
          ))}
        </div>
        <div className="flex flex-col items-center text-sm">
          <span className="i-ph:enterprise text-2xl"></span>
          <p className="mt-3 text-bolt-elements-textPrimary text-sm font-medium">
            Looking for <span className="font-bold">Enterprise</span> plans?
          </p>
          <Link to="/enterprise" target="_blank" className="font-bold mt-1 text-bolt-elements-item-contentAccent">
            Contact us for a quote
          </Link>
        </div>
      </Dialog>
    </DialogRoot>
  );
}

export default PricingWindow;
