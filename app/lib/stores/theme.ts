import { atom } from 'nanostores';
import { logStore } from './logs';

export type Theme = 'dark' | 'light' | 'purple';

export const kTheme = 'bolt_theme';

export function themeIsDark() {
  return themeStore.get() === 'dark';
}

export const DEFAULT_THEME = 'light';

export const themeStore = atom<Theme>(initStore());

function initStore() {
  if (!import.meta.env.SSR) {
    const persistedTheme = localStorage.getItem(kTheme) as Theme | undefined;
    const themeAttribute = document.querySelector('html')?.getAttribute('data-theme');

    return persistedTheme ?? (themeAttribute as Theme) ?? DEFAULT_THEME;
  }

  return DEFAULT_THEME;
}

export function setTheme(newTheme: Theme) {
  themeStore.set(newTheme);
  localStorage.setItem(kTheme, newTheme);
  document.querySelector('html')?.setAttribute('data-theme', newTheme);
  try {
    const userProfile = localStorage.getItem('bolt_user_profile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      profile.theme = newTheme;
      localStorage.setItem('bolt_user_profile', JSON.stringify(profile));
    }
  } catch (error) {
    console.error('Error updating user profile theme:', error);
  }
  logStore.logSystem(`Theme changed to ${newTheme} mode`);
}

export function toggleTheme() {
  const currentTheme = themeStore.get();
  let newTheme: Theme;
  if (currentTheme === 'light') {
    newTheme = 'dark';
  } else if (currentTheme === 'dark') {
    newTheme = 'purple';
  } else {
    newTheme = 'light';
  }
  setTheme(newTheme); // Call the new setTheme function
}
