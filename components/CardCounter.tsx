'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface CardCounterProps {
  expansion: string;
}

const CardCounter: React.FC<CardCounterProps> = ({ expansion }) => {
  const { data: session, status } = useSession();

  // Utilizziamo la stessa query delle statistiche espansioni
  // ma estraiamo solo i dati relativi all'espansione corrente
  const { data: expansionStats, isLoading } = useQuery({
    queryKey: ['expansionStats', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/cards/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch expansion stats');
      }
      return response.json();
    },
    enabled: status === 'authenticated',
    staleTime: 60000, // 1 minuto di cache
  });

  // Estrai le statistiche solo per l'espansione corrente
  const currentExpansionStats = useMemo(() => {
    if (!expansionStats) return null;
    return expansionStats[expansion] || { total: 0, collected: 0, percentage: 0 };
  }, [expansionStats, expansion]);

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

  if (isLoading || !currentExpansionStats) {
    return (
      <div className="w-full h-16 bg-[#36393E] text-white border-4 border-[#1E2124] px-4 rounded-xl flex items-center justify-center" style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}>
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-16 bg-[#36393E] text-white border-4 border-[#1E2124] px-4 rounded-xl flex items-center justify-between" style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}>
      <span className="text-sm tracking-wider">Carte espansione:</span>
      <div className="flex flex-col items-end">
        <span className="bg-transparent border-2 border-[#1E2124] px-3 py-1 rounded-lg text-sm">
          {currentExpansionStats.collected}/{currentExpansionStats.total} carte
        </span>
      </div>
    </div>
  );
};

export default CardCounter;