'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/lib/types';
import { formatPokemonName } from '@/lib/utils';

interface PokemonCardProps {
  card: Card;
  onToggleCollected: (id: string, isCollected: boolean) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ card, onToggleCollected }) => {
  const handleClick = () => {
    onToggleCollected(card.id, !card.isCollected);
  };

  return (
    <div 
      className="flex flex-col items-center transition-transform duration-200 hover:scale-102 cursor-pointer px-1 sm:px-2"
      onClick={handleClick}
    >
      {/* Card container with background */}
      <div 
        className="relative rounded-xl overflow-visible bg-[#1E2124] w-[75%] sm:w-[90%] md:w-[85%] shadow-xl"
        style={{
          aspectRatio: '2.5/3.8',  // Proporzione aumentata per lasciare spazio al nome
          boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Checkbox in top left - positioned to overlap slightly */}
        <div 
          className="absolute -top-1.5 -left-1.5 sm:-top-2.5 sm:-left-2.5 z-10 w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-[#36393E] border-2 sm:border-3 border-[#1E2124] flex items-center justify-center shadow-md"
          style={{zIndex: 5}}
        >
          {card.isCollected && (
            <Image
              src="/images/check.svg"
              alt="Collected"
              width={16}
              height={16}
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
              priority
            />
          )}
        </div>
        
        {/* The actual card image with padding */}
        <div className="w-full h-[90%] flex items-center justify-center p-2 sm:p-3 pt-2 sm:pt-4">
          <div className="relative w-full h-full">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 75vw, (max-width: 768px) 30vw, (max-width: 1024px) 25vw, 20vw"
              className={`transition-all duration-300 ease-in-out rounded-lg ${card.isCollected ? '' : 'grayscale'}`}
              style={{ objectFit: 'contain' }}
              loading="lazy"
            />
          </div>
        </div>
        
        {/* Card name - now inside the container at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[10%] flex items-center justify-center">
          <h3 className="font-semibold text-white text-xs sm:text-sm px-1 sm:px-2 truncate w-full text-center">
            {formatPokemonName(card.name)}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default PokemonCard;