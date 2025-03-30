import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { Switch } from '~/components/ui/Switch';
import type { UserProfile } from '~/components/@settings/core/types';
import { isMac } from '~/utils/os';
import { useTranslation } from 'react-i18next';
import { debounce } from '~/utils/debounce';

// Helper to get modifier key symbols/text
const getModifierSymbol = (modifier: string): string => {
  switch (modifier) {
    case 'meta':
      return isMac ? '⌘' : 'Win';
    case 'alt':
      return isMac ? '⌥' : 'Alt';
    case 'shift':
      return '⇧';
    default:
      return modifier;
  }
};

export default function SettingsTab() {
  const { t, i18n } = useTranslation();
  const [currentTimezone, setCurrentTimezone] = useState('');
  const [settings, setSettings] = useState<UserProfile>(() => {
    // Defer localStorage read to avoid blocking the main thread during initial render
    if (typeof window === 'undefined') {
      return {
        notifications: true,
        language: 'en',
        timezone: 'UTC',
      };
    }

    // Use try-catch to handle potential JSON parse errors
    try {
      const saved = localStorage.getItem('bolt_user_profile');
      return saved
        ? JSON.parse(saved)
        : {
            notifications: true,
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
    } catch (error) {
      console.error('Error loading user profile:', error);
      return {
        notifications: true,
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
  });

  // Use useEffect to set timezone to avoid layout shifts during hydration
  useEffect(() => {
    setCurrentTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Listen for i18n language changes
  useEffect(() => {
    if (settings.language !== i18n.language) {
      setSettings((prev) => ({ ...prev, language: i18n.language }));
    }
  }, [i18n.language]);

  // Create debounced save function to avoid frequent localStorage operations
  const debouncedSaveSettings = useCallback(
    debounce(() => {
      try {
        // Get existing profile data
        const existingProfile = JSON.parse(localStorage.getItem('bolt_user_profile') || '{}');

        // Merge with new settings
        const updatedProfile = {
          ...existingProfile,
          notifications: settings.notifications,
          language: settings.language,
          timezone: settings.timezone,
        };

        // Use requestAnimationFrame to defer non-critical localStorage operation
        window.requestAnimationFrame(() => {
          localStorage.setItem('bolt_user_profile', JSON.stringify(updatedProfile));
          toast.success(t('common.save')); // "Settings updated" -> Use translation
        });
      } catch (error) {
        console.error('Error saving settings:', error);
        toast.error(t('common.error', 'Failed to update settings')); // Provide default value in case translation is missing
      }
    }, 500), // 500ms debounce delay
    [settings, t],
  );

  // Save settings automatically when they change
  useEffect(() => {
    debouncedSaveSettings();

    // Return cleanup function to cancel debounced call if component unmounts
    return () => {
      debouncedSaveSettings.cancel?.();
    };
  }, [settings, debouncedSaveSettings]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSettings((prev) => ({ ...prev, language: newLanguage }));
    i18n.changeLanguage(newLanguage);
  };

  return (
    <div className="space-y-4">
      {/* Language & Notifications */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-sm dark:shadow-none p-4 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="i-ph:palette-fill w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-bolt-elements-textPrimary">{t('settings.preferences')}</span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:translate-fill w-4 h-4 text-bolt-elements-textSecondary" />
            <label className="block text-sm text-bolt-elements-textSecondary">{t('common.language')}</label>
          </div>
          <select
            title={t('common.language')}
            value={settings.language}
            onChange={handleLanguageChange}
            className={classNames(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-[#FAFAFA] dark:bg-[#0A0A0A]',
              'border border-[#E5E5E5] dark:border-[#1A1A1A]',
              'text-bolt-elements-textPrimary',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
              'transition-all duration-200',
            )}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
            <option value="ru">Русский</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:bell-fill w-4 h-4 text-bolt-elements-textSecondary" />
            <label className="block text-sm text-bolt-elements-textSecondary">{t('common.notifications')}</label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-bolt-elements-textSecondary">
              {settings.notifications ? t('settings.notificationsEnabled') : t('settings.notificationsDisabled')}
            </span>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => {
                // Only update local state - the debounced effect will handle saving
                setSettings((prev) => ({ ...prev, notifications: checked }));

                /*
                 * Dispatch storage event for other components to sync immediately
                 * This doesn't write to localStorage but keeps UI in sync
                 */
                window.dispatchEvent(
                  new StorageEvent('storage', {
                    key: 'bolt_user_profile',
                    newValue: JSON.stringify({
                      ...JSON.parse(localStorage.getItem('bolt_user_profile') || '{}'),
                      notifications: checked,
                    }),
                  }),
                );
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Timezone */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-sm dark:shadow-none p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="i-ph:clock-fill w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-bolt-elements-textPrimary">{t('settings.timeSettings')}</span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:globe-fill w-4 h-4 text-bolt-elements-textSecondary" />
            <label className="block text-sm text-bolt-elements-textSecondary">{t('settings.timezone')}</label>
          </div>
          <select
            title={t('settings.timezone')}
            value={settings.timezone}
            onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
            className={classNames(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-[#FAFAFA] dark:bg-[#0A0A0A]',
              'border border-[#E5E5E5] dark:border-[#1A1A1A]',
              'text-bolt-elements-textPrimary',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
              'transition-all duration-200',
            )}
          >
            <option value={currentTimezone}>{currentTimezone}</option>
          </select>
        </div>
      </motion.div>

      {/* Simplified Keyboard Shortcuts */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-sm dark:shadow-none p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="i-ph:keyboard-fill w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-bolt-elements-textPrimary">{t('settings.keyboardShortcuts')}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAFA] dark:bg-[#1A1A1A]">
            <div className="flex flex-col">
              <span className="text-sm text-bolt-elements-textPrimary">{t('settings.toggleTheme')}</span>
              <span className="text-xs text-bolt-elements-textSecondary">{t('settings.toggleThemeDescription')}</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-bolt-elements-textSecondary bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A] rounded shadow-sm">
                {getModifierSymbol('meta')}
              </kbd>
              <kbd className="px-2 py-1 text-xs font-semibold text-bolt-elements-textSecondary bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A] rounded shadow-sm">
                D
              </kbd>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAFA] dark:bg-[#1A1A1A]">
            <div className="flex flex-col">
              <span className="text-sm text-bolt-elements-textPrimary">{t('settings.quickActions')}</span>
              <span className="text-xs text-bolt-elements-textSecondary">{t('settings.quickActionsDescription')}</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-bolt-elements-textSecondary bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A] rounded shadow-sm">
                {getModifierSymbol('alt')}
              </kbd>
              <kbd className="px-2 py-1 text-xs font-semibold text-bolt-elements-textSecondary bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A] rounded shadow-sm">
                {getModifierSymbol('shift')}
              </kbd>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
