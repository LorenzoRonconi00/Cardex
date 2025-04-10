'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import CardGrid from '@/components/CardGrid';
import CardCounter from '@/components/CardCounter';
import SearchFilter from '@/components/SearchFilter';
import ExpansionSelector from '@/components/ExpansionSelector';
import { Expansion } from '@/lib/types';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentExpansion, setCurrentExpansion] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  // fetch all expansions
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

      // set current expansion to the first one if not set
      if (data.length > 0 && !currentExpansion) {
        setCurrentExpansion(data[0].slug);
      }

      return data;
    },
    enabled: status === "authenticated", // Only fetch when authenticated
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleExpansionChange = (expansionSlug: string) => {
    setCurrentExpansion(expansionSlug);
  };

  // Loading state for authentication or client-side rendering
  if (status === "loading" || !isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E2124]">
        <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="px-6 py-6">
        {/* Welcome message */}
        {session?.user?.name && (
          <div className="mb-6">
            <h2 className="text-xl text-white">
              Benvenuto, <span className="font-semibold">{session.user.name}</span>!
            </h2>
            <p className="text-gray-400">Gestisci la tua collezione di carte Alt Art Pokémon</p>
          </div>
        )}

        {/* Filters */}
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
                Seleziona un&apos;espansione per visualizzare le carte
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}