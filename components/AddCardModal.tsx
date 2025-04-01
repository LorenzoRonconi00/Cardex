'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/lib/types';
import { formatPokemonName } from '@/lib/utils';

interface AddCardModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  onSave: (price: number) => void;
  isLoading: boolean;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ 
  card, 
  isOpen, 
  onClose, 
  onSave,
  isLoading
}) => {
  const [price, setPrice] = useState<number>(0);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="bg-[#282B30] rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-4">
          Aggiungi alla Wishlist
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Card image */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-48 h-64">
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                sizes="192px"
                className="object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Form */}
          <div className="w-full md:w-1/2">
            <h3 className="text-lg font-medium text-white mb-4">
              {formatPokemonName(card.name)}
            </h3>
            
            <div className="mb-4">
              <label 
                htmlFor="price" 
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Prezzo target (€)
              </label>
              <input
                type="number"
                id="price"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-[#1E2124] text-white border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-white bg-gray-600 rounded-lg mr-2 hover:bg-gray-700 cursor-pointer"
                disabled={isLoading}
              >
                Annulla
              </button>
              <button
                onClick={() => onSave(price)}
                disabled={isLoading}
                className="px-4 py-2 text-[#1E2124] bg-[#FFB44F] hover:bg-[#FFA22F] rounded-lg flex items-center cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Salvando...
                  </>
                ) : (
                  'Salva'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCardModal;