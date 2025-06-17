import React, { useContext } from 'react';
import type { GitHubRepoInfo } from '~/types/GitHub';
import { EmptyState, StatusIndicator } from '~/components/ui';
import { useI18n } from '~/hooks/useI18n';
import { RepositoryCard } from './RepositoryCard';
import { RepositoryDialogContext } from './RepositoryDialogContext';

interface RepositoryListProps {
  repos: GitHubRepoInfo[];
  isLoading: boolean;
  onSelect: (repo: GitHubRepoInfo) => void;
  activeTab: string;
}

export function RepositoryList({ repos, isLoading, onSelect, activeTab }: RepositoryListProps) {
  const { t } = useI18n();
  // Access the parent component's setShowAuthDialog function
  const { setShowAuthDialog } = useContext(RepositoryDialogContext);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary-dark">
        <StatusIndicator status="loading" pulse={true} size="lg" label={t('Loading repositories...')} className="mb-2" />
        <p className="text-xs text-bolt-elements-textTertiary dark:text-bolt-elements-textTertiary-dark">
          {t('This may take a moment')}
        </p>
      </div>
    );
  }

  if (repos.length === 0) {
    if (activeTab === 'my-repos') {
      return (
        <EmptyState
          icon="i-ph:folder-simple-dashed"
          title={t('No repositories found')}
          description={t('Connect your GitHub account or create a new repository to get started')}
          actionLabel={t('Connect GitHub Account')}
          onAction={() => setShowAuthDialog(true)}
        />
      );
    } else {
      return (
        <EmptyState
          icon="i-ph:magnifying-glass"
          title={t('No repositories found')}
          description={t('Try searching with different keywords or filters')}
        />
      );
    }
  }

  return (
    <div className="space-y-3">
      {repos.map((repo) => (
        <RepositoryCard key={repo.full_name} repo={repo} onSelect={() => onSelect(repo)} />
      ))}
    </div>
  );
}
