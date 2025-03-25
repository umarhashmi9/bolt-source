import React, { useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';

interface WebSearchBarProps {
  onSearch?: (query: string) => void;
  isSearching?: boolean;
  handleInputChange?: (query: string) => void;
}

export const WebSearchBar: React.FC<WebSearchBarProps> = ({ onSearch, isSearching = false, handleInputChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim()) {
      if (handleInputChange) {
        // Format the query as a @search command and update the input field
        handleInputChange(`@search ${query.trim()}`);
      } else if (onSearch) {
        // Fallback to original behavior if handleInputChange is not provided
        onSearch(query.trim());
      }

      setQuery('');
      setIsExpanded(false);
    }
  };

  return (
    <div className="relative">
      <IconButton
        title={isExpanded ? 'Close search' : 'Web search'}
        className="text-bolt-elements-textSecondary hover:text-bolt-elements-text transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={isSearching ? 'i-svg-spinners:90-ring-with-bg animate-spin' : 'i-ph:magnifying-glass'} />
      </IconButton>

      {isExpanded && (
        <form
          onSubmit={handleSearch}
          className="absolute left-0 bottom-full mb-2 flex items-center bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md overflow-hidden shadow-md"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the web..."
            className="px-3 py-2 bg-transparent outline-none w-64 text-sm"
            autoFocus
          />
          <IconButton
            title="Search"
            className="text-bolt-elements-textSecondary hover:text-bolt-elements-text mx-1"
            disabled={isSearching || !query.trim()}
            onClick={handleSearch}
          >
            <div className={isSearching ? 'i-svg-spinners:90-ring-with-bg animate-spin' : 'i-ph:arrow-right'} />
          </IconButton>
        </form>
      )}
    </div>
  );
};
