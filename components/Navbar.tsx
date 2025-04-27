'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState<string>('/');
  const [indicatorPosition, setIndicatorPosition] = useState<number>(0);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Recupero numero di elementi nella wishlist
  const { data: wishlistItems } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await fetch('/api/wishlist');
      if (!response.ok) {
        throw new Error('Impossibile recuperare gli elementi della wishlist');
      }
      return response.json();
    },
    staleTime: 60000,
  });

  // Numero di elementi nella wishlist
  const wishlistCount = wishlistItems?.length || 0;

  // Formatto il conteggio per il badge (99+ se superiore a 99)
  const formattedCount = wishlistCount > 99 ? '99+' : wishlistCount.toString();

  // Calcolo posizione indicatore
  useEffect(() => {
    // Determino posizione iniziale dell'indicatore
    if (isInitialMount) {
      if (pathname.includes('/wishlist')) {
        setActiveRoute('/wishlist');
        setIndicatorPosition(1);
      } else if (pathname.includes('/binders')) {
        setActiveRoute('/binders');
        setIndicatorPosition(2);
      } else {
        setActiveRoute('/');
        setIndicatorPosition(0);
      }
      setTimeout(() => setIsInitialMount(false), 50);
    } else {
      // Aggiorno dopo mount iniziale
      if (pathname.includes('/wishlist')) {
        setActiveRoute('/wishlist');
        setIndicatorPosition(1);
      } else if (pathname.includes('/binders')) {
        setActiveRoute('/binders');
        setIndicatorPosition(2);
      } else {
        setActiveRoute('/');
        setIndicatorPosition(0);
      }
    }
  }, [pathname, isInitialMount]);

  const navigateTo = (route: string, position: number) => {
    if (activeRoute === route) return;
    
    setActiveRoute(route);
    setIndicatorPosition(position);
    router.push(route);
  };

  return (
    <nav className="w-20 h-full bg-[#1E2124] flex flex-col items-center pt-4 shadow-lg">
      {/* Logo */}
      <div 
        className="w-12 h-12 mb-10 cursor-pointer"
        onClick={() => navigateTo('/', 0)}
      >
        <Image
          src="/images/logoCardex.svg"
          alt="Cardex Logo"
          width={48}
          height={48}
          style={{ width: '100%', height: 'auto' }}
          className="object-contain"
        />
      </div>
      
      {/* Oggetti di navigazione */}
      <div className="relative flex flex-col items-center space-y-3 w-full">
        {/* Indicatore di posizione */}
        <div 
          className={`absolute left-0 w-3 h-3 ${isInitialMount ? '' : 'transition-all duration-300'}`}
          style={{ 
            top: `${20 + indicatorPosition * 56}px`,
          }}
        >
          <div className="w-0 h-0 
            border-t-[8px] border-t-transparent 
            border-l-[12px] border-l-white 
            border-b-[8px] border-b-transparent">
          </div>
        </div>
        
        {/* Bottone Card List */}
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all
            ${activeRoute === '/' ? 'bg-[#36393E]' : 'bg-[#36393E]/70 hover:bg-[#36393E]/90'}`}
          onClick={() => navigateTo('/', 0)}
        >
          <Image
            src="/images/cardlist.svg"
            alt="Card List"
            width={28}
            height={28}
            style={{ width: 'auto', height: 'auto', maxWidth: '28px', maxHeight: '28px' }}
          />
        </div>
        
        {/* Bottone Wishlist */}
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all relative
            ${activeRoute === '/wishlist' ? 'bg-[#36393E]' : 'bg-[#36393E]/70 hover:bg-[#36393E]/90'}`}
          onClick={() => navigateTo('/wishlist', 1)}
        >
          <Image
            src="/images/wishlist.svg"
            alt="Wishlist"
            width={22}
            height={22}
            style={{ width: 'auto', height: 'auto', maxWidth: '22px', maxHeight: '22px' }}
          />
          
          {/* Badge counter */}
          {wishlistCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full flex items-center justify-center">
              <span className={`
                ${formattedCount.length > 2 ? 'text-xs px-1' : 'text-xs px-1.5'} 
                py-0.5 min-w-5 h-5 flex items-center justify-center font-medium
              `}>
                {formattedCount}
              </span>
            </div>
          )}
        </div>

        {/* Bottone Binders */}
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all
            ${activeRoute === '/binders' ? 'bg-[#36393E]' : 'bg-[#36393E]/70 hover:bg-[#36393E]/90'}`}
          onClick={() => navigateTo('/binders', 2)}
        >
          <Image
            src="/images/binder.svg"
            alt="Binders"
            width={24}
            height={24}
            style={{ width: 'auto', height: 'auto', maxWidth: '24px', maxHeight: '24px' }}
          />
        </div>
      </div>
      
      {/* Bottone Logout - TODO: Al momento non esegue nulla */}
      <div 
        className="w-12 h-12 bg-[#36393E]/70 hover:bg-[#36393E]/90 rounded-xl flex items-center justify-center cursor-pointer shadow-lg mt-auto mb-6 transition-all"
        onClick={() => {}}
      >
        <Image
          src="/images/logout.svg"
          alt="Logout"
          width={28}
          height={28}
          style={{ width: 'auto', height: 'auto', maxWidth: '28px', maxHeight: '28px' }}
        />
      </div>
    </nav>
  );
};

export default Navbar;