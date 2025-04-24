// app/expansion/[slug]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import CardGrid from '@/components/CardGrid';
import CardCounter from '@/components/CardCounter';
import ExpansionSelector from '@/components/ExpansionSelector';
import { Expansion } from '@/lib/types';

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

  // Find the current expansion from the list
  const currentExpansion = expansions?.find(exp => exp.slug === slug);

  // Handle search callback from the header
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
        <div className="flex flex-col justify-end md:flex-row gap-6 mb-6 md:mb-10 lg:mb-16">
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

        {/* Mobile search - Only visible on mobile devices when on expansion pages */}
        <div className="mb-6 md:hidden">
          <div className="relative w-full">
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
              type="text"
              className="w-full h-14 pl-12 pr-10 text-md text-white border-4 border-[#1E2124] rounded-xl bg-[#36393E] placeholder-gray-400 focus:outline-none"
              placeholder="Cerca nell'espansione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'
              }}
            />
            {searchTerm.trim() !== '' && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setSearchTerm('')}
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
        ) : (
          <CardGrid expansion={slug} searchTerm={searchTerm} />
        )}
      </div>
    </Layout>
  );
}