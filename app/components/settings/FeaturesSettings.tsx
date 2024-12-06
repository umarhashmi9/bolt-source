import React from 'react';

export default function FeaturesSettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Enable Chat Tab</h3>
          <p className="text-sm text-bolt-elements-textSecondary">Additional chat management features</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-bolt-elements-textSecondary italic">Coming Soon</span>
          <button
            className="px-3 py-1 rounded text-sm bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text opacity-50 cursor-not-allowed"
            disabled
          >
            Disabled
          </button>
        </div>
      </div>
    </div>
  );
}
