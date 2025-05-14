'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/lib/types';
import { formatPokemonName } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PokemonCardProps {
  card: Card;
  onToggleCollected: (id: string, isCollected: boolean) => void;
  onAddToWishlist?: () => void; // Aggiunta questa proprietà opzionale
  isInWishlist?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ 
  card, 
  onToggleCollected,
  // onAddToWishlist, // Commentato per evitare modifiche alla logica esistente
  isInWishlist = false
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();

  const handleClick = () => {
    onToggleCollected(card.id, !card.isCollected);
  };

  const handleAddToWishlist = async () => {
    // Se la carta è già nella wishlist, non facciamo nulla
    if (isInWishlist) {
      toast.error("Questa carta è già nella tua wishlist");
      return;
    }
    
    try {
      setIsSearching(true);
      toast.loading('Ricerca su CardTrader...', { id: 'cardtrader-search' });

      // Chiamata all'API per cercare la carta su CardTrader
      const response = await fetch('/api/cardtrader/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(card),
      });

      if (!response.ok) {
        throw new Error('Errore nella ricerca della carta');
      }

      const data = await response.json();
      let price = 0;
      
      if (data.bestPrice) {
        // Formatta il prezzo in modo leggibile
        price = parseFloat((data.bestPrice.price.cents / 100).toFixed(2));
        const currency = data.bestPrice.price.currency;
        const condition = data.bestPrice.properties_hash.condition || 'Near Mint';
        
        // Log nel browser console per debug lato client
        console.log('Carta trovata su CardTrader:');
        console.log(`Nome: ${data.bestPrice.name_en}`);
        console.log(`Prezzo: ${price} ${currency}`);
        console.log(`Condizione: ${condition}`);
        console.log(`Espansione: ${data.bestPrice.expansion.name_en}`);
        
        toast.success(
          <div>
            <p className="font-bold">Miglior prezzo su CardTrader</p>
            <p>Prezzo: {price} {currency}</p>
            <p>Condizione: {condition}</p>
            <p className="text-xs mt-1">Su {data.totalNearMintHub} carte disponibili</p>
          </div>, 
          { 
            id: 'cardtrader-search',
            duration: 2000
          }
        );
      } else {
        toast.error(
          <div>
            <p className="font-bold">Nessuna carta trovata su CardTrader</p>
            <p className="text-xs mt-1">La carta sarà comunque aggiunta alla wishlist</p>
          </div>, 
          { 
            id: 'cardtrader-search',
            duration: 2000
          }
        );
      }
      
      // Ora procediamo con l'aggiunta alla wishlist con il prezzo trovato
      setIsAdding(true);
      
      const addResponse = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card: card,
          price: price
        }),
      });
      
      const addData = await addResponse.json();
      
      if (!addResponse.ok) {
        if (addResponse.status === 409) {
          // Carta già nella wishlist
          toast.error("Questa carta è già nella tua wishlist", { 
            id: 'wishlist-add',
            duration: 3000
          });
        } else {
          throw new Error(`Errore nell'aggiunta alla wishlist: ${addData.error || 'Errore sconosciuto'}`);
        }
      } else {
        // Invalidare la query della wishlist per aggiornare l'UI
        queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        
        toast.success(
          <div>
            <p className="font-bold">Aggiunto alla wishlist</p>
            <p className="text-sm">{formatPokemonName(card.name)}</p>
            {price > 0 && <p className="text-sm">Prezzo: {price}€</p>}
          </div>, 
          { 
            id: 'wishlist-add',
            duration: 3000
          }
        );
      }
      
    } catch (error) {
      console.error('Errore durante l\'operazione:', error);
      toast.error(
        <div>
          <p className="font-bold">Errore</p>
          <p className="text-sm">Si è verificato un errore durante l&apos;aggiunta alla wishlist</p>
        </div>, 
        { 
          id: 'wishlist-add',
          duration: 3000
        }
      );
    } finally {
      setIsSearching(false);
      setIsAdding(false);
    }
  };

  // Determina se il bottone è in stato di caricamento
  const isLoading = isSearching || isAdding;

  return (
    <div className="flex flex-col items-center">
      {/* Card container with background - effetto hover più contenuto */}
      <div
        className="cursor-pointer relative rounded-xl overflow-visible bg-[#1E2124] w-full shadow-xl transition-transform duration-200 hover:scale-103"
        onClick={handleClick}
        style={{
          aspectRatio: '2.5/3.8',
          boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Checkbox in top left */}
        <div
          className="absolute -top-2.5 -left-2.5 z-10 w-10 h-10 rounded-md bg-[#36393E] border border-gray-700 flex items-center justify-center shadow-md hover:bg-[#41454C] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollected(card.id, !card.isCollected);
          }}
        >
          {card.isCollected && (
            <Image
              src="/images/check.svg"
              alt="Collected"
              width={16}
              height={16}
              className="w-6 h-6 object-contain"
              priority
            />
          )}
        </div>

        {/* Wishlist button in top right (heart icon) */}
        <div
          className="absolute -top-2.5 -right-2.5 z-10 w-10 h-10 rounded-md bg-[#36393E] border border-gray-700 flex items-center justify-center shadow-md hover:bg-[#4a4e57] transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleAddToWishlist();
          }}
        >
          {isLoading ? (
            // Spinner quando sta caricando
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 ${isInWishlist ? 'text-yellow-400' : 'text-white'}`}
              fill={isInWishlist ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </div>

        {/* The actual card image with padding */}
        <div className="w-full h-[90%] flex items-center justify-center p-3 pt-4">
          <div className="relative w-full h-full">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={`transition-all duration-300 ease-in-out rounded-lg ${card.isCollected ? '' : 'grayscale'}`}
              style={{ objectFit: 'contain' }}
              loading="lazy"
            />
          </div>
        </div>

        {/* Card name - now inside the container at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[10%] flex items-center justify-center">
          <h3 className="font-medium text-white text-sm px-2 truncate w-full text-center">
            {formatPokemonName(card.name)}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default PokemonCard;