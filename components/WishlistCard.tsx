'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/lib/types';
import { formatPokemonName } from '@/lib/utils';

interface WishlistCardProps {
  card: Card;
  onAdd: () => void;
}

const WishlistCard: React.FC<WishlistCardProps> = ({ card, onAdd }) => {
  return (
    <div className="flex flex-col items-center transition-transform duration-200 hover:scale-105 cursor-pointer">
      {/* Card container with background */}
      <div
        className="relative rounded-xl overflow-visible bg-[#1E2124] w-full shadow-xl"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        style={{
          aspectRatio: '2.5/3.8',
          boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Add button in top left */}
        <div
          className="absolute -top-2.5 -left-2.5 z-10 w-10 h-10 rounded-md bg-[#36393E] border border-gray-700 flex items-center justify-center shadow-md hover:bg-[#4a4e57] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>

        {/* The actual card image with padding */}
        <div className="w-full h-[90%] flex items-center justify-center p-3 pt-4">
          <div className="relative w-full h-full">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="transition-all duration-300 ease-in-out rounded-lg"
              style={{ objectFit: 'contain' }}
              priority={false}
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

export default WishlistCard;