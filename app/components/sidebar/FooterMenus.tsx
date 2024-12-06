import React, { useState } from 'react';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { SettingsDialog } from '~/components/settings/SettingsDialog';
import { IconButton } from '~/components/ui/IconButton';

interface FooterMenusProps {
  className?: string;
}

export function FooterMenus({ className }: FooterMenusProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <IconButton icon="i-ph-gear-six-duotone" size="xl" title="Settings" onClick={() => setIsSettingsOpen(true)} />
      <ThemeSwitch />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
