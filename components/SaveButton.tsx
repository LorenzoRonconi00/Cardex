'use client';

import React, { useEffect, useState } from 'react';

interface SaveButtonProps {
  onSave: () => void;
  isSaving: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onSave, isSaving }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`fixed top-24 right-8 z-50 cursor-pointer rounded-md px-4 py-2 shadow-lg 
        transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}
        ${isSaving ? 'cursor-not-allowed' : ''}`}
      style={{ 
        backgroundColor: isSaving ? '#808080' : '#FFB44F', 
        color: '#1E2124',
        zIndex: 1001 // Z-index più alto per garantire che sia sopra altri elementi
      }}
      aria-label="Save changes"
    >
      {isSaving ? (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          <span className="font-medium">Salvando...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Salva</span>
        </div>
      )}
    </button>
  );
};

export default SaveButton;