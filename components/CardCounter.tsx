'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card } from '@/lib/types';

interface CardCounterProps {
  expansion: string;
}

const CardCounter: React.FC<CardCounterProps> = ({ expansion }) => {
  const { data: session, status } = useSession();

  // Fetch cards for the expansion to count total and collected
  const { data: cards, isLoading } = useQuery<Card[]>({
    queryKey: ['cards', expansion, session?.user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/cards/${expansion}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      return response.json();
    },
    enabled: status === 'authenticated',
  });

  // Loading state mentre verifichiamo l'autenticazione
  if (status === 'loading') {
    return (
      <div className="w-full h-16 bg-[#36393E] text-white border-4 border-[#1E2124] px-4 rounded-xl flex items-center justify-center" style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}>
        <div className="animate-pulse">Verifica autenticazione...</div>
      </div>
    );
  }

  // Se l'utente non è autenticato, mostra un messaggio
  if (status === 'unauthenticated') {
    return (
      <div className="w-full h-16 bg-[#36393E] text-white border-4 border-[#1E2124] px-4 rounded-xl flex items-center justify-center" style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}>
        <div>Accedi per visualizzare la tua collezione</div>
      </div>
    );
  }

  if (isLoading || !cards) {
    return (
      <div className="w-full h-16 bg-[#36393E] text-white border-4 border-[#1E2124] px-4 rounded-xl flex items-center justify-center" style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}>
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  const totalCards = cards.length;
  const collectedCards = cards.filter(card => card.isCollected).length;

  return (
    <div className="w-full h-16 bg-[#36393E] text-white border-4 border-[#1E2124] px-4 rounded-xl flex items-center justify-between" style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}>
      <span className="text-sm tracking-wider">In collezione:</span>
      <span className="bg-transparent border-2 border-[#1E2124] px-3 py-1 rounded-lg text-sm">
        {collectedCards}/{totalCards} carte
      </span>
    </div>
  );
};

export default CardCounter;