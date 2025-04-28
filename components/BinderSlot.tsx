'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/lib/types';

interface BinderSlotProps {
  slotNumber: number;
  card: Card | null;
  onSlotClick: (slotNumber: number) => void;
  onCardPreview: (card: Card, slotNumber: number) => void;
  isNewlyAdded?: boolean; // Flag per indicare se la carta è stata appena aggiunta
}

const BinderSlot: React.FC<BinderSlotProps> = ({ 
  slotNumber, 
  card, 
  onSlotClick,
  onCardPreview,
  isNewlyAdded = false // Default a false
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
          <img 
            src={card.imageUrl} 
            alt={card.name}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="card-placeholder absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#555555] text-xs">
          {`Slot ${slotNumber}`}
        </div>
      )}
    </div>
  );
};

export default BinderSlot;