'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Expansion } from '@/lib/types';
import ExpansionDropdown from './ExpansionDropdown';
import { useQuery } from '@tanstack/react-query';

interface HeaderProps {
  currentExpansion?: string;
}

const Header: React.FC<HeaderProps> = ({ currentExpansion }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Fetch expansions
  const { data: expansions, isLoading, error } = useQuery<Expansion[]>({
    queryKey: ['expansions'],
    queryFn: async () => {
      const response = await fetch('/api/expansions');
      if (!response.ok) {
        throw new Error('Failed to fetch expansions');
      }
      const data = await response.json();
      console.log("Fetched expansions:", data);
      return data;
    },
  });

  const handleExpansionChange = (expansionSlug: string) => {
    router.push(`/expansion/${expansionSlug}`);
  };

  // Find current expansion details
  const currentExpansionData = expansions?.find(exp => exp.slug === currentExpansion);

  // Determine header class based on current expansion
  const headerClass = currentExpansion ? `header header-${currentExpansion}` : 'header';

  return (
    <header className={headerClass}>
      <div className="header-content">
        <div className="logo-container">
          <img src="/images/logo.png" alt="CARDEX Logo" className="site-logo" />
        </div>
        
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : error ? (
            <div className="text-white">Error loading expansions</div>
          ) : (
            <ExpansionDropdown 
              expansions={expansions || []} 
              currentExpansion={currentExpansion} 
              onChange={handleExpansionChange} 
            />
          )}
        </div>
      </div>

      {/* Expansion logo in center */}
      {currentExpansionData && currentExpansionData.logo && (
        <div className="w-full flex justify-center mt-2">
          <div className="h-12 w-32 relative">
            <Image
              src={currentExpansionData.logo}
              alt={currentExpansionData.name}
              fill
              className="object-contain expansion-logo"
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;