'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useParams, useRouter } from 'next/navigation';

// Componente principale per la visualizzazione del binder
const BinderView: React.FC = () => {
  const params = useParams();
  const binderId = params.id as string;
  const router = useRouter();
  
  // Funzione per tornare alla pagina precedente
  const handleGoBack = () => {
    router.back();
  };
  
  // Fetch binder details
  const { data, isLoading, isError } = useQuery({
    queryKey: ['binder', binderId],
    queryFn: async () => {
      const response = await fetch(`/api/binders/${binderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch binder');
      }
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch binder');
      }
      
      return result.data;
    }
  });

  const binder = data;

  // Stato di caricamento
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  // Stato di errore
  if (isError || !binder) {
    return (
      <Layout>
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded">
          Errore nel caricamento del raccoglitore. Riprova più tardi.
        </div>
      </Layout>
    );
  }

  // Visualizzazione del binder
  return (
    <Layout>
      <div className="w-full px-6 py-6">
        {/* Pulsante per tornare indietro */}
        <button 
          onClick={handleGoBack}
          className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          aria-label="Torna indietro"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          <span>Torna alla raccolta</span>
        </button>
        
        {/* Titolo del binder con il colore personalizzato */}
        <h1 
          className="text-2xl font-bold text-white mb-6 pb-2 border-b-2" 
          style={{ borderColor: binder.color }}
        >
          {binder.name}
        </h1>
        
        {/* Contenuto del binder - aggiungi qui il contenuto desiderato */}
        <div className="bg-[#2F3136] rounded-lg p-6">
          
        </div>
      </div>
    </Layout>
  );
};

export default BinderView;