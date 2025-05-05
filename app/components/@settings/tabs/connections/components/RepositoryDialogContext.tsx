import { createContext } from 'react';

// Create a context to share the setShowAuthDialog function with child components
export interface RepositoryDialogContextType {
  setShowAuthDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

// Default context value with a no-op function
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const RepositoryDialogContext = createContext<RepositoryDialogContextType>({
  setShowAuthDialog: () => {},
});
