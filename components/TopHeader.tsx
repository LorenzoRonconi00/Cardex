'use client';

import React, { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { Session } from 'next-auth';
import { useQuery } from '@tanstack/react-query';

interface TopHeaderProps {
  session: Session | null;
}

interface UserCardStats {
  totalCount: number;
  collectedCount: number;
  lastUpdated: string;
}

const TopHeader: React.FC<TopHeaderProps> = ({ session }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: sessionData } = useSession();

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

  return (
    <div className="bg-[#2C2F33] text-white py-4 px-4 md:px-6 flex justify-between items-center relative">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-bold">CARDEX</h1>
        
        {/* User-specific Card Counter */}
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