interface Window {
  electronI18n?: {
    /**
     * Get system locale settings
     */
    getSystemLocale: () => Promise<string>;

    /**
     * Set language
     * @param language language code
     */
    setLanguage: (language: string) => Promise<boolean>;

    /**
     * Get stored language settings
     */
    getLanguage: () => Promise<string | undefined>;
  };

  ipc?: {
    /**
     * Invoke main process method
     */
    invoke: (...args: any[]) => Promise<any>;

    /**
     * Listen to main process events
     */
    on: (channel: string, func: Function) => () => void;
  };
}
