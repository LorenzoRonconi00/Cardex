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
  searchResults?: Card[]; // Risultati di ricerca globale
  isGlobalSearch?: boolean; // Flag per indicare se è attiva la ricerca globale
}

const CardGrid: React.FC<CardGridProps> = ({ 
  expansion, 
  searchTerm = '', 
  searchResults, 
  isGlobalSearch = false 
}) => {
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
    enabled: status === 'authenticated' && !isGlobalSearch, // Solo se autenticato e non in modalità ricerca globale
  });

  // Mutation for updating selected cards
  const { mutate: updateCards, isPending: isSaving } = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      // Prepare complete card data for API
      const cardsToSave = Object.entries(updates).map(([id, isCollected]) => {
        // Determina quali dati usare: risultati di ricerca globale o carte dell'espansione
        const cardList = searchResults || cards || [];
        const originalCard = cardList.find(card => card.id === id);
        
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
      queryClient.invalidateQueries({
        queryKey: ['cardSearch']
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
      
      // Usa la fonte di dati appropriata in base alla modalità attuale
      const cardList = searchResults || cards || [];
      const originalCard = cardList.find(card => card.id === id);
      
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

  // Decide which cards to display: search results or normal expansion cards
  const displayCards = React.useMemo(() => {
    // Se siamo in modalità ricerca globale, usa i risultati di ricerca
    if (isGlobalSearch && searchResults) {
      // Applica le modifiche locali ai risultati di ricerca
      return searchResults.map((card) => ({
        ...card,
        isCollected: cardsToUpdate.hasOwnProperty(card.id)
          ? cardsToUpdate[card.id]
          : card.isCollected,
      }));
    }

    // Altrimenti usa le carte dell'espansione corrente
    if (!cards) return [];

    // Apply local changes
    const updatedCards = cards.map((card) => ({
      ...card,
      isCollected: cardsToUpdate.hasOwnProperty(card.id)
        ? cardsToUpdate[card.id]
        : card.isCollected,
    }));
    
    // Filter by search term if it exists (ricerca locale nell'espansione)
    if (!searchTerm || searchTerm.trim() === '') {
      return updatedCards;
    }
    
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    return updatedCards.filter(card => 
      card.name.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [cards, searchResults, cardsToUpdate, searchTerm, isGlobalSearch]);

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

  // Loading state - solo quando non siamo in modalità ricerca globale
  if (isLoading && !isGlobalSearch) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  // Error state - solo quando non siamo in modalità ricerca globale
  if (error && !isGlobalSearch) {
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
  if (displayCards.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-white">
            {isGlobalSearch 
              ? "Nessuna carta trovata"
              : "Nessuna Illustration Rare disponibile"}
          </h3>
          <p className="mt-2 text-gray-400">
            {isGlobalSearch 
              ? "Prova a cercare con un altro termine"
              : "Questa espansione non sembra avere Illustration Rare"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-14 pb-6 px-md:px-12 lg:px-16 2xl:px-20">
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