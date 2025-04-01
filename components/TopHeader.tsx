'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

const TopHeader: React.FC = () => {
  // Fetch card stats (total and collected)
  const { data: cardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['cardStats'],
    queryFn: async () => {
      const response = await fetch('/api/cards/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch card stats');
      }
      return await response.json();
    },
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return (
    <header className="h-16 sm:h-18 bg-[#1E2124] flex items-center justify-between px-4 sm:px-8 shadow-md">
      <div className="flex items-center space-x-4 sm:space-x-12">
        {/* CARDEX logo - con padding a sinistra su mobile per fare spazio all'icona menu */}
        <h1 className="text-white text-xl sm:text-2xl font-extrabold tracking-widest pl-8 md:pl-0">CARDEX</h1>

        {/* Card counter stats - hidden on mobile */}
        {isLoadingStats ? (
          <div className="hidden sm:block bg-[#36393E] text-white rounded-lg px-5 py-1 animate-pulse shadow-2xl">
            Caricamento...
          </div>
        ) : cardStats ? (
          <div className="hidden sm:flex bg-[#36393E] text-white rounded-2xl px-5 py-1 items-center space-x-1 shadow-2xl">
            <div className='flex flex-col items-start justify-start'>
              <div>
                <span className="font-bold text-sm">{cardStats.collectedCount}</span>
                <span className="opacity-70 text-sm"> / </span>
                <span className='text-sm font-bold'>{cardStats.totalCount}</span>
              </div>
              <span className="text-xs opacity-70">Illustration Rare</span>
            </div>
            
            <div className="ml-2 text-yellow-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          </div>
        ) : null}
      </div>

      {/* User profile */}
      <div className="flex items-center space-x-2">
        <span className="text-white text-sm sm:text-md">Frank</span>
        <Image
          src="/images/profile.svg"
          alt="Profile"
          width={36}
          height={36}
          className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
        />
      </div>
    </header>
  );
};

export default TopHeader;