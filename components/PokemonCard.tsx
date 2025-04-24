'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/lib/types';
import { formatPokemonName } from '@/lib/utils';

interface PokemonCardProps {
  card: Card;
  onToggleCollected: (id: string, isCollected: boolean) => void;
  onAddToWishlist?: () => void; // Nuovo prop per aggiungere alla wishlist
  isInWishlist?: boolean; // Nuovo prop per verificare se la carta è già nella wishlist
}

const PokemonCard: React.FC<PokemonCardProps> = ({ 
  card, 
  onToggleCollected,
  onAddToWishlist,
  isInWishlist = false
}) => {
  const handleClick = () => {
    onToggleCollected(card.id, !card.isCollected);
  };

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
        {onAddToWishlist && (
          <div
            className="absolute -top-2.5 -right-2.5 z-10 w-10 h-10 rounded-md bg-[#36393E] border border-gray-700 flex items-center justify-center shadow-md hover:bg-[#4a4e57] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist();
            }}
          >
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
          </div>
        )}

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