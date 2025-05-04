'use client';

import React, { useEffect } from 'react';
import { Card } from '@/lib/types';

interface CardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
  slotNumber: number;
  onRemoveCard: (slotNumber: number) => void;
}

const CardPreviewModal: React.FC<CardPreviewModalProps> = ({
  isOpen,
  onClose,
  card,
  slotNumber,
  onRemoveCard
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 z-[70]"
        onClick={onClose}
      ></div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2A2D31] rounded-lg shadow-xl p-6 z-[80] max-w-lg w-10/12 text-center">
        <div className="relative w-full mx-auto mb-4" style={{ maxWidth: "300px" }}>
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{card.name}</h3>
        <p className="text-gray-400 mb-4">Slot {slotNumber}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 bg-[#4F545C] text-white rounded hover:bg-[#5d6169] transition-colors"
          >
            Chiudi
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Richiesta di rimozione carta dallo slot:', slotNumber);
              onRemoveCard(slotNumber);
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Rimuovi carta
          </button>
        </div>
      </div>
    </>
  );
};

export default CardPreviewModal;