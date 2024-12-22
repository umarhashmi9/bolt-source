import React from 'react';
import { ProviderCard } from '~/lib/git/components/ProviderCard';
import { useGitProviders } from '~/lib/git/hooks/useGitProviders';

export default function ConnectionsTab() {
  const {
    providers,
    credentials,
    expandedProviders,
    handleSaveConnection,
    handleDisconnect,
    updateProviderCredentials,
    toggleProvider,
  } = useGitProviders();

  return (
    <div className="space-y-4">
      {Object.entries(providers).map(([key, plugin]) => (
        <ProviderCard
          key={key}
          provider={plugin.provider}
          credentials={credentials[key]}
          isExpanded={expandedProviders[key]}
          onToggle={() => toggleProvider(key)}
          onUpdateCredentials={(updates) => updateProviderCredentials(key, updates)}
          onSave={() => handleSaveConnection(key)}
          onDisconnect={() => handleDisconnect(key)}
        />
      ))}
    </div>
  );
}
