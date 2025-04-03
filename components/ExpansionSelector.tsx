'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Expansion } from '@/lib/types';

interface ExpansionSelectorProps {
  expansions: Expansion[];
  currentExpansion?: string;
  onChange: (expansion: string) => void;
}

const ExpansionSelector: React.FC<ExpansionSelectorProps> = ({
  expansions,
  currentExpansion,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);

  // Find current expansion details
  const current = expansions.find(exp => exp.slug === currentExpansion) || expansions[0];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (slug: string) => {
    onChange(slug);
    setIsOpen(false);
  };

  // Handler per prevenire lo scroll della pagina quando si scrolla nel dropdown
  const handleDropdownWheel = (e: WheelEvent) => {
    if (dropdownListRef.current) {
      // Calcola se lo scroll può avvenire all'interno del dropdown
      const { scrollTop, scrollHeight, clientHeight } = dropdownListRef.current;
      
      // Scroll verso il basso
      if (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight) {
        e.preventDefault();
      }
      // Scroll verso l'alto
      else if (e.deltaY < 0 && scrollTop <= 0) {
        e.preventDefault();
      }
      // Altrimenti permetti lo scroll all'interno del dropdown
      else {
        e.preventDefault();
        dropdownListRef.current.scrollTop += e.deltaY;
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Aggiungi event listener per wheel event quando il dropdown è aperto
  useEffect(() => {
    const currentDropdownList = dropdownListRef.current;
    
    if (isOpen && currentDropdownList) {
      currentDropdownList.addEventListener('wheel', handleDropdownWheel, { passive: false });
    }
    
    return () => {
      if (currentDropdownList) {
        currentDropdownList.removeEventListener('wheel', handleDropdownWheel);
      }
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative w-full" style={{ zIndex: 10 }}>
      <button
        onClick={toggleDropdown}
        className="w-full h-16 flex items-center justify-between rounded-xl px-4 cursor-pointer border-4 border-[#1E2124] text-white transition-all duration-200 ease-in-out hover:bg-[#2F3136] bg-[#36393E]"
        style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}
      >
        {current?.logo ? (
          <div className="h-10 w-40 relative mx-auto">
            <Image
              src={current.logo}
              alt={current.name}
              fill
              sizes="160px"
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <span className="text-white mx-auto">Seleziona Espansione</span>
        )}
        <svg
          className={`h-5 w-5 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 w-full mt-2 rounded-md shadow-lg focus:outline-none bg-[#1E2124]" 
          style={{ zIndex: 50 }}
        >
          <div 
            ref={dropdownListRef}
            className="max-h-80 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            style={{ scrollbarWidth: 'thin' }}
          >
            {expansions.map((expansion) => (
              <button
                key={expansion.slug}
                className={`w-full px-4 py-2 text-sm text-left flex items-center justify-center ${
                  expansion.slug === currentExpansion ? 'bg-[#36393E]' : 'hover:bg-[#36393E]'
                }`}
                onClick={() => handleSelect(expansion.slug)}
              >
                {expansion.logo && (
                  <div className="h-14 w-48 relative cursor-pointer">
                    <Image
                      src={expansion.logo}
                      alt={expansion.name}
                      fill
                      sizes="192px"
                      className="object-contain"
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpansionSelector;