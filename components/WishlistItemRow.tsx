// components/WishlistItemRow.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { formatPokemonName } from '@/lib/utils';
import { Card } from '@/lib/types';

export interface WishlistItem {
  _id?: string;  // MongoDB aggiunge questo campo
  id: string;    // Il nostro campo ID
  card: Card;
  price: number;
  dateAdded: string;
}

interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: () => void;
}

const WishlistItemRow: React.FC<WishlistItemCardProps> = ({ item, onRemove }) => {
  
  return (
    <div className="sm:flex items-center bg-[#1E2124] rounded-lg p-3 mb-3 shadow-md hover:bg-[#242729] transition-colors relative">
      {/* Bottone rimozione per mobile (in alto a destra) */}
      <button 
        onClick={onRemove}
        className="absolute top-2 right-2 sm:static w-8 h-8 sm:w-10 sm:h-10 bg-[#36393E] rounded-full flex items-center justify-center flex-shrink-0 hover:bg-red-500 transition-colors cursor-pointer"
        aria-label="Rimuovi dalla wishlist"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 sm:h-5 sm:w-5 text-white" 
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
      </button>
      
      {/* Layout per dispositivi mobili: immagine centrata */}
      <div className="flex flex-col items-center mb-3 sm:hidden pt-3">
        {/* Anteprima immagine */}
        <div className="relative w-32 h-40 mb-3">
          <Image
            src={item.card.imageUrl}
            alt={item.card.name}
            fill
            sizes="(max-width: 640px) 128px, 64px"
            className="object-contain rounded-md"
            priority={false}
          />
        </div>
      </div>
      
      {/* Anteprima immagine per desktop */}
      <div className="hidden sm:block relative w-16 h-20 mr-4 flex-shrink-0">
        <Image
          src={item.card.imageUrl}
          alt={item.card.name}
          fill
          sizes="64px"
          className="object-contain rounded-md"
          priority={false}
        />
      </div>
      
      {/* Layout per dispositivi mobili: info e prezzo in riga */}
      <div className="sm:hidden flex items-center justify-between px-2">
        {/* Informazioni carta */}
        <div className="flex-grow">
          <h3 className="font-medium text-white">
            {formatPokemonName(item.card.name)}
          </h3>
          <div className="flex items-center mt-1">
            <span className="text-gray-400 text-xs mr-1">Espansione:</span>
            <span className="text-white text-xs">{item.card.expansion}</span>
          </div>
        </div>
        
        {/* Prezzo */}
        <div className="flex-shrink-0 text-center ml-2">
          <div className="bg-[#FFB44F] text-[#1E2124] font-bold px-3 py-1 rounded-md text-sm">
            {item.price}€
          </div>
        </div>
      </div>
      
      {/* Layout per desktop: info carta */}
      <div className="hidden sm:block flex-grow mr-4">
        <h3 className="font-medium text-white">
          {formatPokemonName(item.card.name)}
        </h3>
        <div className="flex items-center mt-1">
          <span className="text-gray-400 text-sm mr-2">Espansione:</span>
          <span className="text-white text-sm">{item.card.expansion}</span>
        </div>
      </div>
      
      {/* Prezzo per desktop */}
      <div className="hidden sm:block flex-shrink-0 mr-6 text-center">
        <div className="text-xs text-gray-400 mb-1">Prezzo</div>
        <div className="bg-[#FFB44F] text-[#1E2124] font-bold px-3 py-1 rounded-md text-sm">
          {item.price}€
        </div>
      </div>
    </div>
  );
};

export default WishlistItemRow;