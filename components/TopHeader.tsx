'use client';

import React, { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { Session } from 'next-auth';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks';
import { usePathname } from 'next/navigation';

interface TopHeaderProps {
  session: Session | null;
  onSearch?: (searchTerm: string) => void;
}

interface UserCardStats {
  totalCount: number;
  collectedCount: number;
  lastUpdated: string;
}

const TopHeader: React.FC<TopHeaderProps> = ({ session, onSearch }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: sessionData } = useSession();
  const pathname = usePathname();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Determine if we're on an expansion page to enable search
  const isOnExpansionPage = pathname?.includes('/expansion/');

  // Fetch user-specific card stats
  const { data: userStats, isLoading: isLoadingStats } = useQuery<UserCardStats>({
    queryKey: ['userCardStats', sessionData?.user?.id],
    queryFn: async () => {
      // Assicurati che l'endpoint includa l'ID utente nei parametri di query
      const userId = sessionData?.user?.id;
      const response = await fetch(`/api/users/${userId}/cards/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch user card statistics');
      }
      return await response.json();
    },
    enabled: !!sessionData?.user?.id, // Solo se l'utente è autenticato
    // Aggiorna i dati ogni 5 minuti
    refetchInterval: 5 * 60 * 1000,
    // Riutilizza la cache per 1 minuto
    staleTime: 60 * 1000,
  });

  // Update search results when debounced search term changes
  useEffect(() => {
    if (onSearch && isOnExpansionPage) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch, isOnExpansionPage]);

  // Chiudi il menu utente quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch && isOnExpansionPage) {
      onSearch('');
    }
  };

  return (
    <div className="bg-[#2C2F33] text-white py-4 px-4 md:px-6 flex justify-between items-center relative">
      {/* Menu icon spacing on mobile */}
      <div className="w-8 md:hidden"></div>
      
      <div className="flex items-center space-x-6">
        
        {/* User-specific Card Counter - only on desktop */}
        {sessionData?.user?.id && (
          <div className="hidden md:flex items-center space-x-2">
            <div className="bg-[#36393E] border-2 border-[#1E2124] rounded-lg px-3 py-1 text-sm">
              {isLoadingStats ? (
                <span className="animate-pulse">Caricamento...</span>
              ) : (
                <span>
                  {userStats?.collectedCount || 0}/{userStats?.totalCount || 0} carte
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search filter in the middle (only show on expansion pages) */}
      {isOnExpansionPage && (
        <div className="flex-1 mx-2 md:mx-4 max-w-[200px] md:max-w-md">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg 
                className="w-4 h-4 text-gray-400" 
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
              type="text"
              className="w-full h-8 md:h-10 pl-8 pr-8 md:pl-10 md:pr-10 text-xs md:text-sm text-white border-2 border-[#1E2124] rounded-lg bg-[#36393E] placeholder-gray-400 focus:outline-none"
              placeholder="Cerca tutte le carte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                boxShadow: '0 8px 10px -3px rgba(0, 0, 0, 0.3)'
              }}
            />
            {searchTerm.trim() !== '' && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-2 md:pr-3"
                onClick={handleClearSearch}
              >
                <svg
                  className="w-3 h-3 md:w-4 md:h-4 text-gray-400 hover:text-white"
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
        </div>
      )}

      {/* User profile section */}
      {session?.user && (
        <div className="relative" ref={userMenuRef} style={{ position: 'static' }}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 focus:outline-none cursor-pointer"
          >
            {session.user.image ? (
              <div className="w-8 h-8 rounded-full overflow-hidden relative">
                <Image
                  src={session.user.image}
                  alt={session.user.name || "Utente"}
                  width={32}
                  height={32}
                  className="object-cover"
                  // Fallback in caso di errore di caricamento dell'immagine
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/default-avatar.png'; // Assicurati di avere un'immagine di fallback
                  }}
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {session.user.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <span className="hidden md:inline text-sm truncate max-w-[150px]">
              {session.user.name}
            </span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {/* Dropdown menu */}
          {isUserMenuOpen && (
            <div className="fixed right-4 mt-2 w-48 bg-[#36393F] rounded-md shadow-lg py-1" style={{zIndex: 9999}}>
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#4E5D94] transition-colors cursor-pointer"
              >
                Disconnetti
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopHeader;