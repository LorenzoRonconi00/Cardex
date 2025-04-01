'use client';

import React, { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks';

interface SearchFilterProps {
  onSearch: (search: string) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Trigger the search when the debounced value changes
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  // Clear search handler
  const handleClearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  const isSearchActive = searchTerm.trim() !== '';

  return (
    <div className="relative w-full max-w-xs">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <svg 
          className="w-5 h-5 text-gray-400" 
          aria-hidden="true" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 20 20"
        >
          <path 
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
      </div>
      <input
        type="text" // Cambiato da "search" a "text" per evitare il pulsante X nativo
        className={`block w-full p-4 pl-12 ${isSearchActive ? 'pr-10' : ''} text-md text-white border-4 border-[#1E2124] rounded-2xl bg-[#36393E] placeholder-gray-400 focus:outline-none`}
        placeholder="Cerca Pokemon..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ 
          // Rimuove l'X nativa di Safari/Chrome se presente
          WebkitAppearance: 'none',
          // Supporto per Firefox
          MozAppearance: 'textfield',
          boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'
        }}
      />
      {isSearchActive && (
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          onClick={handleClearSearch}
        >
          <svg
            className="w-4 h-4 text-gray-400 hover:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchFilter;