'use client';

import React, { useEffect, useState } from 'react';
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
      const url = `/api/cards/search?q=${encodeURIComponent(debouncedSearchTerm)}&limit=30`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to search cards');
      }
      return response.json() as Promise<CardType[]>;
    },
    enabled: activeTab === 1, // Solo quando siamo nel tab "Aggiungi Carte"
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

  // Ordina gli elementi della wishlist per prezzo (dal più basso al più alto)
  const sortedWishlistItems = React.useMemo(() => {
    if (!wishlistItems) return [];
    return [...wishlistItems].sort((a, b) => a.price - b.price);
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
                className={`transform transition-all duration-300 ${
                  activeTab === 0 ? 'translate-x-0 opacity-100' : 'absolute inset-0 -translate-x-full opacity-0'
                }`}
              >
                {isLoadingWishlist ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  </div>
                ) : !wishlistItems || wishlistItems.length === 0 ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-center p-6 bg-[#1E2124] rounded-lg shadow-md">
                      <h3 className="text-xl font-medium text-white mb-2">Nessuna carta nella wishlist</h3>
                      <p className="text-gray-400">
                        Aggiungi delle carte alla tua wishlist usando il tab "Aggiungi Carte".
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto">
                    {/* Intestazione */}
                    <div className="flex justify-between items-center mb-4 bg-[#36393E] p-4 rounded-lg">
                      <div className="text-white font-medium">La tua Wishlist</div>
                      <div className="text-gray-300 text-sm">
                        {wishlistItems.length} {wishlistItems.length === 1 ? 'carta' : 'carte'} •
                        Totale: {wishlistItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}€
                      </div>
                    </div>

                    {/* Lista carte */}
                    <div className="space-y-2">
                      {sortedWishlistItems.map((item) => (
                        <WishlistItemRow
                          key={item._id || item.id}
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
                className={`transform transition-all duration-300 ${
                  activeTab === 1 ? 'translate-x-0 opacity-100' : 'absolute inset-0 translate-x-full opacity-0'
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
                ) : !searchResults || searchResults.length === 0 ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-center p-6 bg-[#1E2124] rounded-lg shadow-md">
                      <h3 className="text-xl font-medium text-white mb-2">
                        {searchTerm
                          ? `Nessun risultato per "${searchTerm}"`
                          : "Utilizza la ricerca per trovare carte"}
                      </h3>
                      <p className="text-gray-400">
                        {searchTerm
                          ? "Prova a cercare utilizzando un altro termine o controlla se la carta è già nella tua collezione o wishlist"
                          : "Inserisci il nome di un Pokémon per trovare le sue carte Illustration Rare"
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-14">
                    {searchResults.map((card) => (
                      <WishlistCard
                        key={card.id}
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