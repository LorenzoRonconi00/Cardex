'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WishlistItemRow, { WishlistItem } from '@/components/WishlistItemRow';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function WishlistPage() {
  const [isClient, setIsClient] = useState(false);
  const queryClient = useQueryClient();
  const [removingItems, setRemovingItems] = useState<Record<string, boolean>>({});
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Set isClient to true once the component mounts on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Remove a single item from wishlist
  const { mutate: removeFromWishlist } = useMutation({
    mutationFn: async (id: string) => {
      console.log("CLIENT: Attempting to remove wishlist item with ID:", id);
      console.log("CLIENT: API URL being called:", `/api/wishlist/${id}`);

      // Imposta lo stato di rimozione per questo elemento
      setRemovingItems(prev => ({ ...prev, [id]: true }));

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
      } finally {
        // Rimuovi lo stato di rimozione per questo elemento
        setRemovingItems(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
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

  // Remove all items from wishlist
  const { mutate: removeAllFromWishlist } = useMutation({
    mutationFn: async () => {
      if (!wishlistItems || wishlistItems.length === 0) {
        return { message: 'No items to remove' };
      }

      setIsRemovingAll(true);

      try {
        // Usa l'endpoint dedicato per rimuovere tutte le carte dalla wishlist
        const response = await fetch('/api/wishlist/clear', {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("CLIENT: Error response data:", errorData);
          throw new Error(`Failed to remove all cards from wishlist: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error("CLIENT: Error removing all items:", error);
        throw error;
      } finally {
        // Non chiudiamo il modal qui - lo farà l'animazione
        setIsRemovingAll(false);
      }
    },
    onSuccess: (data) => {
      console.log("CLIENT: Successfully removed all wishlist items:", data);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      
      // Chiudi il modal dopo il successo (con un piccolo ritardo per permettere l'animazione)
      setTimeout(() => {
        setIsConfirmModalOpen(false);
      }, 300);
    },
    onError: (error) => {
      console.error("CLIENT: Error in removeAllFromWishlist mutation:", error);
      alert("Si è verificato un errore durante la rimozione delle carte. Riprova più tardi.");
    }
  });

  // Funzione per gestire il click sul pulsante "Rimuovi Tutto"
  const handleRemoveAllClick = () => {
    setIsConfirmModalOpen(true);
  };

  // Funzione per confermare la rimozione di tutte le carte
  const confirmRemoveAll = () => {
    removeAllFromWishlist();
  };

  // Ordina gli elementi della wishlist per prezzo (dal più basso al più alto)
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Wishlist</h1>
          
          {/* Pulsante "Rimuovi Tutto" - mostrato solo se ci sono elementi */}
          {sortedWishlistItems.length > 0 && (
            <button
              onClick={handleRemoveAllClick}
              disabled={isRemovingAll}
              className={`px-4 py-2 rounded-lg ${
                isRemovingAll 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 cursor-pointer'
              } text-white transition-colors flex items-center`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
              <span>Rimuovi Tutto</span>
            </button>
          )}
        </div>

        {isLoadingWishlist ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          </div>
        ) : !sortedWishlistItems.length ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center p-6 bg-[#1E2124] rounded-lg shadow-md">
              <h3 className="text-xl font-medium text-white mb-2">Nessuna carta nella wishlist</h3>
              <p className="mt-2 text-gray-400">
                Aggiungi delle carte alla tua wishlist dalle pagine delle espansioni.
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
              {sortedWishlistItems.map((item, index) => {
                // Determina l'ID univoco dell'elemento
                const itemId = item._id || item.id;
                // Verifica se questo elemento è in fase di rimozione
                const isRemoving = removingItems[itemId] || false;
                
                return (
                  <WishlistItemRow
                    key={`${itemId}-${index}`}
                    item={item}
                    isRemoving={isRemoving}
                    onRemove={() => {
                      removeFromWishlist(itemId);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Modal di conferma personalizzato con animazione */}
        <ConfirmationModal 
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={confirmRemoveAll}
          title="Rimuovi tutte le carte"
          message="Sei sicuro di voler rimuovere tutte le carte dalla tua wishlist? Questa azione non può essere annullata."
          confirmText="Rimuovi Tutto"
          cancelText="Annulla"
          isConfirming={isRemovingAll}
        />
      </div>
    </Layout>
  );
}