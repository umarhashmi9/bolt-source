import { Fragment, useState, useRef, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { classNames } from '~/utils/classNames';

// Define supported languages
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return languages.find((lang) => lang.code === i18n.language) || languages[0];
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Listen for clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update current language display when language changes
  useEffect(() => {
    const lang = languages.find((lang) => lang.code === i18n.language);

    if (lang) {
      setCurrentLanguage(lang);
    }
  }, [i18n.language]);

  // Use debounced language switching to optimize localStorage operations
  const changeLanguage = (code: string) => {
    // Immediately change i18n language for better user experience
    i18n.changeLanguage(code);

    /*
     * No need to update localStorage here as SettingsTab component listens to i18n.language changes
     * and updates localStorage with debouncing to avoid repeated writes
     */

    /*
     * Only dispatch storage event to let other components immediately detect language changes
     * This doesn't write to localStorage, just keeps UI in sync
     */
    try {
      const existingProfile = JSON.parse(localStorage.getItem('bolt_user_profile') || '{}');
      const updatedProfile = {
        ...existingProfile,
        language: code,
      };

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'bolt_user_profile',
          newValue: JSON.stringify(updatedProfile),
        }),
      );
    } catch (error) {
      console.error('Error dispatching language change event:', error);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button
          className={classNames(
            'flex items-center gap-1 px-2 py-1 rounded hover:bg-bolt-background-hover dark:hover:bg-bolt-backgroundDark-hover transition-colors',
            'text-bolt-elements-textPrimary',
          )}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="hidden sm:inline-block text-sm">{currentLanguage.name}</span>
          <span className="i-ph:caret-down text-xs text-bolt-elements-textSecondary mt-0.5" />
        </Menu.Button>

        <Transition
          as={Fragment}
          show={isDropdownOpen}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items
            static
            className="z-50 absolute right-0 mt-2 origin-top-right rounded-md bg-white dark:bg-bolt-backgroundDark-tertiary shadow-lg border border-bolt-elements-borderColor"
          >
            <div className="p-1">
              {languages.map((lang) => (
                <Menu.Item key={lang.code}>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        changeLanguage(lang.code);
                        setIsDropdownOpen(false);
                      }}
                      className={classNames(
                        'flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md',
                        active || lang.code === i18n.language
                          ? 'bg-bolt-background-hover dark:bg-bolt-backgroundDark-hover text-bolt-elements-textPrimary'
                          : 'text-bolt-elements-textSecondary',
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                      {lang.code === i18n.language && <span className="ml-auto i-ph:check text-sm text-green-500" />}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}

// Default export for lazy loading
export default LanguageSelector;
