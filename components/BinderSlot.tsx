'use client';

import React from 'react';
import { Card } from '@/lib/types';

interface BinderSlotProps {
  slotNumber: number;
  card: Card | null;
  onSlotClick: (slotNumber: number) => void;
  onCardPreview: (card: Card, slotNumber: number) => void;
  isNewlyAdded?: boolean;
}

const BinderSlot: React.FC<BinderSlotProps> = ({ 
  slotNumber, 
  card, 
  onSlotClick,
  onCardPreview,
  isNewlyAdded = false
}) => {
  // Gestisce il click sullo slot
  const handleClick = () => {
    if (card) {
      // Se c'è già una carta, apri la preview
      onCardPreview(card, slotNumber);
    } else {
      // Se lo slot è vuoto, apri il modal di selezione
      onSlotClick(slotNumber);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`pocket relative bg-[#222222] rounded border border-dashed border-[#444444] flex items-center justify-center w-full h-full cursor-pointer ${card ? 'pocket-filled' : ''}`}
      style={{
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)"
      }}
    >
      {card ? (
        <div 
          className={`card-container absolute inset-0 flex items-center justify-center ${isNewlyAdded ? 'animate-card-enter' : ''}`}
        >
          {/* Contenitore con aspect ratio 2:3 (proporzioni standard delle carte) */}
          <div className="relative w-[85%] h-[85%]" style={{ aspectRatio: '2/3' }}>
            <img 
              src={card.imageUrl} 
              alt={card.name}
              className="w-full h-full object-contain"
              loading={slotNumber <= 6 ? "eager" : "lazy"}
            />
          </div>
        </div>
      ) : (
        <div className="card-placeholder flex flex-col items-center justify-center">
          <span className="text-[#555555] text-xs sm:text-sm text-center">
            <span className="hidden sm:inline">Slot</span> #{slotNumber}
          </span>
          
          {/* Icona "+" */}
          <div className="text-[#444444] mt-1">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 sm:h-5 sm:w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinderSlot;