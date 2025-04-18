'use client';

import React, { useState } from 'react';
import { Card } from '@/lib/types';
import PokemonCard from './PokemonCard';
import SaveButton from './SaveButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface CardGridProps {
  expansion: string;
  searchTerm?: string;
}

const CardGrid: React.FC<CardGridProps> = ({ expansion, searchTerm = '' }) => {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [cardsToUpdate, setCardsToUpdate] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch cards for the expansion directly from DB (optimized)
  const { data: cards, isLoading, error } = useQuery<Card[]>({
    queryKey: ['expansion-cards', expansion, session?.user?.id],
    queryFn: async () => {
      // Direct DB query instead of API call
      const response = await fetch(`/api/cards/direct/${expansion}?t=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes for better performance
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Prevent excessive refetching
    enabled: status === 'authenticated', // Only fetch if authenticated
  });

  // Mutation for updating selected cards
  const { mutate: updateCards, isPending: isSaving } = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      // Prepare complete card data for API
      const cardsToSave = Object.entries(updates).map(([id, isCollected]) => {
        const originalCard = cards?.find(card => card.id === id);
        
        if (!originalCard) {
          console.error(`Card with id ${id} not found in cards data`);
          return { id, isCollected };
        }
        
        return {
          id,
          isCollected,
          name: originalCard.name,
          imageUrl: originalCard.imageUrl,
          expansion: originalCard.expansion
        };
      });
      
      console.log("Sending card data:", cardsToSave);
      
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardsToSave)
      });

      if (!response.ok) {
        throw new Error('Failed to update cards');
      }

      return response.json();
    },
    onSuccess: async () => {
      console.log("Save successful, updating UI with new data");
      
      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({ 
        queryKey: ['expansion-cards', expansion, session?.user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['cardStats', session?.user?.id] 
      });
      
      setCardsToUpdate({});
      setHasChanges(false);
    },
    onError: (error) => {
      console.error("Error saving cards:", error);
      alert("Impossibile salvare le modifiche. Riprova più tardi.");
    }
  });

  // Handle toggling a card's collected status
  const handleToggleCollected = (id: string, isCollected: boolean) => {
    console.log(`Toggling card ${id} to ${isCollected ? 'collected' : 'uncollected'}`);
    
    setCardsToUpdate((prev) => {
      const updated = { ...prev };
      updated[id] = isCollected;
      
      const originalCards = cards || [];
      const originalCard = originalCards.find(card => card.id === id);
      
      // If toggling back to original state, remove from updates
      if (originalCard && originalCard.isCollected === isCollected) {
        delete updated[id];
        console.log(`Card ${id} returned to original state, removing from updates`);
      }
      
      const hasChangesToSave = Object.keys(updated).length > 0;
      
      if (hasChanges !== hasChangesToSave) {
        setHasChanges(hasChangesToSave);
        
        console.log(hasChangesToSave 
          ? `Changes detected: ${Object.keys(updated).length} cards modified` 
          : "No changes, save button should disappear");
      }
        
      return updated;
    });
  };

  // Save changes
  const handleSave = () => {
    console.log("Save button clicked", cardsToUpdate);
    
    if (Object.keys(cardsToUpdate).length > 0) {
      updateCards(cardsToUpdate);
    }
  };

  // Filter and update local card state with toggle and search
  const displayCards = React.useMemo(() => {
    if (!cards) return [];

    // Apply local changes
    const updatedCards = cards.map((card) => ({
      ...card,
      isCollected: cardsToUpdate.hasOwnProperty(card.id)
        ? cardsToUpdate[card.id]
        : card.isCollected,
    }));
    
    // Filter by search term if it exists
    if (!searchTerm || searchTerm.trim() === '') {
      return updatedCards;
    }
    
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    return updatedCards.filter(card => 
      card.name.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [cards, cardsToUpdate, searchTerm]);

  // Authentication check loading state
  if (status === 'loading') {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        <span className="ml-3 text-white">Verifica autenticazione...</span>
      </div>
    );
  }

  // Unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-white">Accesso richiesto</h3>
          <p className="mt-2 text-gray-400">
            Devi accedere per visualizzare la tua collezione
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-red-500">Errore nel caricamento delle carte.</h3>
          <p className="mt-2 text-gray-400">Perfavore riprova più tardi.</p>
        </div>
      </div>
    );
  }

  // No cards state
  if (!cards || cards.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-white">Nessuna Illustration Rare disponibile</h3>
          <p className="mt-2 text-gray-400">
            Questa espansione non sembra avere Illustration Rare
          </p>
        </div>
      </div>
    );
  }
  
  // No search results state
  if (displayCards.length === 0 && searchTerm) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-white">Nessun risultato per &quot;{searchTerm}&quot;</h3>
          <p className="mt-2 text-gray-400">
            Prova a cercare un altro Pokémon in questa espansione
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-8 p-2 md:p-4 md:px-8 lg:px-16 xl:px-28">
        {displayCards.map((card) => (
          <PokemonCard
            key={card.id}
            card={card}
            onToggleCollected={handleToggleCollected}
          />
        ))}
      </div>

      {hasChanges && (
        <SaveButton onSave={handleSave} isSaving={isSaving} />
      )}
    </>
  );
};

export default CardGrid;