'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Tab } from '@headlessui/react';
import { Card as CardType } from '@/lib/types';
import SearchFilter from '@/components/SearchFilter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WishlistCard from '@/components/WishlistCard';
import WishlistItemRow, { WishlistItem } from '@/components/WishlistItemRow';
import AddCardModal from '@/components/AddCardModal';
import { useDebounce } from '@/lib/hooks';

export default function WishlistPage() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce per evitare troppe richieste
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Set isClient to true once the component mounts on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch cards based on search term (global search)
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['cardSearch', debouncedSearchTerm],
    queryFn: async () => {
      // Costruisci l'URL con il parametro di ricerca se presente
      let url = `/api/cards/search?limit=30`;

      if (debouncedSearchTerm) {
        url += `&q=${encodeURIComponent(debouncedSearchTerm)}`;
      }

      console.log('Searching with URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search error:', errorText);
        throw new Error(`Failed to search cards: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log(`Received ${data.length} search results`);
      return data as CardType[];
    },
    // Abilitato sempre quando siamo nel tab "Aggiungi Carte"
    enabled: activeTab === 1,
    staleTime: 60000, // Mantieni i risultati freschi per 1 minuto
    retry: 2, // Riprova due volte in caso di errore
  });

  // Fetch wishlist items
  const { data: wishlistItems, isLoading: isLoadingWishlist } = useQuery<WishlistItem[]>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await fetch('/api/wishlist');
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      return response.json();
    },
  });

  // Add card to wishlist
  const { mutate: addToWishlist, isPending: isAddingToWishlist } = useMutation({
    mutationFn: async ({ card, price }: { card: CardType, price: number }) => {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card,
          price,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add card to wishlist');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      // Close modal
      setIsModalOpen(false);
      setSelectedCard(null);
    },
  });

  // Remove from wishlist
  const { mutate: removeFromWishlist } = useMutation({
    mutationFn: async (id: string) => {
      console.log("CLIENT: Attempting to remove wishlist item with ID:", id);
      console.log("CLIENT: API URL being called:", `/api/wishlist/${id}`);

      try {
        const response = await fetch(`/api/wishlist/${id}`, {
          method: 'DELETE',
        });

        console.log("CLIENT: Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("CLIENT: Error response data:", errorData);
          throw new Error(`Failed to remove card from wishlist: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error("CLIENT: Fetch error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("CLIENT: Successfully removed wishlist item:", data);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (error) => {
      console.error("CLIENT: Error in removeFromWishlist mutation:", error);
    }
  });

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle adding a card to wishlist
  const handleAddToWishlist = (card: CardType) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  // Filtra duplicati dai risultati di ricerca (sempre applicato, indipendentemente dai risultati)
  const filteredSearchResults = useMemo(() => {
    if (!searchResults) return [];

    const seenIds = new Set();
    return searchResults.filter(card => {
      if (seenIds.has(card.id)) {
        return false;
      }
      seenIds.add(card.id);
      return true;
    });
  }, [searchResults]);

  // Ordina gli elementi della wishlist per prezzo (dal più basso al più alto)
  // Questo hook è sempre chiamato, indipendentemente dal fatto che wishlistItems sia null o undefined
  const sortedWishlistItems = useMemo(() => {
    return wishlistItems ? [...wishlistItems].sort((a, b) => a.price - b.price) : [];
  }, [wishlistItems]);

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
        <h1 className="text-2xl font-bold text-white mb-6">Wishlist</h1>

        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="relative flex space-x-2 rounded-xl bg-[#1E2124] p-1 mb-6">
            {/* Indicatore scorrevole */}
            <div
              className="absolute z-10 top-1 bottom-1 rounded-lg bg-[#36393E] shadow-lg transition-all duration-300 ease-in-out"
              style={{
                left: activeTab === 0 ? '0.25rem' : '50%',
                right: activeTab === 0 ? '50%' : '0.25rem',
                transform: activeTab === 0 ? 'none' : 'translateX(-0.25rem)'
              }}
            ></div>

            <Tab
              className={({ selected }: { selected: boolean }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 z-20 transition-colors duration-300 cursor-pointer
                ${selected
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
                }`
              }
            >
              La mia Wishlist
            </Tab>
            <Tab
              className={({ selected }: { selected: boolean }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 z-20 transition-colors duration-300 cursor-pointer
                ${selected
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
                }`
              }
            >
              Aggiungi Carte
            </Tab>
          </Tab.List>

          <div className="relative">
            <Tab.Panels>
              {/* Tab pannello 1: La mia Wishlist */}
              <Tab.Panel
                className={`transform transition-all duration-300 ${activeTab === 0 ? 'translate-x-0 opacity-100' : 'absolute inset-0 -translate-x-full opacity-0'
                  }`}
              >
                {isLoadingWishlist ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  </div>
                ) : !sortedWishlistItems.length ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-center p-6 bg-[#1E2124] rounded-lg shadow-md">
                      <h3 className="text-xl font-medium text-white mb-2">Nessuna carta nella wishlist</h3>
                      <p className="text-gray-400">
                        Aggiungi delle carte alla tua wishlist usando il tab Aggiungi Carte.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto">
                    {/* Intestazione */}
                    <div className="flex justify-between items-center mb-4 bg-[#36393E] p-4 rounded-lg">
                      <div className="text-white font-medium">La tua Wishlist</div>
                      <div className="text-gray-300 text-sm">
                        {sortedWishlistItems.length} {sortedWishlistItems.length === 1 ? 'carta' : 'carte'} •
                        Totale: {sortedWishlistItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}€
                      </div>
                    </div>

                    {/* Lista carte */}
                    <div className="space-y-2">
                      {sortedWishlistItems.map((item, index) => (
                        <WishlistItemRow
                          key={`${item._id || item.id}-${index}`}
                          item={item}
                          onRemove={() => {
                            // Usa _id (MongoDB ID) se disponibile, altrimenti usa id
                            const itemId = item._id || item.id;
                            removeFromWishlist(itemId);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Tab.Panel>

              {/* Tab pannello 2: Aggiungi Carte */}
              <Tab.Panel
                className={`transform transition-all duration-300 ${activeTab === 1 ? 'translate-x-0 opacity-100' : 'absolute inset-0 translate-x-full opacity-0'
                  }`}
              >
                <div className="mb-16 w-full max-w-md mx-auto">
                  <SearchFilter onSearch={handleSearch} />
                  <p className="mt-4 text-sm text-gray-400">
                    Cerca tra tutte le carte Illustration Rare disponibili
                  </p>
                </div>

                {isLoadingSearch ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  </div>
                ) : !filteredSearchResults.length ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-center p-6 bg-[#1E2124] rounded-lg shadow-md">
                      <h3 className="text-xl font-medium text-white mb-2">
                        {searchTerm
                          ? `Nessun risultato per &quot;${searchTerm}&quot;`
                          : "Caricamento delle carte disponibili..."}
                      </h3>
                      <p className="text-gray-400">
                        {searchTerm
                          ? "Prova a cercare utilizzando un altro termine o controlla se la carta è già nella tua collezione o wishlist"
                          : isLoadingSearch
                            ? "Stiamo caricando le carte disponibili, attendere prego..."
                            : "Se non vedi carte, potrebbe esserci un problema con il database. Contatta l'amministratore."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-14">
                    {filteredSearchResults.map((card, index) => (
                      <WishlistCard
                        key={`${card.id}-${index}`}
                        card={card}
                        onAdd={() => handleAddToWishlist(card)}
                      />
                    ))}
                  </div>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </div>
        </Tab.Group>
      </div>

      {/* Modal per aggiungere carta alla wishlist */}
      {isModalOpen && selectedCard && (
        <AddCardModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(price) => addToWishlist({ card: selectedCard, price })}
          isLoading={isAddingToWishlist}
        />
      )}
    </Layout>
  );
}