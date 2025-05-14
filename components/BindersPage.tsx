'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Binder } from '@/lib/types';

interface BinderResponse {
  _id: string;
  name: string;
  color: string;
  userId: string;
  slotCount?: number;
  createdAt: string;
}

// Create Binder Modal Component
const CreateBinderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, slotCount: number) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ec6246'); // default to Charizard color
  const [slotCount, setSlotCount] = useState(180); // default to 180 slots
  const [error, setError] = useState('');

  // Per debug
  useEffect(() => {
    console.log("Current slotCount in modal state:", slotCount, typeof slotCount);
  }, [slotCount]);

  // Available color options using hex values directly
  const pokemonOptions = [
    { name: 'charizard', image: 'charizard_logo_template.png', value: '#ec6246' },
    { name: 'blastoise', image: 'blastoise_logo_template.png', value: '#1d5ea4' },
    { name: 'venusaur', image: 'venusaur_logo_template.png', value: '#58a7a2' },
    { name: 'pikachu', image: 'pikachu_logo_template.png', value: '#f4ae01' },
    { name: 'gengar', image: 'gengar_logo_template.png', value: '#bb77ff' },
    { name: 'umbreon', image: 'umbreon_logo_template.png', value: '#3d6584' },
    { name: 'snorlax', image: 'snorlax_logo_template.png', value: '#ecdfcf' },
    { name: 'dragonite', image: 'dragonite_logo_template.png', value: '#f9be00' },
    { name: 'lugia', image: 'lugia_logo_template.png', value: '#d9dcef' },
    { name: 'ho-oh', image: 'ho-oh_logo_template.png', value: '#e54b33' },
  ];

  // Available slot count options
  const slotCountOptions = [
    { value: 180, label: '180 tasche' },
    { value: 360, label: '360 tasche' },
    { value: 540, label: '540 tasche' },
    { value: 720, label: '720 tasche' },
  ];

  // Funzione esplicita per gestire il cambio del select
  const handleSlotCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(e.target.value, 10);
    console.log("Select changed:", e.target.value, "Parsed to:", newValue, "Type:", typeof newValue);
    setSlotCount(newValue);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Il nome è obbligatorio');
      return;
    }

    console.log("Submitting form with slotCount:", slotCount, typeof slotCount);
    onSave(name, color, slotCount);
    setName('');
    setColor('#ec6246'); // reset to Charizard color
    setSlotCount(180); // reset to default slot count
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#36393E] rounded-lg w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Crea Binder</h2>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#2F3136] border border-[#202225] rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Inserisci un nome..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Numero di slot</label>
          <select
            value={slotCount}
            onChange={handleSlotCountChange}
            className="w-full bg-[#2F3136] border border-[#202225] rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {slotCountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-gray-400 text-xs mt-1">
            Il numero di slot determina quante carte puoi inserire nel raccoglitore
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Valore attuale: {slotCount} (type: {typeof slotCount})
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Tema</label>
          <div className="grid grid-cols-5 gap-3">
            {pokemonOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => setColor(option.value)}
                className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${color === option.value
                    ? 'border-white shadow-lg transform scale-105'
                    : 'border-transparent hover:border-gray-400'
                  }`}
                style={{ backgroundColor: option.value }}
                aria-label={`Color ${option.name}`}
              >
                <img
                  src={`/images/pokemon_palettes/${option.image}`}
                  alt={option.name}
                  className="w-full h-full object-contain p-1"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2F3136] hover:bg-[#202225] text-white rounded transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

// Binder Card Component
const BinderCard: React.FC<{
  binder: Binder;
  onDelete?: (id: string) => void;
}> = ({ binder, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  
  // Pokemon palette mapping to find the correct logo
  const getPokermonLogo = (color: string) => {
    const colorToPokemon: { [key: string]: string } = {
      '#ec6246': 'charizard_logo_template.png',
      '#1d5ea4': 'blastoise_logo_template.png',
      '#58a7a2': 'venusaur_logo_template.png',
      '#f4ae01': 'pikachu_logo_template.png',
      '#bb77ff': 'gengar_logo_template.png',
      '#3d6584': 'umbreon_logo_template.png',
      '#ecdfcf': 'snorlax_logo_template.png',
      '#f9be00': 'dragonite_logo_template.png',
      '#d9dcef': 'lugia_logo_template.png',
      '#e54b33': 'ho-oh_logo_template.png',
    };
    
    return colorToPokemon[color] || 'charizard_logo_template.png'; // default to Charizard
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking the delete button
    if (e.target instanceof Element && 
        (e.target.closest('button') || e.target.tagName === 'BUTTON' || e.target.tagName === 'svg' || e.target.tagName === 'path')) {
      return;
    }
    
    // Navigate to the binder detail page
    router.push(`/binders/${binder.id}`);
  };
  
  return (
    <div className="relative group">
      <div 
        onClick={handleCardClick}
        className={`bg-[#2F3136] rounded-lg p-4 flex flex-col items-center transition-all hover:transform hover:scale-105 hover:shadow-lg cursor-pointer`}
      >
        {/* Binder Image with Pokemon Logo */}
        <div 
          className="w-32 h-40 mb-2 rounded-md relative"
          style={{ backgroundColor: binder.color }}
        >
          {/* Binder rings on the left */}
          <div className="absolute left-1 top-4 bottom-4 w-1 flex flex-col justify-evenly">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className="w-3 h-3 rounded-full bg-white bg-opacity-30 -ml-1"
              />
            ))}
          </div>
          
          {/* Pokemon logo in the center */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={`/images/pokemon_palettes/${getPokermonLogo(binder.color)}`}
              alt="Pokemon logo"
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>
        
        {/* Binder Name */}
        <h3 className="text-white font-medium mt-2 text-center truncate w-full">
          {binder.name}
        </h3>
        
        {/* Slot Count Badge */}
        <div className="mt-1 px-2 py-0.5 bg-gray-700 rounded-full text-gray-300 text-xs">
          {binder.slotCount || 180} tasche
        </div>
        
        {/* Delete button (visible on hover) */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 transition-opacity"
            aria-label="Delete binder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#36393E] rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-2">Conferma eliminazione</h3>
            <p className="text-gray-300 mb-4">
              Sei sicuro di voler eliminare il raccoglitore &quot;{binder.name}&quot;?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-[#2F3136] hover:bg-[#202225] text-white rounded"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (onDelete) {
                    onDelete(binder.id);
                  }
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// New Binder Card Component
const NewBinderCard: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-[#2F3136] rounded-lg p-4 flex flex-col items-center justify-center h-full cursor-pointer transition-all hover:bg-[#36393E] hover:shadow-lg"
      style={{ minHeight: '176px' }} // Match the height of regular binder cards
    >
      <div className="w-16 h-16 rounded-full bg-[#36393E] flex items-center justify-center mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="text-gray-400 text-center font-medium">Crea nuovo</span>
    </div>
  );
};

// Main Binders Page Component
const BindersPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch binders
  const { data: binders, isLoading, isError } = useQuery({
    queryKey: ['binders'],
    queryFn: async () => {
      const response = await fetch('/api/binders');
      if (!response.ok) {
        throw new Error('Failed to fetch binders');
      }
      const data = await response.json();
      return data.data;
    }
  });

  // Create binder mutation
  const createBinderMutation = useMutation({
    mutationFn: async (binderData: { name: string; color: string; slotCount: number }) => {
      const response = await fetch('/api/binders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(binderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create binder');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binders'] });
      setModalOpen(false);
    },
  });

  // Delete binder mutation
  const deleteBinderMutation = useMutation({
    mutationFn: async (binderId: string) => {
      console.log("Deleting binder with ID:", binderId); // Debug log
      const response = await fetch(`/api/binders/${binderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete binder');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binders'] });
    },
  });

  const handleCreateBinder = (name: string, color: string, slotCount: number) => {
    // Controllo esplicito dei tipi
    const bindingData = {
      name, 
      color, 
      slotCount: Number(slotCount) // Assicurarsi che sia un numero
    };
    
    console.log("Creating binder with data:", bindingData);
    createBinderMutation.mutate(bindingData);
  };

  const handleDeleteBinder = (id: string) => {
    console.log("handleDeleteBinder called with ID:", id); // Debug log
    deleteBinderMutation.mutate(id);
  };

  return (
    <Layout>
      <div className="px-6 py-6 w-full">
        <h1 className="text-2xl font-bold text-white mb-6">I tuoi Binder</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded">
            Errore nel caricamento dei Binder. Riprova più tardi.
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {/* Existing Binders (first) */}
            {binders?.map((binder: BinderResponse) => (
              <div key={binder._id} className="w-full md:w-[15%] min-w-[150px]">
                <BinderCard 
                  binder={{
                    id: binder._id,
                    name: binder.name,
                    color: binder.color,
                    userId: binder.userId,
                    slotCount: binder.slotCount || 180, // Add default if missing
                    createdAt: binder.createdAt
                  }} 
                  onDelete={handleDeleteBinder}
                />
              </div>
            ))}
            
            {/* New Binder Card (last) */}
            <div key="new-binder" className="w-full md:w-[15%] min-w-[150px]">
              <NewBinderCard onClick={() => setModalOpen(true)} />
            </div>
          </div>
        )}
      </div>
      
      {/* Create Binder Modal */}
      <CreateBinderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreateBinder}
      />
    </Layout>
  );
};



export default BindersPage;