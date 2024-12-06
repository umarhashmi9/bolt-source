import React, { useState } from 'react';
import { ThemeSwitch } from './ThemeSwitch';
import { SettingsDialog } from './SettingsDialog';
import { IconButton } from './IconButton';

interface ThemeAndSettingsProps {
  className?: string;
}

export function ThemeAndSettings({ className }: ThemeAndSettingsProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <IconButton icon="i-ph-gear-six-duotone" size="xl" title="Settings" onClick={() => setIsSettingsOpen(true)} />
      <ThemeSwitch />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
