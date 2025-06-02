import { useStore } from '@nanostores/react';
import { memo, useEffect, useState } from 'react';
import { themeStore, toggleTheme } from '~/lib/stores/theme';
import { IconButton } from './IconButton';

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = memo(({ className }: ThemeSwitchProps) => {
  const theme = useStore(themeStore);
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  let iconClass = '';
  if (theme === 'dark') {
    iconClass = 'i-ph-sun-dim-duotone';
  } else if (theme === 'light') {
    iconClass = 'i-ph-moon-stars-duotone';
  } else {
    // purple theme
    iconClass = 'i-ph:palette-duotone';
  }
  return (
    domLoaded && (
      <IconButton
        className={className}
        icon={iconClass}
        size="xl"
        title="Toggle Theme"
        onClick={toggleTheme}
      />
    )
  );
});
