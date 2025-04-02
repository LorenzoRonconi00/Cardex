'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { Session } from 'next-auth';

interface TopHeaderProps {
  session: Session | null;
}

const TopHeader: React.FC<TopHeaderProps> = ({ session }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    <div className="bg-[#2C2F33] text-white py-4 px-4 md:px-6 flex justify-between items-center">
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-xl font-bold">CARDEX</h1>
      </div>

      {/* User profile section */}
      {session?.user && (
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 focus:outline-none"
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
            <div className="absolute right-0 mt-2 w-48 bg-[#36393F] rounded-md shadow-lg z-50 py-1">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#4E5D94] transition-colors"
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