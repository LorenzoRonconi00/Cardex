// app/expansion/[slug]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import CardGrid from '@/components/CardGrid';
import CardCounter from '@/components/CardCounter';
import ExpansionSelector from '@/components/ExpansionSelector';
import { Card, Expansion } from '@/lib/types';

export default function ExpansionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      return await response.json() as Expansion[];
    },
  });

  // Fetch all cards based on search term (global search across ALL expansions)
  const {
    data: searchResults,
    isLoading: isLoadingSearch
  } = useQuery<Card[]>({
    queryKey: ['cardSearch', searchTerm],
    queryFn: async () => {
      // Se non c'è un termine di ricerca, restituisci un array vuoto
      if (!searchTerm) {
        return [];
      }

      // Costruisci l'URL con il parametro di ricerca - SENZA il filtro per espansione
      let url = `/api/cards/search?limit=100`;

      if (searchTerm) {
        url += `&q=${encodeURIComponent(searchTerm)}`;
      }

      // NON aggiungiamo il filtro per espansione per avere una ricerca globale
      console.log('Searching with URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search error:', errorText);
        throw new Error(`Failed to search cards: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log(`Received ${data.length} search results`);
      return data as Card[];
    },
    enabled: !!searchTerm && searchTerm.length >= 2, // Abilita la query solo quando c'è un termine di ricerca di almeno 2 caratteri
    staleTime: 1000 * 60 * 5, // Cache per 5 minuti
  });

  // Find the current expansion from the list
  const currentExpansion = expansions?.find(exp => exp.slug === slug);

  // Handle search from header
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle expansion change
  const handleExpansionChange = (expansionSlug: string) => {
    router.push(`/expansion/${expansionSlug}`);
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
    <Layout onSearch={handleSearch}>
      <div className="px-2 sm:px-4 md:px-8 lg:px-12 py-2">
        {/* Filters and controls row - flex with flex-grow-0 for fixed widths */}
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-6 md:mb-10 lg:mb-16">
          {/* CardCounter - fixed width */}
          <div className="flex-grow-0 md:w-64 lg:w-80">
            <CardCounter expansion={slug} />
          </div>

          {/* Expansion Selector - fixed width */}
          <div className="flex-grow-0 md:w-64 lg:w-80">
            {isLoadingExpansions || !expansions ? (
              <div className="h-16 flex items-center justify-center bg-[#36393E] text-white border-4 border-[#1E2124] px-4 rounded-xl" style={{ boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)' }}>
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              </div>
            ) : (
              <ExpansionSelector
                expansions={expansions}
                currentExpansion={slug}
                onChange={handleExpansionChange}
              />
            )}
          </div>
        </div>

        {/* Cards Grid */}
        {isLoadingExpansions || !expansions ? (
          <div className="flex h-96 items-center justify-center">
            <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          </div>
        ) : !currentExpansion ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center bg-[#1E2124] p-4 sm:p-6 rounded-lg shadow-lg border border-gray-700">
              <h3 className="text-lg sm:text-xl font-medium text-white">Espansione non trovata</h3>
              <p className="mt-2 text-sm sm:text-base text-white">
                Espansione non trovata. Controlla il tuo URL o prova a selezionare un&apos;altra espansione.
              </p>
              {expansions.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {expansions.slice(0, 4).map(exp => (
                    <button
                      key={exp.slug}
                      className="bg-[#36393E] hover:bg-[#41454C] text-white py-2 px-3 rounded-md text-sm transition-colors"
                      onClick={() => handleExpansionChange(exp.slug)}
                    >
                      {exp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : searchTerm && searchTerm.length >= 2 ? (
          // Se c'è un termine di ricerca, mostra i risultati della ricerca
          isLoadingSearch ? (
            <div className="flex h-96 items-center justify-center">
              <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              <span className="ml-3 text-white">Ricerca in corso...</span>
            </div>
          ) : !searchResults || searchResults.length === 0 ? (
            <div className="flex h-96 items-center justify-center">
              <div className="text-center p-6 bg-[#1E2124] rounded-lg shadow-md">
                <h3 className="text-xl font-medium text-white mb-2">Nessun risultato per &quot;{searchTerm}&quot;</h3>
                <p className="mt-2 text-gray-400">
                  Prova a cercare un altro Pokémon
                </p>
              </div>
            </div>
          ) : (
            <CardGrid 
              expansion={slug} 
              searchResults={searchResults} 
              isGlobalSearch={true} 
            />
          )
        ) : (
          // Altrimenti mostra la griglia normale
          <CardGrid expansion={slug} searchTerm={searchTerm} />
        )}
      </div>
    </Layout>
  );
}