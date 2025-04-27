'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Binder } from '@/lib/types';

// Create Binder Modal Component
const CreateBinderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#DC2626'); // red-600 hex value
  const [error, setError] = useState('');

  // Available color options using hex values directly
  const colorOptions = [
    { name: 'red', value: '#DC2626' },       // red-600
    { name: 'blue', value: '#2563EB' },      // blue-600
    { name: 'green', value: '#16A34A' },     // green-600
    { name: 'yellow', value: '#EAB308' },    // yellow-500
    { name: 'purple', value: '#9333EA' },    // purple-600
    { name: 'pink', value: '#EC4899' },      // pink-500
    { name: 'orange', value: '#F97316' },    // orange-500
    { name: 'teal', value: '#0D9488' },      // teal-600
    { name: 'cyan', value: '#0891B2' },      // cyan-600
    { name: 'indigo', value: '#4F46E5' },    // indigo-600
    { name: 'black', value: '#111827' },     // gray-900
  ];

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Il nome è obbligatorio');
      return;
    }
    
    onSave(name, color);
    setName('');
    setColor('#DC2626');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#36393E] rounded-lg w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Crea nuovo raccoglitore</h2>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Nome raccoglitore</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#2F3136] border border-[#202225] rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Inserisci un nome..."
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Colore</label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => setColor(option.value)}
                className={`w-8 h-8 rounded-full ${
                  color === option.value ? 'ring-2 ring-white ring-offset-2 ring-offset-[#36393E]' : ''
                }`}
                style={{ backgroundColor: option.value }}
                aria-label={`Color ${option.name}`}
              />
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
  
  return (
    <div className="relative group">
      <div 
        className={`bg-[#2F3136] rounded-lg p-4 flex flex-col items-center transition-all hover:transform hover:scale-105 hover:shadow-lg`}
      >
        {/* Binder Image */}
        <div 
          className="w-32 h-40 mb-2 rounded-md flex items-center justify-center"
          style={{ backgroundColor: binder.color }}
        >
          <div className="w-20 h-28 bg-white bg-opacity-10 rounded">
            {/* This can be replaced with an actual binder image if available */}
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white opacity-30">📚</span>
            </div>
          </div>
        </div>
        
        {/* Binder Name */}
        <h3 className="text-white font-medium mt-2 text-center truncate w-full">
          {binder.name}
        </h3>
        
        {/* Delete button (visible on hover) */}
        {onDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
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
    mutationFn: async (binderData: { name: string; color: string }) => {
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
  
  const handleCreateBinder = (name: string, color: string) => {
    createBinderMutation.mutate({ name, color });
  };
  
  const handleDeleteBinder = (id: string) => {
    console.log("handleDeleteBinder called with ID:", id); // Debug log
    deleteBinderMutation.mutate(id);
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold text-white mb-6">I tuoi raccoglitori</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded">
            Errore nel caricamento dei raccoglitori. Riprova più tardi.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* New Binder Card (always first) */}
            <NewBinderCard onClick={() => setModalOpen(true)} key="new-binder" />
            
            {/* Existing Binders */}
            {binders?.map((binder: any) => (
              <BinderCard 
                key={binder._id} 
                binder={{
                  id: binder._id,
                  name: binder.name,
                  color: binder.color,
                  userId: binder.userId,
                  createdAt: binder.createdAt
                }} 
                onDelete={handleDeleteBinder}
              />
            ))}
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