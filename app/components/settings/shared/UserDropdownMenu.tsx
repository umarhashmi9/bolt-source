import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { UserCircle, Settings, Bell, X, Activity, Signal } from 'lucide-react';
import type { TabType, WindowType } from '~/components/settings/settings.types';
import { useState } from 'react';

interface UserDropdownMenuProps {
  onNavigate: (tab: TabType) => void;
  onClose?: () => void;
  hasUnreadNotifications?: boolean;
  unreadNotificationsCount?: number;
  avatarUrl?: string | null;
  _windowType: WindowType;
}

export function UserDropdownMenu({
  onNavigate,
  onClose,
  hasUnreadNotifications = false,
  unreadNotificationsCount = 0,
  avatarUrl = null,
  _windowType,
}: UserDropdownMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden hover:ring-2 ring-gray-300 dark:ring-gray-600 transition-all">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#FAFAFA] dark:bg-[#0A0A0A] flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-lg shadow-lg py-1 z-[9999] animate-in fade-in-0 zoom-in-95 border border-[#E5E5E5] dark:border-[#1A1A1A]"
          sideOffset={5}
          align="end"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenu.Item
            className="px-4 py-2.5 flex items-center text-sm text-[#1A1A1A] dark:text-[#FAFAFA] hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer"
            onSelect={() => onNavigate('profile')}
          >
            <UserCircle className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="px-4 py-2.5 flex items-center text-sm text-[#1A1A1A] dark:text-[#FAFAFA] hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer"
            onSelect={() => onNavigate('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="px-4 py-2.5 flex items-center text-sm text-[#1A1A1A] dark:text-[#FAFAFA] hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer"
            onSelect={() => onNavigate('notifications')}
          >
            <Bell className="mr-2 h-4 w-4" />
            <span className="flex items-center">
              Notifications
              {hasUnreadNotifications && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                  {unreadNotificationsCount}
                </span>
              )}
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-[#E5E5E5] dark:bg-[#1A1A1A] my-1" />

          <DropdownMenu.Item
            className="px-4 py-2.5 flex items-center text-sm text-[#1A1A1A] dark:text-[#FAFAFA] hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer"
            onSelect={() => onNavigate('task-manager')}
          >
            <Activity className="mr-2 h-4 w-4" />
            Task Manager
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="px-4 py-2.5 flex items-center text-sm text-[#1A1A1A] dark:text-[#FAFAFA] hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer"
            onSelect={() => onNavigate('service-status')}
          >
            <Signal className="mr-2 h-4 w-4" />
            Service Status
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-[#E5E5E5] dark:bg-[#1A1A1A] my-1" />

          <DropdownMenu.Item
            className="px-4 py-2.5 flex items-center text-sm text-red-500 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer"
            onSelect={onClose}
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
