'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Expansion } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface ExpansionSelectorProps {
  expansions: Expansion[];
  currentExpansion?: string;
  onChange: (expansion: string) => void;
}

interface ExpansionStats {
  [key: string]: {
    total: number;
    collected: number;
    percentage: number;
    name: string;
  }
}

const ExpansionSelector: React.FC<ExpansionSelectorProps> = ({
  expansions,
  currentExpansion,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  // Find current expansion details
  const current = expansions.find(exp => exp.slug === currentExpansion) || expansions[0];

  // Fetch stats for all expansions
  const { data: expansionStats, isLoading: isLoadingStats } = useQuery<ExpansionStats>({
    queryKey: ['expansionStats', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/cards/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch expansion stats');
      }
      return response.json();
    },
    enabled: status === 'authenticated',
    staleTime: 60000, // 1 minute
  });

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (expansionStats) {
      console.log("Expansion stats loaded:", expansionStats);
      console.log("Current expansion:", currentExpansion);
      console.log("Current stats:", getCurrentStats());
    }
  }, [expansionStats, currentExpansion]);

  const handleSelect = (slug: string) => {
    onChange(slug);
    setIsOpen(false);
  };

  // Handler per prevenire lo scroll della pagina quando si scrolla nel dropdown
  const handleDropdownWheel = (e: WheelEvent) => {
    if (dropdownListRef.current) {
      // Calcola se lo scroll può avvenire all'interno del dropdown
      const { scrollTop, scrollHeight, clientHeight } = dropdownListRef.current;
      
      // Scroll verso il basso
      if (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight) {
        e.preventDefault();
      }
      // Scroll verso l'alto
      else if (e.deltaY < 0 && scrollTop <= 0) {
        e.preventDefault();
      }
      // Altrimenti permetti lo scroll all'interno del dropdown
      else {
        e.preventDefault();
        dropdownListRef.current.scrollTop += e.deltaY;
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Aggiungi event listener per wheel event quando il dropdown è aperto
  useEffect(() => {
    const currentDropdownList = dropdownListRef.current;
    
    if (isOpen && currentDropdownList) {
      currentDropdownList.addEventListener('wheel', handleDropdownWheel, { passive: false });
    }
    
    return () => {
      if (currentDropdownList) {
        currentDropdownList.removeEventListener('wheel', handleDropdownWheel);
      }
    };
  }, [isOpen]);

  // Get the collection stats for the current expansion
  const getCurrentStats = () => {
    if (!expansionStats || !current) return { total: 0, collected: 0, percentage: 0 };
    return expansionStats[current.slug] || { total: 0, collected: 0, percentage: 0 };
  };

  const currentStats = getCurrentStats();

  return (
    <div ref={dropdownRef} className="relative w-full" style={{ zIndex: 15 }}>
      <button
        onClick={toggleDropdown}
        className="w-full h-16 flex flex-col items-center justify-center rounded-xl px-4 cursor-pointer border-4 border-[#1E2124] text-white transition-all duration-200 ease-in-out hover:bg-[#2F3136] bg-[#36393E]"
        style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}
      >
        <div className="w-full flex items-center justify-between">
          {current?.logo ? (
            <div className="h-10 w-40 relative mx-auto">
              <Image
                src={current.logo}
                alt={current.name}
                fill
                sizes="160px"
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <span className="text-white mx-auto">Seleziona Espansione</span>
          )}
          <svg
            className={`h-5 w-5 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        
        {/* Collection progress bar - only visible for authenticated users */}
        {status === 'authenticated' && currentStats.total > 0 && (
          <div className="w-full mt-1 h-1.5 bg-[#1E2124] rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300 ease-out"
              style={{ width: `${currentStats.percentage}%` }}
            />
          </div>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 w-full mt-2 rounded-md shadow-lg focus:outline-none bg-[#1E2124]" 
          style={{ zIndex: 50 }}
        >
          <div 
            ref={dropdownListRef}
            className="max-h-80 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            style={{ scrollbarWidth: 'thin' }}
          >
            {expansions.map((expansion) => {
              // Get stats for this expansion
              const stats = expansionStats?.[expansion.slug] || { total: 0, collected: 0, percentage: 0 };
              
              return (
                <button
                  key={expansion.slug}
                  className={`w-full px-4 py-3 text-sm text-left flex flex-col items-center justify-center ${
                    expansion.slug === currentExpansion ? 'bg-[#36393E]' : 'hover:bg-[#36393E]'
                  }`}
                  onClick={() => handleSelect(expansion.slug)}
                >
                  {expansion.logo && (
                    <div className="h-14 w-48 relative cursor-pointer">
                      <Image
                        src={expansion.logo}
                        alt={expansion.name}
                        fill
                        sizes="192px"
                        className="object-contain"
                      />
                    </div>
                  )}
                  
                  {/* Collection progress bar */}
                  {status === 'authenticated' && (
                    <div className="w-full mt-2 flex items-center">
                      {isLoadingStats ? (
                        <div className="w-full h-1.5 bg-[#2a2d31] rounded-full animate-pulse"></div>
                      ) : stats.total > 0 ? (
                        <>
                          <div className="w-full h-1.5 bg-[#2a2d31] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all duration-300 ease-out"
                              style={{ width: `${stats.percentage}%` }}
                            />
                          </div>
                          <span className="ml-2 text-xs text-gray-400 whitespace-nowrap">
                            {stats.collected}/{stats.total}
                          </span>
                        </>
                      ) : (
                        <div className="w-full h-1.5 bg-[#2a2d31] rounded-full"></div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpansionSelector;