import type { Dispatch, SetStateAction } from 'react';
import type { TabType, TabVisibilityConfig } from '~/components/settings/settings.types';
import { UserDropdownMenu } from '~/components/settings/shared/UserDropdownMenu';

export interface ProfileHeaderProps {
  onNavigate: Dispatch<SetStateAction<TabType | null>>;
  visibleTabs: TabVisibilityConfig[];
  onClose?: () => void;
  hasUnreadNotifications?: boolean;
  unreadNotificationsCount?: number;
  avatarUrl?: string | null;
}

export function ProfileHeader({
  onNavigate,
  visibleTabs,
  onClose,
  hasUnreadNotifications,
  unreadNotificationsCount,
  avatarUrl,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-bolt-border mb-6 pb-2">
      <nav className="flex items-center gap-6">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className="px-3 py-2 text-sm font-medium text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors relative group"
          >
            {tab.id}
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-bolt-elements-textPrimary transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </button>
        ))}
      </nav>

      <UserDropdownMenu
        onNavigate={onNavigate}
        onClose={onClose}
        hasUnreadNotifications={hasUnreadNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
        avatarUrl={avatarUrl}
        _windowType="user"
      />
    </div>
  );
}
