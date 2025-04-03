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
    queryKey: ['cards', expansion, session?.user?.id], // Includi l'ID utente nella query key
    queryFn: async () => {
      const response = await fetch(`/api/cards/${expansion}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      return response.json();
    },
    enabled: status === 'authenticated', // Esegui la query solo se l'utente è autenticato
  });

  // Loading state mentre verifichiamo l'autenticazione
  if (status === 'loading') {
    return (
      <div className="bg-[#36393E] text-white px-4 py-2 rounded-lg flex items-center">
        <div className="animate-pulse">Verifica autenticazione...</div>
      </div>
    );
  }

  // Se l'utente non è autenticato, mostra un messaggio
  if (status === 'unauthenticated') {
    return (
      <div className="bg-[#36393E] text-white px-4 py-2 rounded-lg flex items-center">
        <div>Accedi per visualizzare la tua collezione</div>
      </div>
    );
  }

  if (isLoading || !cards) {
    return (
      <div className="bg-[#36393E] text-white px-4 py-2 rounded-lg flex items-center">
        <div className="animate-pulse">Caricamento...</div>
      </div>
    );
  }

  const totalCards = cards.length;
  const collectedCards = cards.filter(card => card.isCollected).length;

  return (
    <div className="bg-[#36393E] text-white border-4 border-[#1E2124] px-4 py-4 rounded-xl flex items-center gap-x-4" style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}>
      <span className="text-sm tracking-wider">In collezione:</span>
      <span className="bg-transparent border-2 border-[#1E2124] px-3 py-1 rounded-lg text-sm">
        {collectedCards}/{totalCards} carte
      </span>
    </div>
  );
};

export default CardCounter;