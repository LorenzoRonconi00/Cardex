// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import CardGrid from '@/components/CardGrid';
import CardCounter from '@/components/CardCounter';
import SearchFilter from '@/components/SearchFilter';
import ExpansionSelector from '@/components/ExpansionSelector';
import { Expansion } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentExpansion, setCurrentExpansion] = useState<string>('');

  // Set isClient to true once the component mounts on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch all expansions
  const { 
    data: expansions,
    isLoading: isLoadingExpansions
  } = useQuery({
    queryKey: ['expansions'],
    queryFn: async () => {
      const response = await fetch('/api/expansions');
      if (!response.ok) {
        throw new Error('Failed to fetch expansions');
      }
      const data = await response.json() as Expansion[];
      
      // Set current expansion to the first one if not set
      if (data.length > 0 && !currentExpansion) {
        setCurrentExpansion(data[0].slug);
      }
      
      return data;
    },
  });

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle expansion change
  const handleExpansionChange = (expansionSlug: string) => {
    setCurrentExpansion(expansionSlug);
  };

  // Initial loading state before client-side rendering
  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E2124]">
        <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="px-6 py-6">
        {/* Filters and controls row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <CardCounter expansion={currentExpansion} />
          <SearchFilter onSearch={handleSearch} />
          
          {/* Expansion Selector */}
          {isLoadingExpansions || !expansions ? (
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <ExpansionSelector 
              expansions={expansions} 
              currentExpansion={currentExpansion} 
              onChange={handleExpansionChange} 
            />
          )}
        </div>
        
        {/* Cards Grid */}
        {currentExpansion ? (
          <CardGrid expansion={currentExpansion} searchTerm={searchTerm} />
        ) : (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-medium text-white">Nessuna espansione selezionata</h3>
              <p className="mt-2 text-gray-400">
                Seleziona un'espansione per visualizzare le carte
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}