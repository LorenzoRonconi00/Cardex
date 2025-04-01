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

  // Find current expansion details
  const current = expansions.find(exp => exp.slug === currentExpansion) || expansions[0];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (slug: string) => {
    onChange(slug);
    setIsOpen(false);
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

  return (
    <div ref={dropdownRef} className="dropdown relative z-40">
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-6 rounded-md px-3 py-2 cursor-pointer border-2 border-[#1E2124] text-white transition-all duration-200 ease-in-out hover:bg-[#2F3136]"
        style={{boxShadow: '0 12px 15px -3px rgba(0, 0, 0, 0.4)'}}
      >
        {current?.logo ? (
          <div className="h-16 w-48 relative">
            <Image
              src={current.logo}
              alt={current.name}
              fill
              sizes="250px"
              className="object-contain"
            />
          </div>
        ) : (
          <span className="text-white">Seleziona Espansione</span>
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
        <div className="absolute right-0 mt-2 rounded-md py-1 px-5 shadow-lg focus:outline-none bg-[#1E2124] z-50">
          {expansions.map((expansion) => (
            <button
              key={expansion.slug}
              className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between ${
                expansion.slug === currentExpansion ? 'bg-[#36393E]' : 'hover:bg-[#36393E]'
              }`}
              onClick={() => handleSelect(expansion.slug)}
            >
              {expansion.logo && (
                <div className="h-16 w-48 relative cursor-pointer">
                  <Image
                    src={expansion.logo}
                    alt={expansion.name}
                    fill
                    sizes="250px"
                    className="object-contain"
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpansionSelector;