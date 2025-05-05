import { createContext } from 'react';

// Create a context to share the setShowAuthDialog function with child components
export interface RepositoryDialogContextType {
  setShowAuthDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

export const RepositoryDialogContext = createContext<RepositoryDialogContextType>({
  setShowAuthDialog: () => {},
});
