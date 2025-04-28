'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

interface CardSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: Card) => void;
  slotNumber: number;
  existingCardIds: string[]; // ID delle carte già presenti nel binder corrente
}

const CardSelectionModal: React.FC<CardSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCard,
  slotNumber,
  existingCardIds = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);

  // Fetch all collected cards
  const { data: cards, isLoading, isError } = useQuery<Card[]>({
    queryKey: ['collectedCards'],
    queryFn: async () => {
      const response = await fetch('/api/cards');
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      return response.json();
    },
    enabled: isOpen // Only fetch when modal is open
  });

  // Filter cards based on search term and exclude cards already in binder
  useEffect(() => {
    if (!cards) {
      setFilteredCards([]);
      return;
    }

    // Filtra le carte escludendo quelle già inserite nel binder corrente
    const availableCards = cards.filter(card => 
      !existingCardIds.includes(card.id)
    );

    if (searchTerm.trim() === '') {
      setFilteredCards(availableCards);
    } else {
      const filtered = availableCards.filter(card => 
        card.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCards(filtered);
    }
  }, [searchTerm, cards, existingCardIds]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (previewCard) {
          setPreviewCard(null);
        } else {
          onClose();
        }
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, previewCard]);

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

  // Handle card preview
  const handleCardPreview = (card: Card) => {
    setPreviewCard(card);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal overlay - Posizionato fixed per coprire l'intero schermo */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 z-50"
        onClick={() => previewCard ? setPreviewCard(null) : onClose()}
      ></div>
      
      {/* Card selection modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2A2D31] rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[85vh] flex flex-col z-50">
        {/* Modal header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#40444B]">
          <h3 className="text-xl font-bold text-white">
            Seleziona una carta per lo slot {slotNumber}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Chiudi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="px-6 py-3 border-b border-[#40444B]">
          <div className="relative">
            <input
              type="text"
              placeholder="Cerca carte per nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-[#36393F] text-white rounded border border-[#4F545C] focus:border-blue-500 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isError ? (
            <div className="text-red-500 text-center py-4">
              Errore nel caricamento delle carte. Riprova più tardi.
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              {searchTerm ? 'Nessuna carta corrisponde alla ricerca.' : 'Nessuna carta disponibile da inserire.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => handleCardPreview(card)}
                >
                  <div className="relative pb-[140%]">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="absolute inset-0 w-full h-full object-contain rounded"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-2 text-center text-sm text-white truncate">
                    {card.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-[#40444B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#4F545C] text-white rounded hover:bg-[#5d6169] transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>

      {/* Card preview modal */}
      {previewCard && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-80 z-[60]"
            onClick={() => setPreviewCard(null)}
          ></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2A2D31] rounded-lg shadow-xl p-6 z-[70] max-w-lg w-10/12 text-center">
            <div className="relative w-full mx-auto" style={{ maxWidth: "300px" }}>
              <img
                src={previewCard.imageUrl}
                alt={previewCard.name}
                className="w-full h-auto rounded-lg shadow-lg mb-4"
              />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">{previewCard.name}</h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewCard(null);
                }}
                className="px-4 py-2 bg-[#4F545C] text-white rounded hover:bg-[#5d6169] transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCard(previewCard);
                  setPreviewCard(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Seleziona carta
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CardSelectionModal;